-- Description: 创建AI模型配置表
-- AI 模型配置表 (支持多种 AI 服务)

CREATE TABLE IF NOT EXISTS ai_models (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'google', 'azure', 'local'
    model_name VARCHAR(255) NOT NULL, -- 'gpt-4', 'claude-3', 'gemini-pro'
    api_key TEXT, -- 加密存储，可为空(本地模型)
    base_url VARCHAR(500),
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
); 