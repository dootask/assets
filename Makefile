# 企业固定资产管理系统 - 构建配置
.PHONY: help dev build build-frontend build-backend clean install test lint format docker-build docker-run production

# 默认目标
help:
	@echo "企业固定资产管理系统 - 可用命令:"
	@echo ""
	@echo "开发环境:"
	@echo "  dev              启动开发环境"
	@echo "  install          安装依赖"
	@echo "  test             运行测试"
	@echo "  lint             代码检查"
	@echo "  format           代码格式化"
	@echo ""
	@echo "生产构建:"
	@echo "  build            构建完整应用"
	@echo "  build-frontend   构建前端"
	@echo "  build-backend    构建后端"
	@echo "  production       生产环境部署"
	@echo ""
	@echo "工具:"
	@echo "  clean            清理构建文件"
	@echo "  docker-build     构建Docker镜像"
	@echo "  docker-run       运行Docker容器"

# 开发环境
dev:
	@echo "🚀 启动开发环境..."
	npm run dev:all

install:
	@echo "📦 安装前端依赖..."
	npm install
	@echo "📦 安装后端依赖..."
	cd server && go mod tidy

# 测试
test:
	@echo "🧪 运行前端测试..."
	npm run test
	@echo "🧪 运行后端测试..."
	cd server && go test ./...

# 代码质量
lint:
	@echo "🔍 前端代码检查..."
	npm run lint
	@echo "🔍 后端代码检查..."
	cd server && go vet ./...
	cd server && go fmt ./...

format:
	@echo "✨ 格式化代码..."
	npm run format
	cd server && go fmt ./...

# 构建
build: build-frontend build-backend
	@echo "✅ 构建完成!"

build-frontend:
	@echo "🏗️  构建前端..."
	npm run build

build-backend:
	@echo "🏗️  构建后端..."
	cd server && CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o ../dist/asset-management-server main.go

# 清理
clean:
	@echo "🧹 清理构建文件..."
	rm -rf .next
	rm -rf dist
	rm -rf node_modules/.cache
	rm -rf server/tmp
	cd server && go clean -cache

# 生产环境
production: clean build
	@echo "🚀 准备生产环境..."
	mkdir -p dist/uploads
	mkdir -p dist/data
	cp config.production.env dist/.env
	cp -r .next/standalone/* dist/ 2>/dev/null || true
	cp -r .next/static dist/.next/static 2>/dev/null || true
	cp -r public dist/public 2>/dev/null || true
	@echo "✅ 生产环境准备完成! 文件位于 dist/ 目录"

# Docker
docker-build:
	@echo "🐳 构建Docker镜像..."
	docker build -t asset-management-system .

docker-run:
	@echo "🐳 运行Docker容器..."
	docker run -p 3000:3000 -p 8000:8000 asset-management-system