const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

// const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const config = JSON.parse(process.env.CONFIG_KEY);

const PORT = 8080;

const formatLogMessage = (exchange, pair, price) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] Exchange: ${exchange}, Market Pair: ${pair}, Price: ${price}`;
};

const handleError = (exchange, pair, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] Error reconnecting to ${exchange}, Market Pair: ${pair}: ${message}`;
};

const connectToBinance = (pair, sendMessage) => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@trade`);
    ws.on('message', (data) => {
        const parsed = JSON.parse(data);
        sendMessage('Binance', pair, parsed.p);
    });
    ws.on('close', () => {
        console.log(handleError('Binance', pair, 'Connection closed. Reconnecting...'));
        setTimeout(() => connectToBinance(pair, sendMessage), 5000);
    });
    ws.on('error', (err) => {
        console.log(handleError('Binance', pair, err.message));
    });
};

const connectToBybit = (pair, sendMessage) => {
    const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');
    ws.on('open', () => {
        ws.send(JSON.stringify({ op: 'subscribe', args: [`tickers.${pair}`] }));
    });
    ws.on('message', (data) => {
        const parsed = JSON.parse(data);
        if (parsed.type === 'snapshot') {
            sendMessage('Bybit', pair, parsed.data.lastPrice);
        }
    });
    ws.on('close', () => {
        console.log(handleError('Bybit', pair, 'Connection closed. Reconnecting...'));
        setTimeout(() => connectToBybit(pair, sendMessage), 5000);
    });
    ws.on('error', (err) => {
        console.log(handleError('Bybit', pair, err.message));
    });
};

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const exchange = urlParams.get('exchange');
    const pair = urlParams.get('pair');

    const sendMessage = (exch, pr, price) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(formatLogMessage(exch, pr, price));
        }
    };

    if (!exchange && !pair) {
        config.exchanges.forEach((exch) => {
            exch.pairs.forEach((pr) => {
                if (exch.name === 'Binance') {
                    connectToBinance(pr, sendMessage);
                } else if (exch.name === 'Bybit') {
                    connectToBybit(pr, sendMessage);
                }
            });
        });
    } else if (exchange && pair) {
        if (exchange === 'Binance') {
            connectToBinance(pair, sendMessage);
        } else if (exchange === 'Bybit') {
            connectToBybit(pair, sendMessage);
        } else {
            ws.send('Error: Unsupported exchange. Supported exchanges are Binance and Bybit.');
            ws.close();
        }
    } else {
        ws.send('Error: Both `exchange` and `pair` must be specified together.');
        ws.close();
    }

    ws.on('close', () => {
        console.log(`Client disconnected: ${req.socket.remoteAddress}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
