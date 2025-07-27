-- Description: 插入默认数据和演示数据
-- 插入系统默认数据和丰富的演示数据（幂等性插入）

-- =============================================================================
-- AI 模型配置 (2025年最新版本)
-- =============================================================================

-- 最新 AI 模型配置 (需要在 Web 界面中添加 API Key)
INSERT INTO ai_models (name, provider, model_name, base_url, max_tokens, temperature, is_enabled, is_default) 
SELECT * FROM (VALUES
    -- OpenAI 最新模型 (2025)
    ('GPT-4.1', 'openai', 'gpt-4.1', 'https://api.openai.com/v1', 1000000, 0.7, false, true),
    ('GPT-4.1 Mini', 'openai', 'gpt-4.1-mini', 'https://api.openai.com/v1', 128000, 0.7, false, false),
    ('GPT-4o', 'openai', 'gpt-4o', 'https://api.openai.com/v1', 128000, 0.7, false, false),
    ('GPT-4o Mini', 'openai', 'gpt-4o-mini', 'https://api.openai.com/v1', 128000, 0.7, false, false),
    ('o3 Mini', 'openai', 'o3-mini', 'https://api.openai.com/v1', 128000, 0.7, false, false),
    ('o1', 'openai', 'o1', 'https://api.openai.com/v1', 200000, 0.7, false, false),
    
    -- Anthropic Claude 4 系列 (2025最新)
    ('Claude 4 Opus', 'anthropic', 'claude-opus-4-20250514', 'https://api.anthropic.com', 200000, 0.7, false, false),
    ('Claude 4 Sonnet', 'anthropic', 'claude-sonnet-4-20250514', 'https://api.anthropic.com', 200000, 0.7, false, false),
    ('Claude 3.7 Sonnet', 'anthropic', 'claude-3-7-sonnet-20250219', 'https://api.anthropic.com', 200000, 0.7, false, false),
    ('Claude 3.5 Sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', 'https://api.anthropic.com', 200000, 0.7, false, false),
    ('Claude 3.5 Haiku', 'anthropic', 'claude-3-5-haiku-20241022', 'https://api.anthropic.com', 200000, 0.7, false, false),
    
    -- Google Gemini 2.5 系列 (2025最新)
    ('Gemini 2.5 Pro', 'google', 'gemini-2.5-pro', 'https://generativelanguage.googleapis.com/v1beta', 1048576, 0.7, false, false),
    ('Gemini 2.5 Flash', 'google', 'gemini-2.5-flash', 'https://generativelanguage.googleapis.com/v1beta', 1048576, 0.7, false, false),
    ('Gemini 2.0 Flash', 'google', 'gemini-2.0-flash', 'https://generativelanguage.googleapis.com/v1beta', 1048576, 0.7, false, false),
    
    -- xAI Grok 系列 (2025最新)
    ('Grok 4', 'xai', 'grok-4', 'https://api.x.ai/v1', 256000, 0.7, false, false),
    ('Grok 3', 'xai', 'grok-3', 'https://api.x.ai/v1', 256000, 0.7, false, false),
    ('Grok 3 Mini', 'xai', 'grok-3-mini', 'https://api.x.ai/v1', 128000, 0.7, false, false),
    
    -- Meta Llama 4 系列 (2025最新)
    ('Llama 4 Maverick', 'meta', 'llama-4-maverick', 'https://api.llama-api.com/v1', 128000, 0.7, false, false),
    ('Llama 4 Scout', 'meta', 'llama-4-scout', 'https://api.llama-api.com/v1', 128000, 0.7, false, false),
    ('Llama 3.3 70B', 'meta', 'llama-3.3-70b-instruct', 'https://api.llama-api.com/v1', 128000, 0.7, false, false),
    
    -- DeepSeek 系列 (2025最新)
    ('DeepSeek R1', 'deepseek', 'deepseek-r1', 'https://api.deepseek.com/v1', 128000, 0.7, false, false),
    ('DeepSeek V3', 'deepseek', 'deepseek-v3', 'https://api.deepseek.com/v1', 128000, 0.7, false, false),
    
    -- 其他新兴模型
    ('Qwen 3 235B', 'alibaba', 'qwen3-235b', 'https://dashscope.aliyuncs.com/api/v1', 128000, 0.7, false, false),
    ('Command A', 'cohere', 'command-a', 'https://api.cohere.ai/v1', 256000, 0.7, false, false)
) AS tmp(name, provider, model_name, base_url, max_tokens, temperature, is_enabled, is_default)
WHERE NOT EXISTS (SELECT 1 FROM ai_models WHERE ai_models.name = tmp.name);

