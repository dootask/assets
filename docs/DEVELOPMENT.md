# DooTask AI 智能体插件 - 开发指南

## 🚀 快速开始

### 环境要求

- **Node.js** 18+ 
- **Go** 1.21+
- **Python** 3.11+
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** 和 **Docker Compose**

### 项目克隆和初始化

```bash
# 进入 dootask-ai 目录
cd dootask-ai

# 安装前端依赖
npm install

# 初始化后端目录结构
mkdir -p backend/{go-service,python-ai}
mkdir -p mcp-tools/{dootask-mcp,external-mcp}
mkdir -p docs scripts docker
```

### 环境配置

```bash
# 复制环境配置文件
cp config.example.env .env

# 编辑环境变量 (.env 文件)
DOOTASK_API_URL=http://your-dootask-instance.com/api
DOOTASK_API_TOKEN=your-dootask-api-token
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=postgresql://dootask:password@localhost:5432/dootask_ai
REDIS_URL=redis://localhost:6379/0
```

## 🏗️ 开发环境搭建

### 1. 数据库设置

```bash
# 启动 PostgreSQL 和 Redis
docker compose -f docker/docker-compose.dev.yml up -d postgres redis

# 创建数据库和表结构
psql -h localhost -U dootask -d dootask_ai -f scripts/init.sql
```

### 2. 后端服务设置

#### Go 服务初始化
```bash
cd backend/go-service

# 初始化 Go 模块
go mod init dootask-ai/go-service

# 安装依赖
go get github.com/gin-gonic/gin
go get github.com/golang-jwt/jwt/v5
go get github.com/lib/pq
go get github.com/redis/go-redis/v9
go get github.com/gorilla/websocket
```

#### Python AI 服务初始化
```bash
cd backend/python-ai

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install fastapi uvicorn langchain openai redis psycopg2-binary dootask-tools mcp
```

### 3. 前端开发服务器

```bash
# 启动 Next.js 开发服务器
npm run dev
```

## 📝 开发规范

### Git 工作流

```bash
# 功能分支命名规范
feature/智能体管理    # feature/agent-management
feature/知识库系统    # feature/knowledge-base
feature/MCP集成      # feature/mcp-integration
hotfix/修复XXX       # hotfix/fix-xxx
```

### 代码格式化规范

```bash
# 格式化所有代码
npm run format

# 检查代码格式
npm run format:check

# 格式化并修复 ESLint 问题
npm run format:fix

# 配置文件
# .prettierrc      - Prettier 配置
# .prettierignore  - 忽略格式化的文件
```

#### 格式化规则
- **分号**: 使用分号结尾
- **引号**: 使用单引号
- **行宽**: 120 字符 (适合现代宽屏开发环境)
- **缩进**: 2 空格
- **尾随逗号**: ES5 标准
- **Tailwind 排序**: 自动排序 Tailwind 类名

### 提交规范

```bash
git commit -m "feat(frontend): 添加智能体配置页面"
git commit -m "fix(backend): 修复webhook处理错误"
git commit -m "docs: 更新API文档"

# 类型说明
feat:     新功能
fix:      修复bug
docs:     文档更新  
style:    代码格式调整
refactor: 代码重构
test:     添加测试
chore:    其他修改
```

### 代码规范

#### Go 代码规范
```go
// 包注释
// Package handlers 提供HTTP请求处理器
package handlers

// 结构体注释
// WebhookHandler 处理DooTask的webhook请求
type WebhookHandler struct {
    aiService   *AIService   // AI服务客户端
    sseManager  *SSEManager  // SSE连接管理器
    chatService *ChatService // 聊天服务
}

// 方法注释
// HandleMessage 处理接收到的消息并返回AI回复
func (h *WebhookHandler) HandleMessage(c *gin.Context) error {
    // 实现细节...
}
```

#### TypeScript 代码规范
```typescript
// 接口定义
interface Agent {
  id: string
  name: string
  description: string
  prompt: string
  model: string
  temperature: number
  tools: string[]
  knowledgeBases: string[]
  createdAt: Date
  updatedAt: Date
}

// 组件定义 - 使用shadcn/ui组件
interface AgentConfigProps {
  agent: Agent
  onSave: (agent: Agent) => void
  onCancel: () => void
}

export default function AgentConfig({ agent, onSave, onCancel }: AgentConfigProps) {
  // 组件实现...
}
```

## 🔧 核心模块开发

### 1. Go 后端服务开发

#### 项目结构创建
```bash
# 在 backend/go-service 目录下创建结构
mkdir -p {handlers,models,middleware,services,mcp,config,utils}
```

