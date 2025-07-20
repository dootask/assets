-- DooTask AI 智能体插件数据库初始化脚本
-- 
-- 该脚本创建 AI 智能体插件所需的所有数据表和索引

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 智能体配置表
CREATE TABLE IF NOT EXISTS agents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    ai_model_id BIGINT REFERENCES ai_models(id), -- 关联到 ai_models 表
    temperature DECIMAL(3,2) DEFAULT 0.7,
    tools JSONB DEFAULT '[]',
    knowledge_bases JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 对话记录表
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT REFERENCES agents(id),
    dootask_chat_id VARCHAR(255) NOT NULL,
    dootask_user_id VARCHAR(255) NOT NULL,
    context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 消息记录表
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES conversations(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 知识库文档表
CREATE TABLE IF NOT EXISTS kb_documents (
    id BIGSERIAL PRIMARY KEY,
    knowledge_base_id BIGINT REFERENCES knowledge_bases(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size BIGINT,
    embedding VECTOR(1536), -- OpenAI embedding 维度
    metadata JSONB DEFAULT '{}',
    chunk_index INTEGER DEFAULT 0,
    parent_doc_id BIGINT REFERENCES kb_documents(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
-- 对话记录索引
CREATE INDEX IF NOT EXISTS idx_conversations_dootask_chat_id ON conversations(dootask_chat_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dootask_user_id ON conversations(dootask_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);

-- 消息记录索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 知识库文档索引
CREATE INDEX IF NOT EXISTS idx_kb_documents_knowledge_base_id ON kb_documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_embedding ON kb_documents USING ivfflat (embedding vector_cosine_ops);

-- Webhook 配置索引
CREATE INDEX IF NOT EXISTS idx_webhook_configs_bot_id ON webhook_configs(bot_id);

-- 用户会话索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 操作日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_bases_updated_at BEFORE UPDATE ON knowledge_bases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_documents_updated_at BEFORE UPDATE ON kb_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_tools_updated_at BEFORE UPDATE ON mcp_tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认数据（幂等性插入）
-- 默认智能体 (关联到 ai_models 表)
INSERT INTO agents (name, description, prompt, ai_model_id, temperature) 
SELECT * FROM (VALUES
    ('默认助手', '通用AI助手，可以回答各种问题', '你是一个专业、友好的AI助手，会用中文回答用户的问题。请保持礼貌和专业。', 1, 0.7),
    ('客服助手', '专业的客服AI助手', '你是一个专业的客服代表，能够帮助用户解决各种问题。请保持耐心、友好的态度，并尽力为用户提供准确的信息。', 1, 0.3),
    ('技术顾问', '技术问题解答专家', '你是一个技术专家，擅长解答编程、系统架构、技术选型等问题。请提供准确、实用的技术建议。', 2, 0.5)
) AS tmp(name, description, prompt, ai_model_id, temperature)
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE agents.name = tmp.name);

-- 默认 AI 模型配置 (需要在 Web 界面中添加 API Key)
INSERT INTO ai_models (name, provider, model_name, base_url, max_tokens, temperature, is_enabled, is_default) 
SELECT * FROM (VALUES
    ('GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'https://api.openai.com/v1', 4000, 0.7, false, true),
    ('GPT-4', 'openai', 'gpt-4', 'https://api.openai.com/v1', 8000, 0.7, false, false),
    ('Claude 3 Haiku', 'anthropic', 'claude-3-haiku-20240307', 'https://api.anthropic.com', 4000, 0.7, false, false),
    ('Claude 3 Sonnet', 'anthropic', 'claude-3-sonnet-20240229', 'https://api.anthropic.com', 4000, 0.7, false, false),
    ('Gemini Pro', 'google', 'gemini-pro', 'https://generativelanguage.googleapis.com/v1beta', 4000, 0.7, false, false)
) AS tmp(name, provider, model_name, base_url, max_tokens, temperature, is_enabled, is_default)
WHERE NOT EXISTS (SELECT 1 FROM ai_models WHERE ai_models.name = tmp.name);

-- 默认MCP工具配置模板
INSERT INTO mcp_tools (name, display_name, description, category, provider, config_schema, config_values, is_internal) 
SELECT * FROM (VALUES
    ('dootask_chat', 'DooTask 聊天记录', 'DooTask 聊天记录查询', 'dootask', 'internal', 
     '{"fields": []}', '{"endpoint": "/api/chat", "methods": ["get_messages", "search_messages"]}', true),
    ('dootask_project', 'DooTask 项目管理', 'DooTask 项目管理工具', 'dootask', 'internal', 
     '{"fields": []}', '{"endpoint": "/api/project", "methods": ["create_project", "get_projects", "update_project"]}', true),
    ('dootask_task', 'DooTask 任务管理', 'DooTask 任务管理工具', 'dootask', 'internal', 
     '{"fields": []}', '{"endpoint": "/api/task", "methods": ["create_task", "get_tasks", "update_task", "delete_task"]}', true),
    ('google_search', 'Google 搜索', '网页搜索工具', 'search', 'google', 
     '{"fields": [{"name": "api_key", "label": "API Key", "type": "password", "required": true}, {"name": "cx", "label": "Search Engine ID", "type": "text", "required": true}]}', 
     '{"api_key": "", "cx": ""}', false),
    ('weather', '天气查询', '天气信息查询工具', 'weather', 'openweather', 
     '{"fields": [{"name": "api_key", "label": "API Key", "type": "password", "required": true}]}', 
     '{"api_key": ""}', false)
) AS tmp(name, display_name, description, category, provider, config_schema, config_values, is_internal)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- 默认系统配置 (基础配置，AI 和工具配置已移至 Web 界面)
INSERT INTO system_configs (key, value, description) 
SELECT * FROM (VALUES
    ('max_tokens_per_request', '4000', '每次请求的最大token数'),
    ('max_conversation_history', '20', '保留的对话历史条数'),
    ('enable_audit_log', 'true', '是否启用审计日志'),
    ('webhook_timeout', '30', 'Webhook超时时间（秒）'),
    ('default_agent_temperature', '0.7', '默认智能体温度参数')
) AS tmp(key, value, description)
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE system_configs.key = tmp.key);

-- 创建数据库索引
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dootask_chat_id ON conversations(dootask_chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_name ON knowledge_bases(name);
CREATE INDEX IF NOT EXISTS idx_kb_documents_knowledge_base_id ON kb_documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_title ON kb_documents(title);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_enabled ON ai_models(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_models_default ON ai_models(is_default);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_category ON mcp_tools(category);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_provider ON mcp_tools(provider);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_active ON mcp_tools(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_bot_id ON webhook_configs(bot_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);

-- 输出初始化完成信息
DO $$ 
BEGIN 
    RAISE NOTICE 'DooTask AI 数据库初始化完成！';
    RAISE NOTICE '创建了 % 个表', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE '创建了 % 个索引', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public');
END $$; 