-- =============================================================================
-- 智能体配置
-- =============================================================================

-- 基础智能体 (使用最新的 GPT-4.1)
INSERT INTO agents (name, description, prompt, ai_model_id, temperature, metadata) 
SELECT name, description, prompt, 
    (SELECT id FROM ai_models WHERE name = 'GPT-4.1' LIMIT 1), 
    temperature, metadata::JSONB
FROM (VALUES
    ('默认助手', '通用AI助手，可以回答各种问题', 
     '你是一个专业、友好的AI助手，会用中文回答用户的问题。请保持礼貌和专业。', 
     0.7, '{"category": "general", "tags": ["assistant", "general"]}'),
    
    ('客服助手', '专业的客服AI助手', 
     '你是一个专业的客服代表，能够帮助用户解决各种问题。请保持耐心、友好的态度，并尽力为用户提供准确的信息。', 
     0.3, '{"category": "support", "tags": ["customer-service", "support"]}')
) AS tmp(name, description, prompt, temperature, metadata)
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE agents.name = tmp.name);

-- 技术顾问使用最新的Claude 4 Opus模型
INSERT INTO agents (name, description, prompt, ai_model_id, temperature, metadata) 
SELECT '技术顾问', '技术问题解答专家', 
    '你是一个技术专家，擅长解答编程、系统架构、技术选型等问题。请提供准确、实用的技术建议。', 
    (SELECT id FROM ai_models WHERE name = 'Claude 4 Opus' LIMIT 1), 
    0.5, '{"category": "technical", "tags": ["technology", "consulting"]}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE name = '技术顾问');

-- 专业智能体 (使用最新的Claude 4 Sonnet)
INSERT INTO agents (name, description, prompt, ai_model_id, temperature, metadata) 
SELECT name, description, prompt, 
    (SELECT id FROM ai_models WHERE name = 'Claude 4 Sonnet' LIMIT 1), 
    temperature, metadata::JSONB
FROM (VALUES
    ('代码审查助手', '专业的代码审查和质量分析助手', 
     '你是一个专业的代码审查专家，具备多年的软件开发经验。请仔细分析提供的代码，从以下方面进行审查：\n1. 代码质量和规范性\n2. 潜在的bug和安全问题\n3. 性能优化建议\n4. 可维护性改进\n请提供具体、可操作的改进建议。', 
     0.3, '{"category": "development", "tags": ["code-review", "quality"], "tools": ["github_api", "file_reader"]}'),
    
    ('文档写作助手', '技术文档和说明书写作专家', 
     '你是一个专业的技术写作专家，擅长创建清晰、准确、易懂的技术文档。请根据用户的需求，帮助编写各种类型的技术文档，包括API文档、用户手册、开发指南等。注意保持文档的结构化和专业性。', 
     0.5, '{"category": "documentation", "tags": ["writing", "technical"], "tools": ["file_reader", "file_converter"]}'),
    
    ('数据分析师', '数据分析和可视化专家', 
     '你是一个专业的数据分析师，擅长数据处理、统计分析和可视化。请帮助用户分析数据，发现数据中的模式和趋势，并提供有价值的洞察和建议。支持处理CSV、JSON等格式的数据。', 
     0.4, '{"category": "analytics", "tags": ["data", "analysis"], "tools": ["csv_processor", "json_processor", "text_analyzer"]}'),
    
    ('项目经理助手', '项目管理和协调专家', 
     '你是一个经验丰富的项目经理，擅长项目规划、进度管理、风险控制和团队协调。请帮助用户制定项目计划、跟踪项目进度、识别和解决项目中的问题，确保项目按时按质完成。', 
     0.6, '{"category": "management", "tags": ["project", "planning"], "tools": ["dootask_project", "dootask_task", "webhook_sender"]}'),
    
    ('安全顾问', '网络安全和信息安全专家', 
     '你是一个网络安全专家，具备丰富的安全评估和防护经验。请帮助用户识别系统中的安全风险，提供安全加固建议，制定安全策略和应急响应计划。重点关注常见的安全威胁和最佳防护实践。', 
     0.3, '{"category": "security", "tags": ["security", "audit"], "tools": ["password_generator", "http_client", "text_analyzer"]}')
) AS tmp(name, description, prompt, temperature, metadata)
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE agents.name = tmp.name);

