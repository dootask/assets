-- Description: 创建MCP工具配置表
-- MCP 工具配置表 (支持动态添加工具)

CREATE TABLE IF NOT EXISTS mcp_tools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general', -- 'search', 'weather', 'email', 'dootask', 'file'
    provider VARCHAR(100), -- 'google', 'openweather', 'internal', 'custom'
    config_schema JSONB DEFAULT '{}', -- 工具所需的配置字段定义
    config_values JSONB DEFAULT '{}', -- 实际配置值 (敏感信息加密)
    is_internal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
); 