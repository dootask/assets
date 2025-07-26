# DooTask AI Python聊天服务

基于LangChain和FastAPI构建的智能AI聊天服务，支持多种AI提供商、知识库检索增强生成（RAG）和MCP工具调用。

## 🚀 核心功能

### 1. 多AI提供商支持

- **OpenAI**: GPT-4, GPT-3.5-turbo等
- **Anthropic**: Claude-3系列模型
- **Ollama**: 本地部署的开源模型

### 2. 知识库检索增强生成（RAG）

- 支持多知识库同时检索
- 可配置检索参数（top_k、相似度阈值等）
- 支持文档重新排序
- 自动将检索结果融入对话上下文

### 3. MCP（Model Context Protocol）工具调用

- 支持多种工具同时使用
- 可配置工具选择策略
- 工具调用结果自动记录和返回

### 4. 流式和非流式响应

- 支持Server-Sent Events（SSE）流式输出
- 实时token流式传输
- 支持检索和工具调用状态推送

### 5. 完善的配置和验证

- Pydantic模型验证
- 详细的错误处理和日志
- 灵活的参数配置

## 🚀 快速启动

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 启动服务

```bash
# 开发模式启动
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --env-file ../../.env --reload
```

### 3. 验证服务

```bash
# 健康检查
curl http://localhost:8001/health
```

## 📚 API文档

启动服务后访问：

- Swagger UI: http://localhost:8001/docs

## 🔧 API接口说明

### 1. 基础聊天接口

#### `POST /chat`

非流式聊天接口

**请求示例:**

```json
{
  "prompt": "请解释什么是人工智能？",
  "model": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "api_key": "your-api-key"
  },
  "generation_config": {
    "max_tokens": 1000,
    "temperature": 0.7
  },
  "system_message": "你是一个专业的AI助手"
}
```

**响应示例:**

```json
{
  "message": "人工智能（AI）是计算机科学的一个分支...",
  "model": "gpt-3.5-turbo",
  "provider": "openai",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 200,
    "total_tokens": 250
  },
  "conversation_id": "conv_123",
  "timestamp": "2024-01-01T12:00:00"
}
```

### 2. 流式聊天接口

#### `POST /chat/stream`

流式聊天接口，返回SSE格式的实时响应

**请求示例:**

```json
{
  "prompt": "请详细介绍机器学习",
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "api_key": "your-api-key"
  },
  "stream": true
}
```

**响应流示例:**

```
data: {"type": "start", "message": "Stream started"}

data: {"type": "token", "content": "机器"}

data: {"type": "token", "content": "学习"}

data: {"type": "end", "message": "Stream completed"}
```

### 3. 多轮对话

**请求示例:**

```json
{
  "messages": [
    { "role": "user", "content": "我想学习Python" },
    { "role": "assistant", "content": "很好！Python是一门优秀的语言" },
    { "role": "user", "content": "从哪里开始？" }
  ],
  "model": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "api_key": "your-api-key"
  },
  "conversation_id": "conv_001"
}
```

### 4. 知识库检索增强（RAG）

**请求示例:**

```json
{
  "prompt": "DooTask的主要功能有哪些？",
  "model": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "api_key": "your-api-key"
  },
  "retrieval_config": {
    "enabled": true,
    "knowledge_base_ids": ["kb_dootask_docs"],
    "top_k": 5,
    "score_threshold": 0.7,
    "rerank": true
  }
}
```

**响应示例:**

```json
{
  "message": "根据检索到的文档，DooTask的主要功能包括...",
  "model": "gpt-3.5-turbo",
  "provider": "openai",
  "retrieval_docs": [
    {
      "content": "DooTask是一个任务管理系统...",
      "source": "kb_dootask_docs",
      "score": 0.85,
      "metadata": { "title": "DooTask功能介绍" }
    }
  ]
}
```

### 5. MCP工具调用

**请求示例:**

```json
{
  "prompt": "帮我查询天气并创建提醒",
  "model": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "api_key": "your-api-key"
  },
  "mcp_config": {
    "enabled": true,
    "tools": [
      {
        "name": "weather_tool",
        "enabled": true,
        "config": { "api_key": "weather-api-key" }
      },
      {
        "name": "task_manager",
        "enabled": true
      }
    ],
    "tool_choice": "auto",
    "max_tool_calls": 3
  }
}
```