-- =============================================================================
-- MCP 工具配置
-- =============================================================================

-- DooTask 内置工具
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('dootask_chat', 'DooTask 聊天记录查询', 'dootask', 'internal', 
     '{"endpoint": "/api/chat", "methods": ["get_messages", "search_messages"]}', '["read"]', true),
    ('dootask_project', 'DooTask 项目管理工具', 'dootask', 'internal', 
     '{"endpoint": "/api/project", "methods": ["create_project", "get_projects", "update_project"]}', '["read", "write"]', true),
    ('dootask_task', 'DooTask 任务管理工具', 'dootask', 'internal', 
     '{"endpoint": "/api/task", "methods": ["create_task", "get_tasks", "update_task", "delete_task"]}', '["read", "write"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- 文件处理工具
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('file_reader', '读取和分析各种格式的文件内容', 'custom', 'internal', 
     '{"supported_formats": "txt,md,pdf,docx,xlsx", "max_file_size": "10MB"}', '["read"]', true),
    
    ('file_converter', '文件格式转换工具', 'custom', 'internal', 
     '{"input_formats": "pdf,docx,xlsx", "output_formats": "txt,md,json"}', '["read", "write"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- 网络和API工具
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('http_client', '通用HTTP请求工具', 'custom', 'internal', 
     '{"timeout": 30, "max_retries": 3, "user_agent": "DooTask-AI/1.0"}', '["read", "write"]', true),
    
    ('webhook_sender', '发送Webhook通知', 'custom', 'internal', 
     '{"default_timeout": 15, "retry_attempts": 3}', '["write"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- 数据处理工具
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('json_processor', 'JSON数据解析和处理工具', 'custom', 'internal', 
     '{"max_depth": 10, "pretty_print": true}', '["read", "write"]', true),
    
    ('csv_processor', 'CSV文件读取和处理工具', 'custom', 'internal', 
     '{"delimiter": ",", "encoding": "utf-8", "skip_empty_lines": true}', '["read", "write"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- AI和机器学习工具
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('text_analyzer', '文本情感分析和关键词提取', 'custom', 'internal', 
     '{"language": "zh", "enable_sentiment": true, "enable_keywords": true}', '["read"]', true),
    
    ('image_analyzer', '图像识别和分析工具', 'custom', 'internal', 
     '{"max_size": 5, "supported_formats": "jpg,png,gif,webp", "enable_ocr": true}', '["read"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- 实用工具
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('qr_generator', '生成QR码', 'custom', 'internal', 
     '{"size": 200, "format": "png", "error_correction": "M"}', '["read", "write"]', true),
    
    ('url_shortener', '生成短链接', 'custom', 'internal', 
     '{"domain": "short.ly", "expiry_days": 30, "custom_alias": true}', '["read", "write"]', true),
    
    ('password_generator', '生成安全密码', 'custom', 'internal', 
     '{"length": 16, "include_symbols": true, "include_numbers": true, "exclude_ambiguous": true}', '["read"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- 外部服务集成工具 (需要配置API密钥)
INSERT INTO mcp_tools (name, description, category, type, config, permissions, is_active) 
SELECT name, description, category, type, config::JSONB, permissions::JSONB, is_active FROM (VALUES
    ('google_search', '网页搜索工具', 'external', 'external', 
     '{"api_key": "", "cx": ""}', '["read"]', true),
    
    ('weather', '天气信息查询工具', 'external', 'external', 
     '{"api_key": ""}', '["read"]', true),
    
    ('github_api', 'GitHub仓库和代码管理', 'external', 'external', 
     '{"token": "", "base_url": "https://api.github.com", "timeout": 30}', '["read", "write"]', true),
    
    ('slack_api', 'Slack消息和通知工具', 'external', 'external', 
     '{"bot_token": "", "webhook_url": "", "default_channel": "#general"}', '["write"]', true),
    
    ('email_sender', '发送邮件通知', 'external', 'external', 
     '{"smtp_host": "", "smtp_port": 587, "username": "", "password": "", "use_tls": true}', '["write"]', true)
) AS tmp(name, description, category, type, config, permissions, is_active)
WHERE NOT EXISTS (SELECT 1 FROM mcp_tools WHERE mcp_tools.name = tmp.name);

-- =============================================================================
-- 知识库配置
-- =============================================================================

-- 演示知识库
INSERT INTO knowledge_bases (name, description, embedding_model, chunk_size, chunk_overlap, metadata, is_active) 
SELECT name, description, embedding_model, chunk_size, chunk_overlap, metadata::JSONB, is_active FROM (VALUES
    ('DooTask使用手册', 'DooTask项目管理系统的完整使用指南和最佳实践', 'text-embedding-ada-002', 1000, 200, 
     '{"language": "zh", "category": "manual", "version": "1.0", "tags": ["dootask", "manual", "guide"]}', true),
    
    ('AI开发最佳实践', 'AI应用开发的最佳实践和常见问题解决方案', 'text-embedding-ada-002', 800, 150, 
     '{"language": "zh", "category": "development", "version": "1.0", "tags": ["ai", "development", "best-practices"]}', true),
    
    ('技术文档库', '常用技术文档和API参考资料', 'text-embedding-ada-002', 1200, 250, 
     '{"language": "zh", "category": "technical", "version": "1.0", "tags": ["api", "documentation", "reference"]}', true),
    
    ('客服知识库', '客服常见问题和解决方案', 'text-embedding-ada-002', 600, 100, 
     '{"language": "zh", "category": "support", "version": "1.0", "tags": ["support", "faq", "customer-service"]}', true),
    
    ('产品功能介绍', '产品功能详细介绍和使用说明', 'text-embedding-ada-002', 900, 180, 
     '{"language": "zh", "category": "product", "version": "1.0", "tags": ["product", "features", "introduction"]}', true)
) AS tmp(name, description, embedding_model, chunk_size, chunk_overlap, metadata, is_active)
WHERE NOT EXISTS (SELECT 1 FROM knowledge_bases WHERE knowledge_bases.name = tmp.name);

-- 客服知识库文档
INSERT INTO kb_documents (knowledge_base_id, title, content, file_type, metadata, is_active)
SELECT 
    (SELECT id FROM knowledge_bases WHERE name = '客服知识库' LIMIT 1),
    title, content, file_type, metadata::JSONB, is_active
FROM (VALUES
    ('如何创建新项目', 
     '创建新项目的步骤：\n1. 点击"新建项目"按钮\n2. 填写项目名称和描述\n3. 选择项目模板\n4. 设置项目权限\n5. 邀请团队成员\n6. 点击"创建"完成\n\n注意事项：\n- 项目名称不能重复\n- 描述建议详细填写\n- 权限设置要谨慎', 
     'text', '{"category": "tutorial", "difficulty": "beginner", "tags": ["project", "creation"]}', true),
    
    ('任务管理最佳实践', 
     '任务管理的最佳实践：\n\n1. 任务分解\n- 将大任务分解为小任务\n- 每个任务时间不超过4小时\n- 明确任务的验收标准\n\n2. 优先级管理\n- 使用四象限法则\n- 紧急且重要的任务优先\n- 定期回顾和调整\n\n3. 协作沟通\n- 及时更新任务状态\n- 主动沟通遇到的问题\n- 记录重要的讨论结果', 
     'text', '{"category": "best-practice", "difficulty": "intermediate", "tags": ["task", "management", "collaboration"]}', true),
    
    ('常见问题解答', 
     'Q: 忘记密码怎么办？\nA: 点击登录页面的"忘记密码"链接，输入邮箱地址，系统会发送重置密码的邮件。\n\nQ: 如何邀请团队成员？\nA: 在项目设置中点击"成员管理"，输入成员邮箱并选择角色权限，发送邀请。\n\nQ: 任务状态有哪些？\nA: 待开始、进行中、待审核、已完成、已取消。\n\nQ: 如何设置任务提醒？\nA: 在任务详情页面设置截止时间，系统会自动发送提醒通知。', 
     'text', '{"category": "faq", "difficulty": "beginner", "tags": ["faq", "support", "common-issues"]}', true)
) AS tmp(title, content, file_type, metadata, is_active);

-- 技术文档库文档
INSERT INTO kb_documents (knowledge_base_id, title, content, file_type, metadata, is_active)
SELECT 
    (SELECT id FROM knowledge_bases WHERE name = '技术文档库' LIMIT 1),
    title, content, file_type, metadata::JSONB, is_active
FROM (VALUES
    ('RESTful API设计规范', 
     'RESTful API设计规范：\n\n1. URL设计\n- 使用名词，避免动词\n- 使用复数形式\n- 层级不超过3层\n- 示例：/api/v1/projects/123/tasks\n\n2. HTTP方法\n- GET: 获取资源\n- POST: 创建资源\n- PUT: 更新整个资源\n- PATCH: 部分更新\n- DELETE: 删除资源\n\n3. 状态码\n- 200: 成功\n- 201: 创建成功\n- 400: 请求错误\n- 401: 未认证\n- 403: 无权限\n- 404: 资源不存在\n- 500: 服务器错误', 
     'text', '{"category": "api", "difficulty": "intermediate", "tags": ["api", "restful", "design"]}', true),
    
    ('数据库设计最佳实践', 
     '数据库设计最佳实践：\n\n1. 命名规范\n- 表名使用复数形式\n- 字段名使用snake_case\n- 索引名包含表名和字段名\n\n2. 数据类型选择\n- 根据实际需要选择合适的长度\n- 避免使用TEXT存储短字符串\n- 时间字段使用TIMESTAMP\n\n3. 索引策略\n- 主键自动创建聚簇索引\n- 外键字段创建索引\n- 查询频繁的字段创建索引\n- 避免过多索引影响写入性能', 
     'text', '{"category": "database", "difficulty": "advanced", "tags": ["database", "design", "performance"]}', true)
) AS tmp(title, content, file_type, metadata, is_active);

-- =============================================================================
-- 系统配置
-- =============================================================================

-- 基础系统配置
INSERT INTO system_configs (key, value, description) 
SELECT * FROM (VALUES
    ('max_tokens_per_request', '4000', '每次请求的最大token数'),
    ('max_conversation_history', '20', '保留的对话历史条数'),
    ('enable_audit_log', 'true', '是否启用审计日志'),
    ('webhook_timeout', '30', 'Webhook超时时间（秒）'),
    ('default_agent_temperature', '0.7', '默认智能体温度参数'),
    ('mcp_tool_timeout', '60', 'MCP工具执行超时时间（秒）'),
    ('knowledge_base_chunk_batch_size', '100', '知识库文档分块批处理大小'),
    ('ai_response_cache_ttl', '3600', 'AI响应缓存时间（秒）'),
    ('max_file_upload_size', '50', '最大文件上传大小（MB）'),
    ('enable_tool_logging', 'true', '是否启用工具执行日志'),
    ('default_embedding_model', 'text-embedding-ada-002', '默认向量化模型'),
    ('webhook_retry_delay', '5', 'Webhook重试延迟（秒）'),
    ('session_cleanup_interval', '24', '会话清理间隔（小时）'),
    ('audit_log_retention_days', '90', '审计日志保留天数'),
    ('tool_rate_limit_per_minute', '100', '工具调用频率限制（每分钟）')
) AS tmp(key, value, description)
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE system_configs.key = tmp.key); 