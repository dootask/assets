#!/bin/bash

# 获取当前工作目录
CURRENT_DIR=$(pwd)

# 获取脚本所在目录（推荐方法）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 初始化环境变量
initEnv() {
    if [ ! -f "${CURRENT_DIR}/.env" ]; then
        cp "${CURRENT_DIR}/config.example.env" "${CURRENT_DIR}/.env"
    fi
}

# 获取环境变量
getEnv() {
    local key=$1
    local default=$2
    local value=$(grep "^$key=" "${CURRENT_DIR}/.env" 2>/dev/null | cut -d '=' -f 2-)
    if [ -z "$value" ]; then
        value=$default
    fi
    echo "$value"
}

# 设置环境变量
setEnv() {
    local key=$1
    local value=$2
    
    # 确保 .env 文件存在
    if [ ! -f "${CURRENT_DIR}/.env" ]; then
        touch "${CURRENT_DIR}/.env"
    fi
    
    # 检查键是否已存在
    if grep -q "^$key=" "${CURRENT_DIR}/.env" 2>/dev/null; then
        # 键存在，替换值
        # 兼容 macOS 和 Linux 的 sed -i
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^$key=.*/$key=$value/" "${CURRENT_DIR}/.env"
        else
            # Linux
            sed -i "s/^$key=.*/$key=$value/" "${CURRENT_DIR}/.env"
        fi
    else
        # 键不存在，添加到文件末尾
        echo "$key=$value" >> "${CURRENT_DIR}/.env"
    fi
}

# 执行初始化
initEnv