### 6. 获取支持的模型

#### `GET /chat/models`

**响应示例:**

```json
{
  "supported_providers": ["openai", "anthropic", "ollama"],
  "models": {
    "openai": {
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "description": "OpenAI官方模型"
    },
    "anthropic": {
      "models": ["claude-3-5-sonnet-20241022"],
      "description": "Anthropic Claude模型"
    }
  }
}
```

## 🧪 使用示例

项目包含完整的使用示例，运行：

```bash
python example_usage.py
```

该示例包含：

1. 基础聊天
2. 多轮对话
3. RAG检索
4. MCP工具调用
5. 流式响应
6. 本地模型使用

## 📊 参数配置详解

### ModelConfig（模型配置）

| 参数     | 类型   | 必需 | 说明                                |
| -------- | ------ | ---- | ----------------------------------- |
| provider | string | ✅   | AI提供商: openai, anthropic, ollama |
| model    | string | ✅   | 模型名称                            |
| api_key  | string | ❌   | API密钥                             |
| base_url | string | ❌   | 自定义API地址                       |

### GenerationConfig（生成配置）

| 参数              | 类型  | 默认值 | 说明                |
| ----------------- | ----- | ------ | ------------------- |
| max_tokens        | int   | 4000   | 最大生成token数     |
| temperature       | float | 0.7    | 温度参数(0.0-2.0)   |
| top_p             | float | null   | 核采样参数(0.0-1.0) |
| frequency_penalty | float | null   | 频率惩罚(-2.0-2.0)  |
| presence_penalty  | float | null   | 存在惩罚(-2.0-2.0)  |

### RetrievalConfig（检索配置）

| 参数               | 类型  | 默认值 | 说明                 |
| ------------------ | ----- | ------ | -------------------- |
| enabled            | bool  | false  | 是否启用检索         |
| knowledge_base_ids | list  | []     | 知识库ID列表         |
| top_k              | int   | 5      | 检索返回文档数(1-20) |
| score_threshold    | float | 0.7    | 相似度阈值(0.0-1.0)  |
| rerank             | bool  | false  | 是否重新排序         |

### MCPConfig（MCP工具配置）

| 参数           | 类型   | 默认值 | 说明                   |
| -------------- | ------ | ------ | ---------------------- |
| enabled        | bool   | false  | 是否启用MCP工具        |
| tools          | list   | []     | 工具配置列表           |
| tool_choice    | string | "auto" | 工具选择策略           |
| max_tool_calls | int    | 5      | 最大工具调用次数(1-10) |

## 🔄 错误处理

服务使用标准化的错误格式：

```json
{
  "code": "ERROR_CODE",
  "message": "详细错误描述",
  "data": {}
}
```

常见错误码：

- `MODEL_001`: 不支持的AI提供商
- `CHAT_001`: 聊天处理失败
- `FORMAT_001`: 请求格式错误
- `AUTH_001`: 认证失败
- `VALIDATION_001`: 数据验证错误

## 🔧 扩展开发

### 添加新的AI提供商

1. 在`ChatService`类中添加新的创建方法
2. 更新`supported_providers`字典
3. 在`get_supported_models`接口中添加模型信息

### 实现真实的知识库检索

1. 替换`_retrieve_knowledge`方法的模拟实现
2. 集成向量数据库（ChromaDB、FAISS等）
3. 实现文档嵌入和相似度搜索

### 实现真实的MCP工具

1. 替换`_execute_mcp_tools`方法的模拟实现
2. 集成MCP协议规范
3. 实现具体的工具调用逻辑

## 📝 开发注意事项

1. **API密钥安全**: 不要在代码中硬编码API密钥
2. **错误处理**: 包装所有外部API调用并提供有意义的错误信息
3. **日志记录**: 记录重要的操作和错误信息
4. **性能优化**: 使用异步编程，避免阻塞操作
5. **参数验证**: 使用Pydantic进行严格的参数验证

## 🧪 测试

```bash
# 运行完整示例（需要有效API密钥）
python example.py
```
