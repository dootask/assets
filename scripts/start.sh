#!/bin/bash

# 企业固定资产管理系统 - 生产环境启动脚本

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 企业固定资产管理系统 - 生产环境启动"
echo "============================================"

# 检查是否已构建
if [ ! -f "$PROJECT_DIR/dist/asset-management-server" ]; then
    echo "❌ 未找到构建文件，请先运行 'make production'"
    exit 1
fi

# 进入构建目录
cd "$PROJECT_DIR/dist"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "❌ 未找到环境变量文件 .env"
    exit 1
fi

# 创建必要的目录
mkdir -p uploads data logs

# 设置权限
chmod +x asset-management-server

# 启动服务器
echo "🎯 启动资产管理服务器..."
echo "📁 工作目录: $(pwd)"
echo "⚙️  配置文件: .env"
echo ""

# 使用nohup在后台运行
nohup ./asset-management-server --env-file .env > logs/server.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "🔍 等待服务器启动..."
for i in {1..30}; do
    sleep 1
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ 服务器启动成功!"
        echo "🌐 访问地址: http://localhost:8000"
        echo "📊 服务器PID: $SERVER_PID"
        echo "📝 日志文件: logs/server.log"
        echo ""
        echo "💡 使用以下命令管理服务:"
        echo "   查看日志: tail -f logs/server.log"
        echo "   停止服务: kill $SERVER_PID"
        echo "   重启服务: $0"
        
        # 保存PID到文件
        echo $SERVER_PID > server.pid
        exit 0
    fi
    echo "⏳ 启动中... ($i/30)"
done

echo "❌ 服务器启动失败，请检查日志: logs/server.log"
kill $SERVER_PID 2>/dev/null || true
exit 1