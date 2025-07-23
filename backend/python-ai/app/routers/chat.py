import asyncio
import json
import logging
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain.callbacks.base import BaseCallbackHandler
# LangChain imports
from langchain.schema import (AIMessage, BaseMessage, HumanMessage,
                              SystemMessage)
from langchain.schema.output import LLMResult
from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatOllama
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, field_validator
from sse_starlette.sse import EventSourceResponse

# 设置日志
logger = logging.getLogger(__name__)


class RetrievalConfig(BaseModel):
    """检索配置"""
    enabled: bool = Field(default=False, description="是否启用检索")
    knowledge_base_ids: List[str] = Field(default_factory=list, description="知识库ID列表")
    top_k: int = Field(default=5, ge=1, le=20, description="检索返回的文档数量")
    score_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="相似度阈值")
    rerank: bool = Field(default=False, description="是否重新排序")


class MCPToolConfig(BaseModel):
    """单个MCP工具配置"""
    name: str = Field(..., description="工具名称")
    enabled: bool = Field(default=True, description="是否启用")
    config: Dict[str, Any] = Field(default_factory=dict, description="工具特定配置")


class MCPConfig(BaseModel):
    """MCP工具配置"""
    enabled: bool = Field(default=False, description="是否启用MCP工具")
    tools: List[MCPToolConfig] = Field(default_factory=list, description="工具配置列表")
    tool_choice: str = Field(default="auto", description="工具选择策略: auto, none, required")
    max_tool_calls: int = Field(default=5, ge=1, le=10, description="最大工具调用次数")


class ModelConfig(BaseModel):
    """模型配置"""
    provider: str = Field(..., description="AI提供商: openai, anthropic, ollama")
    model: str = Field(..., description="模型名称")
    api_key: Optional[str] = Field(default=None, description="API密钥")
    base_url: Optional[str] = Field(default=None, description="自定义API地址")
    
    @field_validator('provider', mode='before')
    @classmethod
    def validate_provider(cls, v):
        allowed_providers = ['openai', 'anthropic', 'ollama']
        if v.lower() not in allowed_providers:
            raise ValueError(f'Provider must be one of: {allowed_providers}')
        return v.lower()


class GenerationConfig(BaseModel):
    """生成配置"""
    max_tokens: int = Field(default=4000, ge=1, le=32000, description="最大生成token数")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="核采样参数")
    frequency_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0, description="频率惩罚")
    presence_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0, description="存在惩罚")


class ChatRequest(BaseModel):
    """聊天请求模型"""
    # 基础对话参数
    prompt: str = Field(default="", description="用户输入（单轮对话）")
    messages: List[Dict[str, str]] = Field(default_factory=list, description="对话历史（多轮对话）")
    
    # 模型配置
    model: ModelConfig = Field(..., description="模型配置")
    
    # 生成参数
    generation_config: GenerationConfig = Field(default_factory=GenerationConfig, description="生成配置")
    
    # 系统配置
    system_message: Optional[str] = Field(default=None, description="系统提示词")
    stream: bool = Field(default=False, description="是否流式响应")
    
    # 知识库配置
    retrieval_config: Optional[RetrievalConfig] = Field(default=None, description="检索配置")
    
    # MCP配置
    mcp_config: Optional[MCPConfig] = Field(default=None, description="MCP工具配置")
    
    # 其他配置
    conversation_id: Optional[str] = Field(default=None, description="对话ID")
    user_id: Optional[str] = Field(default=None, description="用户ID")

    @field_validator('messages', mode='before')
    @classmethod
    def validate_messages(cls, v):
        """验证消息格式"""
        for msg in v:
            if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
                raise ValueError('Messages must contain role and content fields')
            if msg['role'] not in ['user', 'assistant', 'system']:
                raise ValueError('Message role must be user, assistant, or system')
        return v


class ChatResponse(BaseModel):
    """聊天响应模型"""
    message: str = Field(..., description="AI回复内容")
    model: str = Field(..., description="使用的模型")
    provider: str = Field(..., description="AI提供商")
    usage: Optional[Dict[str, int]] = Field(default=None, description="Token使用统计")
    retrieval_docs: Optional[List[Dict[str, Any]]] = Field(default=None, description="检索到的文档")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(default=None, description="工具调用记录")
    conversation_id: Optional[str] = Field(default=None, description="对话ID")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间")


class StreamingCallbackHandler(BaseCallbackHandler):
    """流式响应回调处理器"""
    
    def __init__(self):
        self.tokens = []
        
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """处理新生成的token"""
        self.tokens.append(token)


