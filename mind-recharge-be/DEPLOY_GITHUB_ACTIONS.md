# GitHub Actions Auto Deploy

Workflow này tự động:

- build backend bằng Java 21
- chạy `test`
- tạo `bootJar`
- copy JAR mới lên VPS
- restart `myapp.service`
- gọi healthcheck để xác nhận deploy thành công

## Trigger

- tự chạy khi push vào nhánh `main` và có thay đổi trong `mind-recharge-be/**`
- có thể chạy tay bằng `workflow_dispatch`

## GitHub Secrets cần tạo

Vào `GitHub repo -> Settings -> Secrets and variables -> Actions`

### Secrets

- `VPS_HOST`
  - ví dụ: `160.191.237.229`
- `VPS_PORT`
  - ví dụ: `22`
- `VPS_USER`
  - ví dụ: `root`
- `VPS_SSH_PRIVATE_KEY`
  - private key dùng để SSH vào VPS

## GitHub Variables nên tạo

### Variables

- `BACKEND_APP_DIR`
  - giá trị hiện tại: `/opt/myapp`
- `BACKEND_SERVICE_NAME`
  - giá trị hiện tại: `myapp.service`
- `BACKEND_HEALTHCHECK_URL`
  - giá trị hiện tại: `http://127.0.0.1:8080/api/v1/health`

Nếu không tạo variables, workflow sẽ tự fallback về đúng 3 giá trị trên.

## Chuẩn bị VPS

Server cần có sẵn:

- Java 21
- `systemd`
- service `myapp.service`
- thư mục deploy `/opt/myapp`
- file môi trường `/opt/myapp/.env`

Workflow này không đụng vào:

- SQL Server container
- `/opt/myapp/.env`
- cấu hình Docker

## SSH key

Khuyến nghị dùng deploy key riêng thay vì password root.

Ví dụ tạo key trên máy local:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy"
```

Sau đó:

1. thêm public key vào `~/.ssh/authorized_keys` trên VPS
2. copy private key vào secret `VPS_SSH_PRIVATE_KEY`

## Flow deploy

1. build JAR ở GitHub Actions
2. upload thành `/opt/myapp/app.jar.upload`
3. backup `app.jar` cũ thành `app.jar.bak.<timestamp>`
4. thay JAR mới
5. restart `myapp.service`
6. gọi healthcheck nội bộ trên VPS

## Ghi chú

- Nếu healthcheck fail, workflow sẽ fail và in `journalctl` gần nhất.
- Hiện workflow chỉ deploy backend.
- Nếu muốn, có thể thêm workflow riêng để build/deploy frontend ở bước tiếp theo.
