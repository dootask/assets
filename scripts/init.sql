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
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
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

-- MCP 工具配置表
CREATE TABLE IF NOT EXISTS mcp_tools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    config JSONB DEFAULT '{}',
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

-- 插入默认数据
-- 默认智能体
INSERT INTO agents (name, description, prompt, model, temperature) VALUES
('默认助手', '通用AI助手，可以回答各种问题', '你是一个专业、友好的AI助手，会用中文回答用户的问题。请保持礼貌和专业。', 'gpt-3.5-turbo', 0.7),
('客服助手', '专业的客服AI助手', '你是一个专业的客服代表，能够帮助用户解决各种问题。请保持耐心、友好的态度，并尽力为用户提供准确的信息。', 'gpt-3.5-turbo', 0.3),
('技术顾问', '技术问题解答专家', '你是一个技术专家，擅长解答编程、系统架构、技术选型等问题。请提供准确、实用的技术建议。', 'gpt-4', 0.5);

-- 默认MCP工具
INSERT INTO mcp_tools (name, description, category, config, is_internal) VALUES
('dootask_chat', 'DooTask 聊天记录查询', 'dootask', '{"endpoint": "/api/chat", "methods": ["get_messages", "search_messages"]}', true),
('dootask_project', 'DooTask 项目管理', 'dootask', '{"endpoint": "/api/project", "methods": ["create_project", "get_projects", "update_project"]}', true),
('dootask_task', 'DooTask 任务管理', 'dootask', '{"endpoint": "/api/task", "methods": ["create_task", "get_tasks", "update_task", "delete_task"]}', true),
('web_search', '网页搜索工具', 'external', '{"provider": "google", "api_key": "", "cx": ""}', false),
('weather', '天气查询工具', 'external', '{"provider": "openweathermap", "api_key": ""}', false);

-- 默认系统配置
INSERT INTO system_configs (key, value, description) VALUES
('openai_api_key', '', 'OpenAI API密钥'),
('max_tokens_per_request', '4000', '每次请求的最大token数'),
('max_conversation_history', '20', '保留的对话历史条数'),
('enable_audit_log', 'true', '是否启用审计日志'),
('webhook_timeout', '30', 'Webhook超时时间（秒）');

-- 输出初始化完成信息
DO $$ 
BEGIN 
    RAISE NOTICE 'DooTask AI 数据库初始化完成！';
    RAISE NOTICE '创建了 % 个表', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE '创建了 % 个索引', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public');
END $$; 