#### 主入口文件
```go
// backend/go-service/main.go
package main

import (
    "log"
    "dootask-ai/go-service/config"
    "dootask-ai/go-service/handlers"
    "dootask-ai/go-service/middleware"
    "github.com/gin-gonic/gin"
)

func main() {
    // 加载配置
    cfg := config.Load()
    
    // 初始化路由
    r := gin.Default()
    
    // 中间件
    r.Use(middleware.CORS())
    r.Use(middleware.Logger())
    
    // 路由组
    api := r.Group("/api")
    {
        auth := api.Group("/auth")
        {
            auth.POST("/login", handlers.Login)
        }
        
        protected := api.Group("/")
        protected.Use(middleware.AuthRequired())
        {
            protected.POST("/webhook/message", handlers.HandleWebhook)
            protected.GET("/sse/chat/:messageId", handlers.HandleSSE)
            protected.GET("/agents", handlers.GetAgents)
            protected.POST("/agents", handlers.CreateAgent)
        }
    }
    
    log.Printf("服务启动在端口: %s", cfg.Port)
    r.Run(":" + cfg.Port)
}
```

#### Webhook 处理器
```go
// backend/go-service/handlers/webhook.go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type WebhookPayload struct {
    ChatID    string `json:"chat_id"`
    UserID    string `json:"user_id"`
    Message   string `json:"message"`
    BotID     string `json:"bot_id"`
    Timestamp int64  `json:"timestamp"`
}

func HandleWebhook(c *gin.Context) {
    var payload WebhookPayload
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // 创建占位消息
    messageID := createPlaceholderMessage(payload.ChatID)
    
    // 异步处理AI请求
    go processAIRequest(payload, messageID)
    
    // 返回SSE连接地址
    c.JSON(http.StatusOK, gin.H{
        "sse_url":    "/api/sse/chat/" + messageID,
        "message_id": messageID,
    })
}
```

### 2. Python AI 服务开发

#### 项目结构创建
```bash
# 在 backend/python-ai 目录下创建结构
mkdir -p {agents,mcp,knowledge,models,services,config,utils}
```

#### 主入口文件
```python
# backend/python-ai/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents.dootask_agent import DooTaskAgent
from services.mcp_client import MCPClient
import uvicorn

app = FastAPI(title="DooTask AI Service")

class MessageRequest(BaseModel):
    message: str
    agent_id: str
    context: dict = {}
    
class MessageResponse(BaseModel):
    response: str
    used_tools: list = []
    
@app.post("/process", response_model=MessageResponse)
async def process_message(request: MessageRequest):
    try:
        # 获取智能体配置
        agent = get_agent_by_id(request.agent_id)
        
        # 处理消息
        response = agent.process_message(request.message, request.context)
        
        return MessageResponse(
            response=response,
            used_tools=agent.get_used_tools()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

#### 智能体实现
```python
# backend/python-ai/agents/dootask_agent.py
from langchain.agents import initialize_agent, AgentType
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool
from dootask_tools import DooTaskClient
import os

class DooTaskAgent:
    def __init__(self, config):
        self.config = config
        self.llm = ChatOpenAI(
            model=config.model,
            temperature=config.temperature,
            openai_api_key=config.openai_api_key
        )
        
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # 初始化 DooTask 客户端
        self.dootask_client = DooTaskClient(
            base_url=os.getenv("DOOTASK_API_URL"),
            token=os.getenv("DOOTASK_API_TOKEN")
        )
        
        # 创建工具集
        self.tools = self._create_dootask_tools()
        
        # 初始化智能体
        self.agent = initialize_agent(
            self.tools,
            self.llm,
            agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
            memory=self.memory,
            verbose=True
        )
    
    def _create_dootask_tools(self):
        """创建 DooTask 工具集"""
        return [
            Tool(
                name="get_chat_messages",
                description="获取聊天记录",
                func=lambda chat_id, limit=50: self.dootask_client.chat.get_messages(chat_id, limit=limit)
            ),
            Tool(
                name="create_project",
                description="创建新项目",
                func=lambda name, description="", owner_id="": self.dootask_client.project.create(
                    name=name, description=description, owner_id=owner_id
                )
            ),
            Tool(
                name="create_task", 
                description="创建新任务",
                func=lambda title, project_id, assignee_id, description="", priority="medium": 
                    self.dootask_client.task.create(
                        title=title,
                        description=description,
                        project_id=project_id,
                        assignee_id=assignee_id,
                        priority=priority
                    )
            ),
            Tool(
                name="search_tasks",
                description="搜索任务",
                func=lambda query, project_id="", status="": self.dootask_client.task.search(
                    query=query, project_id=project_id, status=status
                )
            ),
            Tool(
                name="send_message",
                description="发送消息",
                func=lambda chat_id, content, type="text": self.dootask_client.chat.send_message(
                    chat_id=chat_id, content=content, type=type
                )
            )
        ]
    
    def process_message(self, message: str, context: dict = None) -> str:
        # 增强消息上下文
        if context:
            enhanced_message = f"上下文: {context}\n\n用户消息: {message}"
        else:
            enhanced_message = message
            
        # 调用智能体
        response = self.agent.run(enhanced_message)
        return response
    
    def get_used_tools(self) -> list:
        return [tool.name for tool in self.tools if hasattr(tool, 'was_used') and tool.was_used()]
