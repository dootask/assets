# 企业固定资产管理系统 - 部署指南

## 📋 部署概览

本指南详细介绍了企业固定资产管理系统的各种部署方式，包括开发环境、生产环境和容器化部署。

## 🔧 环境要求

### 基础要求

- **Node.js**: 22.0.0 或更高版本
- **Go**: 1.23.0 或更高版本
- **操作系统**: Linux、macOS 或 Windows
- **内存**: 最少 2GB RAM
- **存储**: 最少 10GB 可用空间

### 可选要求

- **Docker**: 用于容器化部署
- **Nginx**: 用于反向代理和负载均衡
- **SSL证书**: 用于HTTPS部署

## 🚀 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/asset-management/system.git
cd system
```

### 2. 配置环境变量

```bash
# 复制配置文件
cp config.example.env .env

# 编辑配置文件
nano .env
```

### 3. 一键部署

```bash
# 构建生产版本
make production

# 启动服务
./scripts/start.sh
```

## 🏗️ 开发环境部署

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
go mod tidy
cd ..
```

### 2. 启动开发服务

```bash
# 方式一：使用脚本启动
npm run dev:all

# 方式二：分别启动
# 终端1：启动前端
npm run dev

# 终端2：启动后端
cd server
go run main.go
```

### 3. 访问应用

- **前端**: http://localhost:3000
- **后端API**: http://localhost:8000
- **健康检查**: http://localhost:8000/health

## 🏭 生产环境部署

### 方式一：传统部署

#### 1. 构建应用

```bash
# 使用 Makefile 构建
make production

# 或手动构建
npm run build
cd server && go build -ldflags="-w -s" -o ../dist/asset-management-server main.go
```

#### 2. 配置生产环境

```bash
# 复制生产配置
cp config.production.env dist/.env

# 编辑生产配置
nano dist/.env
```

#### 3. 启动服务

```bash
# 使用启动脚本
./scripts/start.sh

# 或手动启动
cd dist
./asset-management-server --env-file .env
```

#### 4. 配置系统服务 (可选)

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/asset-management.service
```

```ini
[Unit]
Description=Asset Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/asset-management
ExecStart=/opt/asset-management/asset-management-server --env-file /opt/asset-management/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable asset-management
sudo systemctl start asset-management
sudo systemctl status asset-management
```

### 方式二：Docker 部署

#### 1. 构建镜像

```bash
# 构建 Docker 镜像
docker build -t asset-management-system .

# 或使用 Makefile
make docker-build
```

#### 2. 运行容器

```bash
# 单容器运行
docker run -d \
  --name asset-management \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  asset-management-system

# 或使用 docker-compose
docker-compose -f docker-compose.production.yml up -d
```

#### 3. 验证部署

```bash
# 检查容器状态
docker ps

# 查看日志
docker logs asset-management

# 健康检查
curl http://localhost:8000/health
```

### 方式三：Docker Compose 部署

#### 1. 配置 docker-compose.yml

```yaml
version: '3.8'

services:
  asset-management:
    build: .
    container_name: asset-management-system
    restart: unless-stopped
    ports:
      - '8000:8000'
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: asset-management-nginx
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - asset-management
```

#### 2. 启动服务

```bash
docker-compose -f docker-compose.production.yml up -d
```

## 🌐 Nginx 反向代理配置

### 基础配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API 请求代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://localhost:8000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:8000;
    }

    # 其他请求（前端路由）
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 其他配置与 HTTP 相同...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 监控和日志

### 应用日志

```bash
# 查看应用日志
tail -f logs/server.log

# 使用 journalctl (systemd)
sudo journalctl -u asset-management -f
```

### 健康检查

```bash
# 基础健康检查
curl http://localhost:8000/health

# 详细系统状态
curl http://localhost:8000/api/dashboard/health
```

### 性能监控

```bash
# 查看系统资源使用
htop

# 查看端口占用
netstat -tlnp | grep :8000

# 查看磁盘使用
df -h
```

## 🔒 安全配置

### 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000  # 仅在需要直接访问时开放

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 文件权限

```bash
# 设置适当的文件权限
chmod 755 asset-management-server
chmod 644 .env
chmod -R 755 uploads/
chmod -R 755 data/
```

### 环境变量安全

```bash
# 生产环境必须修改的配置
NODE_ENV=production
ENABLE_DEBUG=false
JWT_SECRET=your-secure-jwt-secret
```

## 🔄 更新和维护

### 应用更新

```bash
# 1. 备份数据
cp -r data/ data_backup_$(date +%Y%m%d)/
cp -r uploads/ uploads_backup_$(date +%Y%m%d)/

# 2. 停止服务
./scripts/stop.sh

# 3. 更新代码
git pull origin main

# 4. 重新构建
make production

# 5. 启动服务
./scripts/start.sh
```

### 数据库备份

```bash
# SQLite 数据库备份
cp data/assets.db data/assets_backup_$(date +%Y%m%d_%H%M%S).db

# 定期备份脚本
#!/bin/bash
BACKUP_DIR="/opt/backups/asset-management"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp data/assets.db $BACKUP_DIR/assets_$DATE.db
cp -r uploads/ $BACKUP_DIR/uploads_$DATE/

# 清理30天前的备份
find $BACKUP_DIR -name "assets_*.db" -mtime +30 -delete
find $BACKUP_DIR -name "uploads_*" -mtime +30 -exec rm -rf {} \;
```

## 🚨 故障排除

### 常见问题

#### 1. 服务无法启动

```bash
# 检查端口占用
lsof -i :8000

# 检查配置文件
cat .env

# 查看详细错误
./asset-management-server --env-file .env
```

#### 2. 数据库连接失败

```bash
# 检查数据库文件权限
ls -la data/assets.db

# 检查目录权限
ls -la data/

# 重新初始化数据库
rm data/assets.db
./asset-management-server --env-file .env
```

#### 3. 文件上传失败

```bash
# 检查上传目录权限
ls -la uploads/

# 创建上传目录
mkdir -p uploads
chmod 755 uploads
```

### 性能优化

#### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_assets_asset_no ON assets(asset_no);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);
CREATE INDEX idx_borrow_records_asset_id ON borrow_records(asset_id);
```

#### 2. 文件存储优化

```bash
# 定期清理临时文件
find uploads/ -name "*.tmp" -mtime +1 -delete

# 压缩旧日志
gzip logs/*.log.old
```

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看 [故障排除](#故障排除) 部分
2. 检查 [GitHub Issues](https://github.com/asset-management/system/issues)
3. 提交新的 Issue 并提供详细的错误信息

---

部署成功后，您可以通过配置的域名或IP地址访问企业固定资产管理系统。
