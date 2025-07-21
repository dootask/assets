-- Description: 创建智能体配置表
-- 智能体配置表

CREATE TABLE IF NOT EXISTS agents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    ai_model_id BIGINT REFERENCES ai_models(id),
    temperature DECIMAL(3,2) DEFAULT 0.7,
    tools JSONB DEFAULT '[]',
    knowledge_bases JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
); 