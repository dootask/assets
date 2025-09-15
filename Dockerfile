# 企业固定资产管理系统 - Docker 构建文件

# 构建阶段
FROM node:22-slim AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package.json ./
RUN npm install

# 复制前端源码
COPY . .

# 设置环境变量确保生成 standalone 输出
ENV NEXT_PUBLIC_BASE_PATH=/apps/asset-management
ENV NEXT_PUBLIC_API_BASE_URL=/apps/asset-management/api
ENV NEXT_OUTPUT_MODE=standalone

# 构建前端
RUN npm run build

# Go 构建阶段
FROM golang:1.23-alpine AS backend-builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache gcc musl-dev sqlite-dev

# 复制Go模块文件
COPY server/go.mod server/go.sum ./
RUN go mod download

# 复制Go源码并构建
COPY server/ .
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o asset-management-server main.go

# 运行阶段
FROM alpine:latest AS production

# 安装运行时依赖
RUN apk add --no-cache ca-certificates sqlite tzdata curl nginx nodejs npm

# 设置时区
ENV TZ=Asia/Shanghai

WORKDIR /app

# 复制构建产物
COPY --from=backend-builder /app/asset-management-server .
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# 复制配置文件
COPY config.production.env .env

# 创建必要的目录
RUN mkdir -p uploads data logs

# 暴露端口
EXPOSE 3000 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动脚本
COPY <<EOF /app/start.sh
#!/bin/sh
echo "启动后端服务..."
./asset-management-server --env-file .env &
BACKEND_PID=\$!

echo "等待后端服务启动..."
sleep 5

echo "启动前端服务..."
cd /app && node server.js &
FRONTEND_PID=\$!

echo "服务启动完成"
echo "后端 PID: \$BACKEND_PID"
echo "前端 PID: \$FRONTEND_PID"

# 等待任一进程退出
wait \$BACKEND_PID \$FRONTEND_PID
EOF

RUN chmod +x /app/start.sh

# 启动命令
CMD ["/app/start.sh"]