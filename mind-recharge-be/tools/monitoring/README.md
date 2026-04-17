# Monitoring Stack – Prometheus + Grafana

> Tài liệu hướng dẫn cài đặt và cấu hình Prometheus + Grafana cho **MindRecharge Backend**

## Tổng quan

```
Spring Boot :8080  →  /actuator/prometheus
                              ↓
                      Prometheus :9090
                              ↓
                       Grafana :3000
```

## Files trong thư mục này

| File | Mô tả |
|------|-------|
| `install-monitoring.sh` | Script cài Prometheus 2.53.4 + Grafana tự động |
| `prometheus.yml` | File config Prometheus (standalone) |
| `check-monitoring.sh` | Script kiểm tra trạng thái services |

---

## 1. Cài đặt trên Server Linux

### Bước 1 – Upload scripts lên server

```bash
# Từ máy local (PowerShell/Git Bash)
scp tools/monitoring/install-monitoring.sh user@your-server:~/
scp tools/monitoring/check-monitoring.sh   user@your-server:~/
```

### Bước 2 – Chạy script cài đặt

```bash
# SSH vào server
ssh user@your-server

# Cấp quyền và chạy
chmod +x install-monitoring.sh
sudo bash install-monitoring.sh
```

Script sẽ tự động:
- ✅ Cài Prometheus **2.53.4** (LTS) – không dùng wildcard
- ✅ Cài Grafana từ **repo chính thức** apt.grafana.com
- ✅ Tạo `prometheus.yml` scrape `localhost:8080/actuator/prometheus`
- ✅ Tạo systemd services và `enable` auto-start
- ✅ Mở port **9090** (Prometheus) và **3000** (Grafana)
- ✅ Kiểm tra trạng thái ngay sau khi cài

---

## 2. Kiểm tra sau khi cài

```bash
chmod +x check-monitoring.sh
sudo bash check-monitoring.sh
```

Hoặc kiểm tra thủ công:

```bash
# Prometheus
sudo systemctl status prometheus
curl http://localhost:9090/-/healthy

# Grafana
sudo systemctl status grafana-server
curl http://localhost:3000/api/health

# Spring Boot Actuator
curl http://localhost:8080/actuator/prometheus | head -20
```

---

## 3. Cấu hình Spring Boot (đã tích hợp vào project)

### `build.gradle.kts` – Dependencies đã thêm

```kotlin
// Monitoring
implementation("org.springframework.boot:spring-boot-starter-actuator")
runtimeOnly("io.micrometer:micrometer-registry-prometheus")
```

### `application.yml` – Actuator endpoints đã cấu hình

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus, metrics
  endpoint:
    prometheus:
      enabled: true
```

> [!IMPORTANT]
> Nếu Spring Security được bật, cần **permit** endpoint Actuator trong SecurityConfig:
> ```java
> .requestMatchers("/actuator/prometheus", "/actuator/health").permitAll()
> ```

---

## 4. Cấu hình Grafana

### Đăng nhập lần đầu
- URL: `http://your-server:3000`
- Username: `admin`
- Password: `admin` → **đổi ngay**

### Thêm Prometheus datasource
1. **Connections** → **Data Sources** → **Add data source**
2. Chọn **Prometheus**
3. URL: `http://localhost:9090`
4. Click **Save & Test**

### Import Dashboard gợi ý

| Dashboard | ID | Mô tả |
|-----------|-----|-------|
| JVM Micrometer | `4701` | Heap, GC, Threads, CPU |
| Spring Boot 3.x | `19004` | HTTP requests, latency, errors |
| Prometheus Stats | `2` | Prometheus tự giám sát |

**Import**: **Dashboards** → **Import** → Nhập ID → **Load**

---

## 5. Quản lý Services

```bash
# Khởi động lại
sudo systemctl restart prometheus
sudo systemctl restart grafana-server

# Xem logs real-time
sudo journalctl -u prometheus -f
sudo journalctl -u grafana-server -f

# Reload config không restart (Prometheus)
sudo systemctl reload prometheus
# hoặc
curl -X POST http://localhost:9090/-/reload
```

---

## 6. Troubleshooting

### Lỗi 404 khi download Prometheus
Script dùng URL cố định với version **2.53.4**. Nếu lỗi:
```bash
# Kiểm tra URL thủ công
curl -I https://github.com/prometheus/prometheus/releases/download/v2.53.4/prometheus-2.53.4.linux-amd64.tar.gz
```

### Actuator /prometheus trả về 404
1. Kiểm tra dependency `micrometer-registry-prometheus` trong `build.gradle.kts`
2. Kiểm tra `management.endpoints.web.exposure.include` trong `application.yml`
3. Kiểm tra Spring Security không chặn `/actuator/**`

### Port bị chiếm
```bash
# Kiểm tra port 9090 và 3000
ss -tlnp | grep -E '9090|3000'
# Kill process
sudo kill -9 $(sudo lsof -ti:9090)
```
