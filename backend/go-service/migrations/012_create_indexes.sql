-- Description: 创建数据库索引
-- 数据库索引创建

-- 智能体表索引
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);

-- 对话记录索引
CREATE INDEX IF NOT EXISTS idx_conversations_dootask_chat_id ON conversations(dootask_chat_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dootask_user_id ON conversations(dootask_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);

-- 消息记录索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- 知识库索引
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_name ON knowledge_bases(name);

-- 知识库文档索引
CREATE INDEX IF NOT EXISTS idx_kb_documents_knowledge_base_id ON kb_documents(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_title ON kb_documents(title);
CREATE INDEX IF NOT EXISTS idx_kb_documents_embedding ON kb_documents USING ivfflat (embedding vector_cosine_ops);

-- AI模型索引
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
CREATE INDEX IF NOT EXISTS idx_ai_models_enabled ON ai_models(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_models_default ON ai_models(is_default);

-- MCP工具索引
CREATE INDEX IF NOT EXISTS idx_mcp_tools_category ON mcp_tools(category);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_provider ON mcp_tools(provider);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_active ON mcp_tools(is_active);

-- Webhook配置索引
CREATE INDEX IF NOT EXISTS idx_webhook_configs_bot_id ON webhook_configs(bot_id);

-- 用户会话索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 系统配置索引
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);

-- 操作日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at); 