#!/bin/bash
# =============================================================================
# Script: install-monitoring.sh
# Mô tả: Cài đặt Prometheus 2.53.x (LTS) và Grafana trên Ubuntu/Debian
# Yêu cầu: Ubuntu 20.04+ hoặc Debian 11+, chạy với quyền root/sudo
# Port: Prometheus :9090 | Grafana :3000
# =============================================================================

set -euo pipefail

# --------------------------------------------------------------------------
# Màu sắc cho output
# --------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --------------------------------------------------------------------------
# Kiểm tra quyền root
# --------------------------------------------------------------------------
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Script này cần chạy với quyền root. Dùng: sudo bash install-monitoring.sh"
    fi
    log_success "Đang chạy với quyền root."
}

# --------------------------------------------------------------------------
# Phiên bản cố định – KHÔNG dùng wildcard
# --------------------------------------------------------------------------
PROMETHEUS_VERSION="2.53.4"
PROMETHEUS_ARCH="linux-amd64"
PROMETHEUS_FILENAME="prometheus-${PROMETHEUS_VERSION}.${PROMETHEUS_ARCH}.tar.gz"
PROMETHEUS_DOWNLOAD_URL="https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/${PROMETHEUS_FILENAME}"

PROMETHEUS_USER="prometheus"
PROMETHEUS_GROUP="prometheus"
PROMETHEUS_HOME="/opt/prometheus"
PROMETHEUS_DATA="/var/lib/prometheus"
PROMETHEUS_CONFIG="/etc/prometheus"

# --------------------------------------------------------------------------
# 1. Cài đặt các gói cần thiết
# --------------------------------------------------------------------------
install_dependencies() {
    log_info "Cập nhật package list và cài dependencies..."
    apt-get update -qq
    apt-get install -y -qq curl wget gnupg2 apt-transport-https software-properties-common ca-certificates
    log_success "Dependencies đã cài xong."
}

# --------------------------------------------------------------------------
# 2. Cài đặt Prometheus 2.53.x (LTS)
# --------------------------------------------------------------------------
install_prometheus() {
    log_info "Bắt đầu cài Prometheus ${PROMETHEUS_VERSION}..."

    # Tạo user hệ thống (không login shell, không home dir)
    if ! id "${PROMETHEUS_USER}" &>/dev/null; then
        useradd --no-create-home --shell /bin/false "${PROMETHEUS_USER}"
        log_success "Đã tạo user '${PROMETHEUS_USER}'."
    else
        log_warn "User '${PROMETHEUS_USER}' đã tồn tại, bỏ qua."
    fi

    # Tạo thư mục
    mkdir -p "${PROMETHEUS_HOME}" "${PROMETHEUS_DATA}" "${PROMETHEUS_CONFIG}/rules"

    # Tải Prometheus (URL rõ ràng, không wildcard)
    TMP_DIR=$(mktemp -d)
    log_info "Tải Prometheus từ: ${PROMETHEUS_DOWNLOAD_URL}"
    wget --quiet --show-progress \
         --timeout=60 \
         --tries=3 \
         -O "${TMP_DIR}/${PROMETHEUS_FILENAME}" \
         "${PROMETHEUS_DOWNLOAD_URL}" || log_error "Tải Prometheus thất bại. Kiểm tra URL: ${PROMETHEUS_DOWNLOAD_URL}"

    # Kiểm tra file đã tải
    if [[ ! -f "${TMP_DIR}/${PROMETHEUS_FILENAME}" ]]; then
        log_error "File tải về không tồn tại: ${TMP_DIR}/${PROMETHEUS_FILENAME}"
    fi

    # Giải nén vào thư mục tạm
    log_info "Giải nén Prometheus..."
    tar xzf "${TMP_DIR}/${PROMETHEUS_FILENAME}" -C "${TMP_DIR}"

    EXTRACTED_DIR="${TMP_DIR}/prometheus-${PROMETHEUS_VERSION}.${PROMETHEUS_ARCH}"

    # Copy binaries
    cp "${EXTRACTED_DIR}/prometheus"     /usr/local/bin/prometheus
    cp "${EXTRACTED_DIR}/promtool"       /usr/local/bin/promtool

    # Copy console libraries
    cp -r "${EXTRACTED_DIR}/consoles"          "${PROMETHEUS_HOME}/"
    cp -r "${EXTRACTED_DIR}/console_libraries" "${PROMETHEUS_HOME}/"

    # Phân quyền
    chown -R "${PROMETHEUS_USER}:${PROMETHEUS_GROUP}" "${PROMETHEUS_HOME}" "${PROMETHEUS_DATA}" "${PROMETHEUS_CONFIG}"
    chown "${PROMETHEUS_USER}:${PROMETHEUS_GROUP}" /usr/local/bin/prometheus /usr/local/bin/promtool

    # Dọn dẹp
    rm -rf "${TMP_DIR}"

    log_success "Prometheus ${PROMETHEUS_VERSION} đã cài xong."
    prometheus --version 2>&1 | head -1
}

