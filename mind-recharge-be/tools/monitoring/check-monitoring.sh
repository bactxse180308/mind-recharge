#!/bin/bash
# =============================================================================
# check-monitoring.sh – Kiểm tra trạng thái Prometheus & Grafana
# =============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }

echo ""
echo "══════════════════════════════════════════"
echo "   Monitoring Stack – Health Check"
echo "══════════════════════════════════════════"

# ── Prometheus ─────────────────────────────────
echo -e "\n${BLUE}[1] Prometheus Service${NC}"
if systemctl is-active --quiet prometheus; then
    ok "Service: RUNNING"
else
    fail "Service: NOT RUNNING"
    info "Khởi động: sudo systemctl start prometheus"
fi

if systemctl is-enabled --quiet prometheus; then
    ok "Auto-start: ENABLED"
else
    fail "Auto-start: DISABLED"
fi

if curl -sf --max-time 3 http://localhost:9090/-/healthy &>/dev/null; then
    ok "HTTP :9090 – Prometheus UI: REACHABLE"
else
    fail "HTTP :9090 – Prometheus UI: NOT REACHABLE"
fi

if curl -sf --max-time 3 http://localhost:9090/api/v1/targets &>/dev/null; then
    TARGET_COUNT=$(curl -sf http://localhost:9090/api/v1/targets | python3 -c "
import sys, json
data = json.load(sys.stdin)
active = data.get('data', {}).get('activeTargets', [])
up = sum(1 for t in active if t.get('health') == 'up')
total = len(active)
print(f'{up}/{total} targets UP')
" 2>/dev/null || echo "Có targets")
    ok "Targets: ${TARGET_COUNT}"
fi

# ── Grafana ────────────────────────────────────
echo -e "\n${BLUE}[2] Grafana Service${NC}"
if systemctl is-active --quiet grafana-server; then
    ok "Service: RUNNING"
else
    fail "Service: NOT RUNNING"
    info "Khởi động: sudo systemctl start grafana-server"
fi

if systemctl is-enabled --quiet grafana-server; then
    ok "Auto-start: ENABLED"
else
    fail "Auto-start: DISABLED"
fi

if curl -sf --max-time 3 http://localhost:3000/api/health &>/dev/null; then
    ok "HTTP :3000 – Grafana UI: REACHABLE"
else
    fail "HTTP :3000 – Grafana UI: NOT REACHABLE"
fi

# ── Spring Boot Actuator ────────────────────────
echo -e "\n${BLUE}[3] Spring Boot Actuator${NC}"
if curl -sf --max-time 3 http://localhost:8080/actuator/health &>/dev/null; then
    ok "Actuator /health: UP"
else
    fail "Actuator /health: Không phản hồi (App chưa chạy?)"
fi

if curl -sf --max-time 3 http://localhost:8080/actuator/prometheus &>/dev/null; then
    METRIC_LINES=$(curl -sf http://localhost:8080/actuator/prometheus | wc -l)
    ok "Actuator /prometheus: OK (${METRIC_LINES} dòng metrics)"
else
    fail "Actuator /prometheus: Không phản hồi"
    info "Kiểm tra: application.yml có management.endpoints.web.exposure.include = prometheus"
    info "Kiểm tra: build.gradle.kts có micrometer-registry-prometheus"
fi

# ── Ports ───────────────────────────────────────
echo -e "\n${BLUE}[4] Network Ports${NC}"
for port in 9090 3000 8080; do
    if ss -tlnp 2>/dev/null | grep -q ":${port}" || \
       netstat -tlnp 2>/dev/null | grep -q ":${port}"; then
        ok "Port ${port}: LISTENING"
    else
        fail "Port ${port}: NOT LISTENING"
    fi
done

# ── Summary ─────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
info "Prometheus:  http://${SERVER_IP}:9090"
info "Grafana:     http://${SERVER_IP}:3000  (admin/admin)"
info "Actuator:    http://${SERVER_IP}:8080/actuator/prometheus"
echo "══════════════════════════════════════════"
echo ""
