-- Description: 创建MCP工具配置表
-- MCP 工具配置表 (支持动态添加工具)

CREATE TABLE IF NOT EXISTS mcp_tools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'external' CHECK (category IN ('dootask', 'external', 'custom')),
    type VARCHAR(20) NOT NULL DEFAULT 'external' CHECK (type IN ('internal', 'external')),
    config JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '["read"]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
); 