# --------------------------------------------------------------------------
# 3. Tạo prometheus.yml (scrape Spring Boot Actuator)
# --------------------------------------------------------------------------
configure_prometheus() {
    log_info "Tạo cấu hình prometheus.yml..."

    cat > "${PROMETHEUS_CONFIG}/prometheus.yml" << 'EOF'
# =============================================================================
# Prometheus Configuration – Mind Recharge
# Scrapes Spring Boot Actuator metrics tại localhost:8080
# =============================================================================

global:
  scrape_interval:     15s   # Tần suất scrape mặc định
  evaluation_interval: 15s   # Tần suất đánh giá rules
  scrape_timeout:      10s

  external_labels:
    environment: 'production'
    project:     'mind-recharge'

# Alerting (tùy chọn, uncomment khi cần)
# alerting:
#   alertmanagers:
#     - static_configs:
#         - targets: ['localhost:9093']

# Rule files (tùy chọn)
# rule_files:
#   - /etc/prometheus/rules/*.yml

# =============================================================================
# Scrape Configs
# =============================================================================
scrape_configs:

  # Prometheus tự monitor chính nó
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Spring Boot Actuator – Mind Recharge Backend
  - job_name: 'mind-recharge-backend'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 10s
    static_configs:
      - targets: ['localhost:8080']
        labels:
          application: 'mind-recharge-be'
          service:     'backend'

  # JVM metrics (nếu dùng Micrometer JVM registry)
  - job_name: 'mind-recharge-jvm'
    metrics_path: '/actuator/prometheus'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:8080']
        labels:
          application: 'mind-recharge-be'
          service:     'jvm'
EOF

    chown "${PROMETHEUS_USER}:${PROMETHEUS_GROUP}" "${PROMETHEUS_CONFIG}/prometheus.yml"

    # Validate config
    log_info "Kiểm tra cú pháp prometheus.yml..."
    promtool check config "${PROMETHEUS_CONFIG}/prometheus.yml" \
        && log_success "prometheus.yml hợp lệ." \
        || log_error "prometheus.yml có lỗi cú pháp!"
}

# --------------------------------------------------------------------------
# 4. Tạo systemd service cho Prometheus
# --------------------------------------------------------------------------
create_prometheus_service() {
    log_info "Tạo systemd service cho Prometheus..."

    cat > /etc/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=${PROMETHEUS_USER}
Group=${PROMETHEUS_GROUP}
Restart=on-failure
RestartSec=5s

ExecStart=/usr/local/bin/prometheus \\
    --config.file=${PROMETHEUS_CONFIG}/prometheus.yml \\
    --storage.tsdb.path=${PROMETHEUS_DATA} \\
    --storage.tsdb.retention.time=30d \\
    --storage.tsdb.retention.size=10GB \\
    --web.console.templates=${PROMETHEUS_HOME}/consoles \\
    --web.console.libraries=${PROMETHEUS_HOME}/console_libraries \\
    --web.listen-address=0.0.0.0:9090 \\
    --web.enable-lifecycle

ExecReload=/bin/kill -HUP \$MAINPID
TimeoutStopSec=20s
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
EOF

    log_success "Prometheus systemd service đã tạo."
}

# --------------------------------------------------------------------------
# 5. Cài đặt Grafana từ repo chính thức
# --------------------------------------------------------------------------
install_grafana() {
    log_info "Cài Grafana từ repo chính thức Grafana Labs..."

    # Import GPG key chính thức
    mkdir -p /etc/apt/keyrings
    wget --quiet -O /etc/apt/keyrings/grafana.gpg \
        https://apt.grafana.com/gpg.key \
        || log_error "Không tải được GPG key Grafana."

    # Thêm stable repo
    echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" \
        > /etc/apt/sources.list.d/grafana.list

    # Cập nhật và cài
    apt-get update -qq
    apt-get install -y -qq grafana

    log_success "Grafana đã cài xong."
    grafana-server -v 2>&1 | head -1 || true
}

# --------------------------------------------------------------------------
# 6. Cấu hình Grafana (cơ bản)
# --------------------------------------------------------------------------
configure_grafana() {
    log_info "Cấu hình Grafana..."

    # Backup config gốc
    cp /etc/grafana/grafana.ini /etc/grafana/grafana.ini.bak 2>/dev/null || true

    # Chỉnh HTTP port và domain
    sed -i 's/^;http_port = 3000/http_port = 3000/'      /etc/grafana/grafana.ini
    sed -i 's/^;http_addr =/http_addr = 0.0.0.0/'         /etc/grafana/grafana.ini

    log_success "Grafana đã cấu hình xong."
}

