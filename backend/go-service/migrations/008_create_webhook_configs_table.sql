-- Description: 创建Webhook配置表
-- Webhook 配置表

CREATE TABLE IF NOT EXISTS webhook_configs (
    id BIGSERIAL PRIMARY KEY,
    bot_id VARCHAR(255) NOT NULL UNIQUE,
    agent_id BIGINT REFERENCES agents(id),
    webhook_url VARCHAR(500) NOT NULL,
    secret_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
); 