class ChatService:
    """聊天服务类"""
    
    def __init__(self):
        self.supported_providers = {
            'openai': self._create_openai_model,
            'anthropic': self._create_anthropic_model,
            'ollama': self._create_ollama_model
        }
    
    def _create_openai_model(self, model_config: ModelConfig, generation_config: GenerationConfig):
        """创建OpenAI模型"""
        kwargs = {
            'model': model_config.model,
            'max_tokens': generation_config.max_tokens,
            'temperature': generation_config.temperature,
        }
        
        if model_config.api_key:
            kwargs['openai_api_key'] = model_config.api_key
        if model_config.base_url:
            kwargs['openai_api_base'] = model_config.base_url
        if generation_config.top_p:
            kwargs['top_p'] = generation_config.top_p
            
        return ChatOpenAI(**kwargs)
    
    def _create_anthropic_model(self, model_config: ModelConfig, generation_config: GenerationConfig):
        """创建Anthropic模型"""
        kwargs = {
            'model': model_config.model,
            'max_tokens': generation_config.max_tokens,
            'temperature': generation_config.temperature,
        }
        
        if model_config.api_key:
            kwargs['anthropic_api_key'] = model_config.api_key
        if model_config.base_url:
            kwargs['anthropic_api_url'] = model_config.base_url
            
        return ChatAnthropic(**kwargs)
    
    def _create_ollama_model(self, model_config: ModelConfig, generation_config: GenerationConfig):
        """创建Ollama模型"""
        kwargs = {
            'model': model_config.model,
            'temperature': generation_config.temperature,
        }
        
        if model_config.base_url:
            kwargs['base_url'] = model_config.base_url
        else:
            kwargs['base_url'] = 'http://localhost:11434'
            
        return ChatOllama(**kwargs)
    
    def _prepare_messages(self, request: ChatRequest) -> List[BaseMessage]:
        """准备消息列表"""
        messages = []
        
        # 添加系统消息
        if request.system_message:
            messages.append(SystemMessage(content=request.system_message))
        
        # 转换历史消息
        for msg in request.messages:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                messages.append(AIMessage(content=msg['content']))
            elif msg['role'] == 'system':
                messages.append(SystemMessage(content=msg['content']))
        
        # 添加当前用户输入
        if request.prompt:
            messages.append(HumanMessage(content=request.prompt))
        
        return messages
    
    async def _retrieve_knowledge(self, request: ChatRequest, query: str) -> List[Dict[str, Any]]:
        """检索知识库（模拟实现）"""
        if not request.retrieval_config or not request.retrieval_config.enabled:
            return []
        
        logger.info(f"检索知识库: {request.retrieval_config.knowledge_base_ids}")
        
        # 这里应该实际实现知识库检索逻辑
        # 目前返回模拟数据
        mock_docs = [
            {
                "content": f"模拟检索到的文档内容，相关查询: {query}",
                "source": "knowledge_base_1",
                "score": 0.85,
                "metadata": {"title": "示例文档", "type": "text"}
            }
        ]
        
        return mock_docs[:request.retrieval_config.top_k]
    
    async def _execute_mcp_tools(self, request: ChatRequest, message: str) -> List[Dict[str, Any]]:
        """执行MCP工具（模拟实现）"""
        if not request.mcp_config or not request.mcp_config.enabled:
            return []
        
        logger.info(f"执行MCP工具: {[tool.name for tool in request.mcp_config.tools if tool.enabled]}")
        
        # 这里应该实际实现MCP工具调用逻辑
        # 目前返回模拟数据
        tool_results = []
        for tool in request.mcp_config.tools:
            if tool.enabled:
                tool_results.append({
                    "tool_name": tool.name,
                    "result": f"模拟工具 {tool.name} 的执行结果",
                    "success": True
                })
        
        return tool_results
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """非流式聊天"""
        try:
            # 创建模型
            model_creator = self.supported_providers.get(request.model.provider)
            if not model_creator:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "code": "MODEL_001",
                        "message": f"Unsupported provider: {request.model.provider}",
                        "data": {"provider": request.model.provider}
                    }
                )
            
            llm_model = model_creator(request.model, request.generation_config)
            
            # 准备消息
            messages = self._prepare_messages(request)
            
            # 执行知识库检索
            retrieval_docs = await self._retrieve_knowledge(
                request, 
                request.prompt or (messages[-1].content if messages else "")
            )
            
            # 如果有检索结果，添加到上下文
            if retrieval_docs:
                context = "\n".join([doc["content"] for doc in retrieval_docs])
                if messages:
                    # 修改最后一个用户消息，添加检索上下文
                    last_message = messages[-1]
                    if isinstance(last_message, HumanMessage):
                        enhanced_content = f"基于以下上下文回答问题：\n\n{context}\n\n用户问题：{last_message.content}"
                        messages[-1] = HumanMessage(content=enhanced_content)
            
            # 调用模型
            response = await llm_model.ainvoke(messages)
            
            # 执行MCP工具
            tool_calls = await self._execute_mcp_tools(request, response.content)
            
            return ChatResponse(
                message=response.content,
                model=request.model.model,
                provider=request.model.provider,
                retrieval_docs=retrieval_docs if retrieval_docs else None,
                tool_calls=tool_calls if tool_calls else None,
                conversation_id=request.conversation_id
            )
            
        except Exception as e:
            logger.error(f"聊天处理错误: {str(e)}")
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "CHAT_001",
                    "message": f"Chat processing failed: {str(e)}",
                    "data": {}
                }
            )
    
    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """流式聊天"""
        try:
            # 创建模型
            model_creator = self.supported_providers.get(request.model.provider)
            if not model_creator:
                yield {
                    "event": "error",
                    "data": json.dumps({'error': 'Unsupported provider'})
                }
                return
            
            llm_model = model_creator(request.model, request.generation_config)
            
            # 创建流式回调
            callback = StreamingCallbackHandler()
            llm_model.callbacks = [callback]
            
            # 准备消息
            messages = self._prepare_messages(request)
            
            # 发送开始信号
            yield {
                "event": "start", 
                "data": json.dumps({'message': 'Stream started'})
            }
            
            # 执行知识库检索
            retrieval_docs = await self._retrieve_knowledge(
                request, 
                request.prompt or (messages[-1].content if messages else "")
            )
            
            if retrieval_docs:
                yield {
                    "event": "retrieval",
                    "data": json.dumps({'docs': retrieval_docs})
                }
                
                # 添加检索上下文
                context = "\n".join([doc["content"] for doc in retrieval_docs])
                if messages:
                    last_message = messages[-1]
                    if isinstance(last_message, HumanMessage):
                        enhanced_content = f"基于以下上下文回答问题：\n\n{context}\n\n用户问题：{last_message.content}"
                        messages[-1] = HumanMessage(content=enhanced_content)
            
            # 流式调用模型
            response = ""
            async for chunk in llm_model.astream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    response += chunk.content
                    yield {
                        "event": "token",
                        "data": json.dumps({'content': chunk.content})
                    }
            
            # 执行MCP工具
            tool_calls = await self._execute_mcp_tools(request, response)
            if tool_calls:
                yield {
                    "event": "tools",
                    "data": json.dumps({'tool_calls': tool_calls})
                }
            
            # 发送结束信号
            yield {
                "event": "end",
                "data": json.dumps({'message': 'Stream completed'})
            }
            
        except Exception as e:
            logger.error(f"流式聊天错误: {str(e)}")
            yield {
                "event": "error",
                "data": json.dumps({'error': str(e)})
            }


# 创建服务实例
chat_service = ChatService()

# 创建路由
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """AI聊天接口（非流式）"""
    logger.info(f"收到聊天请求 - Provider: {request.model.provider}, Model: {request.model.model}")
    
    if request.stream:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "FORMAT_001",
                "message": "Use /chat/stream endpoint for streaming responses",
                "data": {}
            }
        )
    
    return await chat_service.chat(request)


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """AI聊天接口（流式）"""
    logger.info(f"收到流式聊天请求 - Provider: {request.model.provider}, Model: {request.model.model}")
    
    if not request.stream:
        request.stream = True  # 强制启用流式
    
    return EventSourceResponse(
        chat_service.stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # 禁用Nginx缓冲
        }
    )


@router.get("/chat/models")
async def get_supported_models():
    """获取支持的模型列表"""
    models = {
        "openai": {
            "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"],
            "description": "OpenAI官方模型"
        },
        "anthropic": {
            "models": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
            "description": "Anthropic Claude模型"
        },
        "ollama": {
            "models": ["llama2", "llama3", "qwen", "deepseek-coder"],
            "description": "本地Ollama模型"
        }
    }
    
    return {
        "supported_providers": list(models.keys()),
        "models": models,
        "timestamp": datetime.now()
    }
    