# --------------------------------------------------------------------------
# 7. Mở firewall ports
# --------------------------------------------------------------------------
open_firewall_ports() {
    log_info "Mở firewall ports 9090 (Prometheus) và 3000 (Grafana)..."

    if command -v ufw &>/dev/null; then
        ufw allow 9090/tcp comment "Prometheus"
        ufw allow 3000/tcp comment "Grafana"
        log_success "Đã mở port qua UFW."
    elif command -v firewall-cmd &>/dev/null; then
        firewall-cmd --permanent --add-port=9090/tcp
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --reload
        log_success "Đã mở port qua firewalld."
    else
        log_warn "Không tìm thấy UFW hoặc firewalld. Mở port thủ công nếu cần."
        log_warn "Manual: iptables -A INPUT -p tcp --dport 9090 -j ACCEPT"
        log_warn "Manual: iptables -A INPUT -p tcp --dport 3000 -j ACCEPT"
    fi
}

# --------------------------------------------------------------------------
# 8. Khởi động services
# --------------------------------------------------------------------------
start_services() {
    log_info "Reload systemd daemon..."
    systemctl daemon-reload

    log_info "Khởi động và enable Prometheus..."
    systemctl enable prometheus
    systemctl start prometheus

    log_info "Khởi động và enable Grafana..."
    systemctl enable grafana-server
    systemctl start grafana-server

    # Chờ services khởi động
    sleep 3
}

# --------------------------------------------------------------------------
# 9. Kiểm tra trạng thái services
# --------------------------------------------------------------------------
check_services() {
    echo ""
    echo "=============================================="
    echo "       KIỂM TRA TRẠNG THÁI SERVICES"
    echo "=============================================="

    # Prometheus status
    echo -e "\n${BLUE}--- PROMETHEUS ---${NC}"
    systemctl status prometheus --no-pager -l | head -20

    # Grafana status
    echo -e "\n${BLUE}--- GRAFANA ---${NC}"
    systemctl status grafana-server --no-pager -l | head -20

    # Kiểm tra port đang lắng nghe
    echo -e "\n${BLUE}--- PORTS ĐANG LISTEN ---${NC}"
    ss -tlnp | grep -E '9090|3000' || netstat -tlnp 2>/dev/null | grep -E '9090|3000' || true

    # Health check
    echo -e "\n${BLUE}--- HEALTH CHECK ---${NC}"
    sleep 2
    if curl -sf http://localhost:9090/-/healthy &>/dev/null; then
        log_success "Prometheus: HEALTHY tại http://localhost:9090"
    else
        log_warn "Prometheus: Chưa phản hồi (có thể cần thêm thời gian khởi động)"
    fi

    if curl -sf http://localhost:3000/api/health &>/dev/null; then
        log_success "Grafana: HEALTHY tại http://localhost:3000"
    else
        log_warn "Grafana: Chưa phản hồi (có thể cần thêm thời gian khởi động)"
    fi
}

# --------------------------------------------------------------------------
# 10. In thông tin sau cài đặt
# --------------------------------------------------------------------------
print_summary() {
    echo ""
    echo "=============================================="
    echo -e "${GREEN}      CÀI ĐẶT HOÀN THÀNH!${NC}"
    echo "=============================================="
    echo ""
    echo "📊 PROMETHEUS"
    echo "   URL:     http://$(hostname -I | awk '{print $1}'):9090"
    echo "   Config:  ${PROMETHEUS_CONFIG}/prometheus.yml"
    echo "   Data:    ${PROMETHEUS_DATA}"
    echo "   Service: sudo systemctl status prometheus"
    echo ""
    echo "📈 GRAFANA"
    echo "   URL:     http://$(hostname -I | awk '{print $1}'):3000"
    echo "   Login:   admin / admin (đổi ngay sau khi đăng nhập)"
    echo "   Service: sudo systemctl status grafana-server"
    echo ""
    echo "🔧 SPRING BOOT ACTUATOR"
    echo "   Endpoint: http://localhost:8080/actuator/prometheus"
    echo "   Đảm bảo build.gradle.kts có: actuator + micrometer-registry-prometheus"
    echo ""
    echo "📋 LỆNH QUẢN LÝ"
    echo "   sudo systemctl restart prometheus"
    echo "   sudo systemctl restart grafana-server"
    echo "   sudo journalctl -u prometheus -f       # Xem log Prometheus"
    echo "   sudo journalctl -u grafana-server -f   # Xem log Grafana"
    echo ""
    echo "🔗 GRAFANA DASHBOARDS GỢI Ý"
    echo "   JVM Micrometer:      Dashboard ID 4701"
    echo "   Spring Boot 3.x:     Dashboard ID 19004"
    echo "   Prometheus Stats:    Dashboard ID 2"
    echo ""
}

# --------------------------------------------------------------------------
# MAIN
# --------------------------------------------------------------------------
main() {
    echo ""
    echo "=============================================="
    echo "  Prometheus + Grafana Installer"
    echo "  Project: Mind Recharge Backend"
    echo "  OS: Ubuntu/Debian"
    echo "=============================================="
    echo ""

    check_root
    install_dependencies
    install_prometheus
    configure_prometheus
    create_prometheus_service
    install_grafana
    configure_grafana
    open_firewall_ports
    start_services
    check_services
    print_summary
}

main "$@"
