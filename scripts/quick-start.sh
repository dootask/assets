#!/bin/bash

# DooTask AI 智能体插件 - 快速启动脚本
# 这个脚本帮助开发者快速设置和启动项目

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装后再运行此脚本"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    check_command "docker"
    
    # 检查 Docker Compose（支持新旧版本）
    if command -v "docker-compose" &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    check_command "node"
    check_command "npm"
    check_command "go"
    check_command "python3"
    log_success "系统依赖检查完成"
}

# 创建环境配置
setup_env() {
    log_info "设置环境配置..."
    
    if [ ! -f ".env" ]; then
        if [ -f "config.example.env" ]; then
            cp config.example.env .env
            log_success "已创建 .env 配置文件"
            echo ""
        else
            log_error "找不到 config.example.env 文件"
            exit 1
        fi
    else
        log_warning ".env 文件已存在，跳过创建"
    fi
}

# 安装前端依赖
install_frontend() {
    log_info "安装前端依赖..."
    npm install
    log_success "前端依赖安装完成"
}

# 创建后端目录结构
setup_backend() {
    log_info "创建后端目录结构..."
    
    # Go 服务目录
    mkdir -p backend/go-service/{handlers,models,middleware,services,mcp,config,utils}
    
    # Python AI 服务目录
    mkdir -p backend/python-ai/{agents,tools,knowledge,models,services,config,utils}
    
    # MCP 工具目录
    mkdir -p mcp-tools/{dootask-mcp,external-mcp}
    
    # 其他目录
    mkdir -p {docs,logs}
    
    log_success "后端目录结构创建完成"
}

# 启动数据库服务
start_databases() {
    log_info "启动数据库服务..."
    
    if [ -f "docker/docker-compose.dev.yml" ]; then
        $DOCKER_COMPOSE -f docker/docker-compose.dev.yml --env-file .env up -d postgres redis
        
        # 等待数据库启动
        log_info "等待数据库启动完成..."
        sleep 15
        
        log_success "数据库服务启动完成"
    else
        log_error "找不到 docker-compose.dev.yml 文件"
        exit 1
    fi
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."
    
    # 检查 PostgreSQL
    if docker exec dootask-ai-postgres pg_isready -U dootask > /dev/null 2>&1; then
        log_success "PostgreSQL 连接正常"
    else
        log_error "PostgreSQL 连接失败"
        exit 1
    fi
    
    # 检查 Redis
    if docker exec dootask-ai-redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis 连接正常"
    else
        log_error "Redis 连接失败"
        exit 1
    fi
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    if [ -f "scripts/init.sql" ]; then
        docker exec -i dootask-ai-postgres psql -U dootask -d dootask_ai < scripts/init.sql
        log_success "数据库初始化完成"
    else
        log_error "找不到数据库初始化脚本"
        exit 1
    fi
}

# 创建 Go 服务基础文件
create_go_service() {
    log_info "创建 Go 服务基础文件..."
    
    # 创建 go.mod
    if [ ! -f "backend/go-service/go.mod" ]; then
        cd backend/go-service
        go mod init dootask-ai/go-service
        cd ../..
        log_success "Go 模块初始化完成"
    else
        log_warning "Go 模块已存在，跳过初始化"
    fi
}

# 创建 Python 服务基础文件
create_python_service() {
    log_info "创建 Python 服务基础文件..."
    
    if [ ! -f "backend/python-ai/requirements.txt" ]; then
        cat > backend/python-ai/requirements.txt << EOF
# Web 框架
fastapi==0.110.0
uvicorn[standard]==0.27.0

# AI 和机器学习
langchain==0.1.13
langchain-community==0.0.29
langchain-openai==0.1.0
openai==1.13.3

# 数据库和缓存
psycopg2-binary==2.9.9
redis==5.0.3

# 数据处理
pydantic==2.6.4
python-multipart==0.0.9
aiofiles==23.2.1

# 安全和认证
python-jose[cryptography]==3.3.0
bcrypt==4.1.2

# MCP 协议
mcp==0.4.0

# DooTask 工具（如果可用）
dootask-tools==0.0.3

# 开发工具
python-dotenv==1.0.1
EOF
        log_success "Python 依赖文件创建完成"
    else
        log_warning "Python 依赖文件已存在，跳过创建"
    fi
}

# 启动前端开发服务器
start_frontend() {
    log_info "启动前端开发服务器..."
    log_warning "前端服务将在新终端窗口中启动"
    log_warning "使用 npm run dev 命令手动启动前端服务"
}

# 显示下一步操作
show_next_steps() {
    log_success "🎉 项目快速启动完成！"
    echo ""
    log_info "下一步操作："
    echo -e ""
    echo -e "1. 编辑 .env 文件，填入正确的 API 密钥和配置"
    echo -e "2. 启动前端开发服务器："
    echo -e "   ${GREEN}npm run dev${NC}"
    echo -e ""
    echo -e "3. 开发后端服务："
    echo -e "   - Go 服务: ${GREEN}cd backend/go-service${NC}"
    echo -e "   - Python AI 服务: ${GREEN}cd backend/python-ai${NC}"
    echo -e ""
    echo -e "4. 访问项目："
    echo -e "   - 前端: ${GREEN}http://localhost:3000${NC}"
    echo -e "   - API 文档: ${GREEN}http://localhost:8080/swagger${NC}"
    echo -e ""
    echo -e "5. 查看数据库："
    echo -e "   - PostgreSQL: ${GREEN}docker exec -it dootask-ai-postgres psql -U dootask -d dootask_ai${NC}"
    echo -e "   - Redis: ${GREEN}docker exec -it dootask-ai-redis redis-cli${NC}"
    echo -e ""
    log_info "如需帮助，请查看 README.md 和 docs/DEVELOPMENT.md 文档"
}

# 主函数
main() {
    echo ""
    log_info "🚀 开始 DooTask AI 智能体插件项目快速启动..."
    echo ""
    
    check_dependencies
    setup_env
    install_frontend
    setup_backend
    start_databases
    check_database
    init_database
    create_go_service
    create_python_service
    
    echo ""
    show_next_steps
}

# 错误处理
cleanup() {
    log_error "脚本执行过程中发生错误，正在清理..."
    $DOCKER_COMPOSE -f docker/docker-compose.dev.yml down > /dev/null 2>&1 || true
    exit 1
}

trap cleanup ERR

# 运行主函数
main "$@" 