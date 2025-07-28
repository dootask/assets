#!/bin/bash

source $(dirname $0)/utils.sh

echo "🚀 企业固定资产管理系统 - 开发环境启动"
echo "======================================="
echo "启动：前端 + Go后端服务"
echo ""

# 检查依赖
echo "🔍 检查环境依赖..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装! 请安装Node.js 22+: https://nodejs.org/"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装! 请安装Go 1.23+: https://golang.org/dl/"
    exit 1
fi

if ! command -v air &> /dev/null; then
    [ -z "$GOPATH" ] && export PATH=$PATH:$(go env GOPATH)/bin
    command -v air &> /dev/null || { echo "❌ air 未安装! 请安装air: https://github.com/air-verse/air"; exit 1; }
fi

echo "✅ Node.js: $(node --version)"
echo "✅ Go: $(go version | cut -d' ' -f3)"
echo ""

# 准备Go后端
echo "🎯 准备Go后端..."
pushd server > /dev/null
go mod tidy > /dev/null 2>&1
popd > /dev/null

echo ""
echo "🚀 启动所有服务..."
echo ""

# 启动Go后端（后台）
echo "🎯 启动Go后端 (端口$(getEnv GO_SERVICE_PORT))..."
pushd server > /dev/null
air --build.cmd "go build -o tmp/server main.go" --build.exclude_dir "uploads,tmp,data" --build.full_bin "./tmp/server --env-file ${CURRENT_DIR}/.env" &
BACKEND_PID=$!
popd > /dev/null

# 检查服务状态
echo "🔍 检查服务状态..."

go_backend_status=false
for i in {1..30}; do
    sleep 1
    if [ $go_backend_status = false ]; then
        if curl -s http://localhost:$(getEnv GO_SERVICE_PORT)/health > /dev/null 2>&1; then
            go_backend_status=true
        fi
    fi
    if [ $go_backend_status = true ]; then
        echo ""
        echo "✅ Go后端启动成功 (PID: $BACKEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 服务启动失败"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    else
        echo "🔍 服务启动中... ($i/30)"
    fi
done

# 创建停止脚本
cat > scripts/stop.sh << EOF
#!/bin/bash
echo "🛑 停止所有开发服务..."
pkill -f "air --build.cmd"
pkill -f "next dev"
echo "✅ 所有服务已停止"
EOF
chmod +x scripts/stop.sh

echo ""
echo "🎉 所有服务启动成功！"
echo "================================="
echo "📱 前端:     http://localhost:$(getEnv APP_PORT)"
echo "⚡ Go后端:   http://localhost:$(getEnv GO_SERVICE_PORT)"
echo ""
echo "💡 使用 'npm run stop:all' 或 Ctrl+C 停止所有服务"
echo ""

# 启动前端（阻塞进程）
echo "🎯 启动前端开发服务器..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📦 安装/更新依赖..."
    npm install > /dev/null 2>&1
fi
npm run dev

# 前端停止后，清理所有进程
echo ""
echo "🛑 清理所有后台进程..."
kill $BACKEND_PID 2>/dev/null
sleep 0.5
echo "✅ 开发环境已完全停止" 