```

#### MCP 服务器实现
```python
# backend/python-ai/mcp/dootask_mcp_server.py
from mcp import Server
from mcp import types
from dootask_tools import DooTaskClient
import os
import asyncio

class DooTaskMCPServer:
    def __init__(self):
        self.client = DooTaskClient(
            base_url=os.getenv("DOOTASK_API_URL"),
            token=os.getenv("DOOTASK_API_TOKEN")
        )

async def serve_dootask_mcp():
    """启动 DooTask MCP 服务器"""
    server = Server("dootask-internal")
    dootask_server = DooTaskMCPServer()
    
    @server.list_tools()
    async def handle_list_tools() -> list[types.Tool]:
        """注册可用的工具"""
        return [
            types.Tool(
                name="get_chat_messages",
                description="获取指定聊天的消息记录", 
                inputSchema={
                    "type": "object",
                    "properties": {
                        "chat_id": {"type": "string", "description": "聊天ID"},
                        "limit": {"type": "integer", "description": "消息数量限制", "default": 50}
                    },
                    "required": ["chat_id"]
                }
            ),
            types.Tool(
                name="create_task",
                description="创建新任务",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "任务标题"},
                        "project_id": {"type": "string", "description": "所属项目ID"},
                        "assignee_id": {"type": "string", "description": "执行人ID"}
                    },
                    "required": ["title", "project_id", "assignee_id"]
                }
            )
            # 更多工具定义...
        ]
    
    @server.call_tool()
    async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
        """处理工具调用"""
        try:
            if name == "get_chat_messages":
                result = await dootask_server.client.chat.get_messages(**arguments)
                return [types.TextContent(type="text", text=f"聊天记录: {result}")]
            elif name == "create_task":
                result = await dootask_server.client.task.create(**arguments) 
                return [types.TextContent(type="text", text=f"任务创建成功: {result}")]
            else:
                raise ValueError(f"Unknown tool: {name}")
        except Exception as e:
            return [types.TextContent(type="text", text=f"工具调用失败: {str(e)}")]
    
    return server

# 启动脚本
if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        server = await serve_dootask_mcp()
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream)
    
    asyncio.run(main())
