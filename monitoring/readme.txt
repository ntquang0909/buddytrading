1) prometheus

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install prometheus \
    --set alertmanager.enabled=false \
    --set exporters.node-exporter.enabled=false \
    --set exporters.kube-state-metrics.enabled=false \
    --set kubelet.enabled=false \
    --set kubeProxy.enabled=false \
    --set kubeControllerManager.enabled=false \
    --set kubeScheduler.enabled=false \
    --set kubeApiServer.enabled=false \
    --set coreDns.enabled=false \
    --set operator.serviceMonitor.enabled=false \
    --set prometheus.serviceMonitor.enabled=false \
    bitnami/kube-prometheus

helm uninstall prometheus

2) grafana
  
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install grafana --set admin.password=bcx123 bitnami/grafana

user/password: admin/bcx123

URL: http://prometheus-kube-prometheus-prometheus.default.svc.cluster.local:9090

helm uninstall grafana

3)
"cogwheel"->"Data Sources"->"Add data source"->"Prometheus"->"URL"->"Save&test"
"four squares"->"Manage"->"Import"->......->Select a Prometheus data source->"Import"

4)
helm install postgresql-ha \
    --set postgresql.username=postgres \
    --set postgresql.password=bcx123 \
    --set postgresql.database=foodtohave \
    --set postgresql.syncReplication=true \
    --set metrics.enabled=true \
    --set metrics.serviceMonitor.enabled=true \
    bitnami/postgresql-ha
    
5) dashboard
PostgreSQL Database by Lucas Estienne (9628)

