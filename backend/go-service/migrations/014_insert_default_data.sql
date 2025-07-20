-- Description: 插入默认数据
-- 插入默认数据（幂等性插入）

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

-- 默认智能体 (关联到 ai_models 表)
INSERT INTO agents (name, description, prompt, ai_model_id, temperature) 
SELECT * FROM (VALUES
    ('默认助手', '通用AI助手，可以回答各种问题', '你是一个专业、友好的AI助手，会用中文回答用户的问题。请保持礼貌和专业。', 1, 0.7),
    ('客服助手', '专业的客服AI助手', '你是一个专业的客服代表，能够帮助用户解决各种问题。请保持耐心、友好的态度，并尽力为用户提供准确的信息。', 1, 0.3),
    ('技术顾问', '技术问题解答专家', '你是一个技术专家，擅长解答编程、系统架构、技术选型等问题。请提供准确、实用的技术建议。', 2, 0.5)
) AS tmp(name, description, prompt, ai_model_id, temperature)
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE agents.name = tmp.name);

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