```

### 3. 前端组件开发

#### 智能体管理页面
```typescript
// app/agents/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Agent, agentApi } from '@/lib/api'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const data = await agentApi.list()
      setAgents(data)
    } catch (error) {
      console.error('加载智能体失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">加载中...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI 智能体管理</h1>
        <Button onClick={() => router.push('/agents/create')}>
          创建智能体
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="cursor-pointer hover:shadow-lg">
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
              <CardDescription>{agent.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  模型: {agent.model}
                </div>
                <div className="text-sm text-gray-600">
                  工具: {agent.tools.join(', ')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

## 🧪 测试指南

### 单元测试

#### Go 测试
```go
// backend/go-service/handlers/webhook_test.go
package handlers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestHandleWebhook(t *testing.T) {
    gin.SetMode(gin.TestMode)
    r := gin.Default()
    r.POST("/webhook", HandleWebhook)
    
    payload := WebhookPayload{
        ChatID:  "test-chat-123",
        UserID:  "test-user-456", 
        Message: "Hello AI",
        BotID:   "test-bot-789",
    }
    
    jsonPayload, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", "/webhook", bytes.NewBuffer(jsonPayload))
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
    
    var response map[string]string
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Contains(t, response, "sse_url")
    assert.Contains(t, response, "message_id")
}
```

#### Python 测试
```python
# backend/python-ai/tests/test_agent.py
import pytest
from unittest.mock import Mock, patch
from agents.dootask_agent import DooTaskAgent
from config.agent_config import AgentConfig

def test_agent_initialization():
    """测试智能体初始化"""
    with patch('agents.dootask_agent.DooTaskClient') as mock_client:
        config = AgentConfig(
            model="gpt-3.5-turbo",
            temperature=0.7,
            openai_api_key="test-key"
        )
        
        agent = DooTaskAgent(config)
        assert agent.config.model == "gpt-3.5-turbo"
        assert len(agent.tools) == 5  # DooTask 工具数量
        mock_client.assert_called_once()

def test_dootask_tools_creation():
    """测试 DooTask 工具创建"""
    with patch('agents.dootask_agent.DooTaskClient') as mock_client:
        config = AgentConfig(model="gpt-3.5-turbo", temperature=0.7)
        agent = DooTaskAgent(config)
        
        tools = agent._create_dootask_tools()
        tool_names = [tool.name for tool in tools]
        
        expected_tools = [
            "get_chat_messages", "create_project", "create_task", 
            "search_tasks", "send_message"
        ]
        assert all(tool_name in tool_names for tool_name in expected_tools)

@pytest.mark.asyncio
async def test_mcp_server():
    """测试 MCP 服务器"""
    from mcp.dootask_mcp_server import serve_dootask_mcp
    
    with patch('mcp.dootask_mcp_server.DooTaskClient') as mock_client:
        server = await serve_dootask_mcp()
        assert server.name == "dootask-internal"

def test_process_message():
    """测试消息处理"""
    with patch('agents.dootask_agent.DooTaskClient'), \
         patch('agents.dootask_agent.ChatOpenAI') as mock_llm:
        
        # 模拟 LangChain 智能体
        mock_agent = Mock()
        mock_agent.run.return_value = "AI response"
        
        config = AgentConfig(model="gpt-3.5-turbo", temperature=0.7)
        agent = DooTaskAgent(config)
        agent.agent = mock_agent
        
        response = agent.process_message("Hello")
        assert response == "AI response"
        mock_agent.run.assert_called_once()
```

### 集成测试

```bash
# 启动测试环境
docker compose -f docker/docker-compose.test.yml up -d

# 运行集成测试
npm run test:integration
go test ./... -tags=integration
pytest tests/ -m integration
```

## 📖 API 文档

### Webhook API

#### 接收消息
```http
POST /api/webhook/message
Content-Type: application/json
Authorization: Bearer <token>

{
  "chat_id": "chat-123",
  "user_id": "user-456", 
  "message": "Hello AI",
  "bot_id": "bot-789",
  "timestamp": 1703123456
}
```

#### 响应
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "sse_url": "/api/sse/chat/msg-abc123",
  "message_id": "msg-abc123"
}
```

### 智能体管理 API

#### 获取智能体列表
```http
GET /api/agents
Authorization: Bearer <token>
```

#### 创建智能体
```http
POST /api/agents
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "客服助手",
  "description": "专业的客服AI助手",
  "prompt": "你是一个专业的客服代表...",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "tools": ["search", "email"],
  "knowledge_bases": ["kb-1", "kb-2"]
}
```

## 🚀 部署指南

### 开发环境部署

```bash
# 启动所有服务
docker compose -f docker/docker-compose.dev.yml up -d

# 启动 MCP 服务器
cd backend/python-ai
python mcp/dootask_mcp_server.py

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f go-service
docker compose logs -f python-ai
```

### MCP 服务器测试

```bash
# 测试 MCP 服务器连接
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | python mcp/dootask_mcp_server.py

# 测试工具调用
echo '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "get_chat_messages", "arguments": {"chat_id": "test-123"}}, "id": 2}' | python mcp/dootask_mcp_server.py
```

### 生产环境部署

```bash
# 构建镜像
docker compose -f docker/docker-compose.prod.yml build

# 启动生产环境
docker compose -f docker/docker-compose.prod.yml up -d
```

## 🔍 调试指南

### 日志查看
```bash
# Go 服务日志
docker logs -f dootask-ai-go-service

# Python AI 服务日志  
docker logs -f dootask-ai-python-ai

# 前端开发服务器日志
npm run dev
```

### 常见问题解决

1. **数据库连接失败**
   - 检查 PostgreSQL 服务状态
   - 确认数据库配置正确

2. **AI 服务调用失败**
   - 检查 OpenAI API Key 配置
   - 确认网络连接正常

3. **SSE 连接问题**
   - 检查 CORS 配置
   - 确认防火墙设置

这个开发指南为团队提供了完整的开发环境设置、代码规范、核心模块实现和测试部署等指导，确保项目能够高效、规范地进行开发。 