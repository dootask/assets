# 企业固定资产管理系统 - Docker 构建文件

# 构建阶段
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制前端源码并构建
COPY . .
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
FROM alpine:latest

# 安装运行时依赖
RUN apk add --no-cache ca-certificates sqlite tzdata curl

# 设置时区
ENV TZ=Asia/Shanghai

# 创建应用用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# 复制构建产物
COPY --from=backend-builder /app/asset-management-server .
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# 复制配置文件
COPY config.production.env .env

# 创建必要的目录
RUN mkdir -p uploads data logs && \
    chown -R appuser:appgroup /app

# 切换到应用用户
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["./asset-management-server", "--env-file", ".env"]