#!/usr/bin/env python3
"""
AI聊天接口使用示例

演示如何使用基于LangChain的AI聊天接口，包括：
1. 基础聊天
2. 多轮对话
3. 知识库检索增强生成（RAG）
4. MCP工具调用
5. 流式响应

运行前请确保：
1. 已安装所有依赖：pip install -r requirements.txt
2. 配置了相应的API密钥
3. 启动了AI服务：python -m app.main
"""

import asyncio
import json
import os
from typing import Any, Dict

import httpx

# 服务基础URL
BASE_URL = "http://localhost:8001"  # 根据实际端口调整

# api_key
API_KEY = os.getenv("OPENAI_API_KEY", "")


class ChatClient:
    """聊天客户端"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def chat(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """发送聊天请求"""
        response = await self.client.post(
            f"{self.base_url}/chat",
            json=request_data
        )
        response.raise_for_status()
        return response.json()
    
    async def stream_chat(self, request_data: Dict[str, Any]):
        """发送流式聊天请求"""
        async with self.client.stream(
            "POST",
            f"{self.base_url}/chat/stream",
            json=request_data
        ) as response:
            response.raise_for_status()
            
            event_type = None
            
            async for line in response.aiter_lines():
                line = line.strip()
                
                if line.startswith("event: "):
                    event_type = line[7:]  # 移除 "event: " 前缀
                elif line.startswith("data: "):
                    data = line[6:]  # 移除 "data: " 前缀
                    if data.strip():  # 确保不是空行
                        try:
                            parsed_data = json.loads(data)
                            # 将event类型添加到数据中以保持兼容性
                            if event_type:
                                parsed_data['type'] = event_type
                            yield parsed_data
                            event_type = None  # 重置事件类型
                        except json.JSONDecodeError as e:
                            print(f"⚠️  JSON解析错误: {line} -> {data} - {e}")
                            continue
                elif line == "":
                    # 空行表示事件结束，重置状态
                    event_type = None
    
    async def get_models(self) -> Dict[str, Any]:
        """获取支持的模型列表"""
        response = await self.client.get(f"{self.base_url}/chat/models")
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """关闭客户端"""
        await self.client.aclose()


async def example_basic_chat():
    """示例1: 基础聊天"""
    print("=== 示例1: 基础聊天 ===")
    
    client = ChatClient()
    
    # 构建请求
    request = {
        "prompt": "请解释什么是人工智能？",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "generation_config": {
            "max_tokens": 1000,
            "temperature": 0.7
        },
        "system_message": "你是一个专业的AI助手，请用简洁明了的语言回答问题。"
    }
    
    try:
        response = await client.chat(request)
        print(f"AI回复: {response['message']}")
        print(f"使用模型: {response['provider']}/{response['model']}")
        print(f"响应时间: {response['timestamp']}")
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_multi_turn_conversation():
    """示例2: 多轮对话"""
    print("\n\n=== 示例2: 多轮对话 ===")
    
    client = ChatClient()
    
    # 对话历史
    conversation_history = [
        {"role": "user", "content": "我想学习Python编程"},
        {"role": "assistant", "content": "很好！Python是一门非常适合初学者的编程语言。你想从哪个方面开始学习呢？"},
        {"role": "user", "content": "我想先学习基础语法"}
    ]
    
    request = {
        "messages": conversation_history,
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "conversation_id": "conv_001"
    }
    
    try:
        response = await client.chat(request)
        print(f"AI回复: {response['message']}")
        print(f"对话ID: {response['conversation_id']}")
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_rag_chat():
    """示例3: 知识库检索增强生成（RAG）"""
    print("\n\n=== 示例3: 知识库检索增强生成（RAG） ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "DooTask项目的主要功能有哪些？",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "retrieval_config": {
            "enabled": True,
            "knowledge_base_ids": ["kb_dootask_docs", "kb_project_info"],
            "top_k": 3,
            "score_threshold": 0.7,
            "rerank": True
        }
    }
    
    try:
        response = await client.chat(request)
        print(f"AI回复: {response['message']}")
        
        if response.get('retrieval_docs'):
            print("\n检索到的相关文档:")
            for i, doc in enumerate(response['retrieval_docs'], 1):
                print(f"{i}. 来源: {doc['source']}")
                print(f"   内容: {doc['content'][:100]}...")
                print(f"   相似度: {doc['score']}")
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_mcp_tools():
    """示例4: MCP工具调用"""
    print("\n\n=== 示例4: MCP工具调用 ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "请帮我查询今天的天气，并创建一个提醒任务",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "mcp_config": {
            "enabled": True,
            "tools": [
                {
                    "name": "weather_tool",
                    "enabled": True,
                    "config": {"api_key": "weather-api-key"}
                },
                {
                    "name": "task_manager",
                    "enabled": True,
                    "config": {"workspace_id": "ws_123"}
                }
            ],
            "tool_choice": "auto",
            "max_tool_calls": 3
        }
    }
    
    try:
        response = await client.chat(request)
        print(f"AI回复: {response['message']}")
        
        if response.get('tool_calls'):
            print("\n工具调用记录:")
            for tool_call in response['tool_calls']:
                print(f"- 工具: {tool_call['tool_name']}")
                print(f"  结果: {tool_call['result']}")
                print(f"  状态: {'成功' if tool_call['success'] else '失败'}")
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_streaming_chat():
    """示例5: 流式响应"""
    print("\n\n=== 示例5: 流式响应 ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "请详细介绍一下机器学习的发展历程",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "stream": True,
        "generation_config": {
            "max_tokens": 2000,
            "temperature": 0.8
        }
    }
    
    try:
        print("AI正在思考并回复...")
        response_content = ""
        
        async for chunk in client.stream_chat(request):
            chunk_type = chunk.get('type')
            
            if chunk_type == 'start':
                print("开始生成回复...")
                print(f"消息: {chunk.get('message', '')}")
            elif chunk_type == 'token':
                content = chunk.get('content', '')
                response_content += content
                print(content, end='', flush=True)
            elif chunk_type == 'retrieval':
                docs = chunk.get('docs', [])
                print(f"\n[检索到 {len(docs)} 个相关文档]")
            elif chunk_type == 'tools':
                tool_calls = chunk.get('tool_calls', [])
                print(f"\n[调用了 {len(tool_calls)} 个工具]")
            elif chunk_type == 'end':
                print(f"\n\n回复完成! {chunk.get('message', '')}")
            elif chunk_type == 'error':
                print(f"\n错误: {chunk.get('error')}")
                break
        
        print(f"\n完整回复长度: {len(response_content)} 字符")
        
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_streaming_with_rag_and_tools():
    """示例6: 流式响应 + 知识库检索 + 工具调用"""
    print("\n\n=== 示例6: 流式响应 + 知识库检索 + 工具调用 ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "请根据DooTask项目文档，帮我查询当前天气，并创建一个关于项目部署的任务提醒",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "stream": True,
        "generation_config": {
            "max_tokens": 2000,
            "temperature": 0.7
        },
        "system_message": "你是DooTask项目的AI助手，能够访问项目文档、查询天气和管理任务。",
        "retrieval_config": {
            "enabled": True,
            "knowledge_base_ids": ["kb_dootask_docs", "kb_deployment_guide"],
            "top_k": 3,
            "score_threshold": 0.7,
            "rerank": True
        },
        "mcp_config": {
            "enabled": True,
            "tools": [
                {
                    "name": "weather_tool",
                    "enabled": True,
                    "config": {
                        "api_key": "weather-api-key",
                        "default_location": "Beijing"
                    }
                },
                {
                    "name": "task_manager",
                    "enabled": True,
                    "config": {
                        "workspace_id": "ws_dootask",
                        "default_assignee": "admin"
                    }
                }
            ],
            "tool_choice": "auto",
            "max_tool_calls": 5
        }
    }
    
    try:
        print("🚀 开始处理复合请求（检索+工具+流式生成）...")
        response_content = ""
        retrieved_docs = []
        tool_results = []
        
        async for chunk in client.stream_chat(request):
            chunk_type = chunk.get('type')
            
            if chunk_type == 'start':
                print("✅ 连接建立，开始处理...")
                
            elif chunk_type == 'retrieval':
                docs = chunk.get('docs', [])
                retrieved_docs.extend(docs)
                print(f"\n📚 知识库检索完成:")
                print(f"   - 检索到 {len(docs)} 个相关文档")
                for i, doc in enumerate(docs, 1):
                    print(f"   {i}. 来源: {doc.get('source', 'unknown')}")
                    print(f"      内容预览: {doc.get('content', '')[:80]}...")
                    print(f"      相似度: {doc.get('score', 0):.3f}")
                print("")
                
            elif chunk_type == 'token':
                content = chunk.get('content', '')
                response_content += content
                print(content, end='', flush=True)
                
            elif chunk_type == 'tools':
                tool_calls = chunk.get('tool_calls', [])
                tool_results.extend(tool_calls)
                print(f"\n\n🔧 工具调用完成:")
                for tool_call in tool_calls:
                    tool_name = tool_call.get('tool_name', 'unknown')
                    success = tool_call.get('success', False)
                    result = tool_call.get('result', '')
                    
                    status_icon = "✅" if success else "❌"
                    print(f"   {status_icon} {tool_name}:")
                    print(f"      结果: {result}")
                print("")
                
            elif chunk_type == 'end':
                print(f"\n\n🎉 处理完成! {chunk.get('message', '')}")
                
            elif chunk_type == 'error':
                print(f"\n❌ 错误: {chunk.get('error')}")
                break
        
        # 显示总结信息
        print("\n" + "="*60)
        print("📊 处理总结:")
        print(f"   💬 生成内容长度: {len(response_content)} 字符")
        print(f"   📚 检索文档数量: {len(retrieved_docs)} 个")
        print(f"   🔧 工具调用次数: {len(tool_results)} 次")
        
        if retrieved_docs:
            print(f"\n📋 检索文档详情:")
            for i, doc in enumerate(retrieved_docs, 1):
                print(f"   {i}. {doc.get('source', 'unknown')} (相似度: {doc.get('score', 0):.3f})")
        
        if tool_results:
            print(f"\n🛠️  工具调用详情:")
            for i, tool in enumerate(tool_results, 1):
                status = "成功" if tool.get('success', False) else "失败"
                print(f"   {i}. {tool.get('tool_name', 'unknown')} - {status}")
        
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_streaming_knowledge_only():
    """示例7: 纯知识库检索流式响应"""
    print("\n\n=== 示例7: 纯知识库检索流式响应 ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "DooTask项目的架构设计是怎样的？请详细说明各个组件的作用。",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "api_key": API_KEY
        },
        "stream": True,
        "generation_config": {
            "max_tokens": 1500,
            "temperature": 0.5
        },
        "system_message": "你是一个技术文档分析专家，请基于提供的文档内容进行详细分析。",
        "retrieval_config": {
            "enabled": True,
            "knowledge_base_ids": ["kb_dootask_architecture", "kb_component_docs", "kb_api_docs"],
            "top_k": 5,
            "score_threshold": 0.6,
            "rerank": True
        }
    }
    
    try:
        print("📖 开始基于知识库的流式问答...")
        response_content = ""
        
        async for chunk in client.stream_chat(request):
            chunk_type = chunk.get('type')
            
            if chunk_type == 'start':
                print("🔍 开始检索相关文档...")
                
            elif chunk_type == 'retrieval':
                docs = chunk.get('docs', [])
                print(f"📚 找到 {len(docs)} 个相关文档，正在分析...")
                for doc in docs:
                    source = doc.get('source', 'unknown')
                    score = doc.get('score', 0)
                    print(f"   - {source} (匹配度: {score:.1%})")
                print("🤖 AI正在基于文档生成回答...\n")
                
            elif chunk_type == 'token':
                content = chunk.get('content', '')
                response_content += content
                print(content, end='', flush=True)
                
            elif chunk_type == 'end':
                print(f"\n\n✅ 基于知识库的回答完成!")
                
            elif chunk_type == 'error':
                print(f"\n❌ 错误: {chunk.get('error')}")
                break
        
        print(f"\n📈 生成了 {len(response_content)} 字符的详细回答")
        
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_streaming_tools_only():
    """示例8: 纯工具调用流式响应"""
    print("\n\n=== 示例8: 纯工具调用流式响应 ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "请帮我查询北京的天气，然后创建3个不同优先级的任务提醒",
        "model": {
            "provider": "openai",
            "model": "gpt-3.5-turbo", 
            "api_key": API_KEY
        },
        "stream": True,
        "generation_config": {
            "max_tokens": 1000,
            "temperature": 0.3
        },
        "system_message": "你是一个高效的任务助手，能够查询天气和管理任务。",
        "mcp_config": {
            "enabled": True,
            "tools": [
                {
                    "name": "weather_tool",
                    "enabled": True,
                    "config": {
                        "api_key": "weather-api-key",
                        "units": "metric"
                    }
                },
                {
                    "name": "task_manager",
                    "enabled": True,
                    "config": {
                        "workspace_id": "ws_personal",
                        "default_due_hours": 24
                    }
                },
                {
                    "name": "calendar_tool", 
                    "enabled": True,
                    "config": {
                        "calendar_id": "primary"
                    }
                }
            ],
            "tool_choice": "required",  # 强制使用工具
            "max_tool_calls": 8
        }
    }
    
    try:
        print("🔧 开始多工具协作流式处理...")
        response_content = ""
        tool_call_count = 0
        
        async for chunk in client.stream_chat(request):
            chunk_type = chunk.get('type')
            
            if chunk_type == 'start':
                print("🚀 开始工具调用序列...")
                
            elif chunk_type == 'tools':
                tool_calls = chunk.get('tool_calls', [])
                tool_call_count += len(tool_calls)
                print(f"\n🔧 执行了 {len(tool_calls)} 个工具调用:")
                
                for i, tool_call in enumerate(tool_calls, 1):
                    tool_name = tool_call.get('tool_name', 'unknown')
                    success = tool_call.get('success', False)
                    result = tool_call.get('result', '')
                    
                    status = "✅ 成功" if success else "❌ 失败"
                    print(f"   {i}. [{tool_name}] {status}")
                    print(f"      📄 结果: {result}")
                
                print("\n🤖 AI正在整合工具结果...")
                
            elif chunk_type == 'token':
                content = chunk.get('content', '')
                response_content += content
                print(content, end='', flush=True)
                
            elif chunk_type == 'end':
                print(f"\n\n🎯 工具调用流程完成!")
                
            elif chunk_type == 'error':
                print(f"\n❌ 错误: {chunk.get('error')}")
                break
        
        print(f"\n📊 总计调用了 {tool_call_count} 次工具，生成 {len(response_content)} 字符回答")
        
    except Exception as e:
        print(f"错误: {e}")
    
    await client.close()


async def example_ollama_local_model():
    """示例9: 使用本地Ollama模型"""
    print("\n\n=== 示例9: 使用本地Ollama模型 ===")
    
    client = ChatClient()
    
    request = {
        "prompt": "写一个Python函数来计算斐波那契数列",
        "model": {
            "provider": "ollama",
            "model": "llama3",
            "base_url": "http://localhost:11434"  # Ollama默认地址
        },
        "generation_config": {
            "temperature": 0.3
        },
        "system_message": "你是一个专业的编程助手，请提供清晰的代码示例。"
    }
    
    try:
        response = await client.chat(request)
        print(f"AI回复: {response['message']}")
        print(f"使用本地模型: {response['model']}")
    except Exception as e:
        print(f"错误: {e}")
        print("请确保Ollama服务正在运行，并且已下载了相应的模型")
    
    await client.close()

async def main():
    """运行所有示例"""
    print("🤖 DooTask AI聊天接口使用示例")
    print("=" * 50)
    
    # 基础功能示例
    await example_basic_chat()
    await example_multi_turn_conversation()
    
    # 高级功能示例  
    await example_rag_chat()
    await example_mcp_tools()
    
    # 流式响应示例
    await example_streaming_chat()
    await example_streaming_with_rag_and_tools()
    await example_streaming_knowledge_only()
    await example_streaming_tools_only()
    
    # 本地模型示例
    await example_ollama_local_model()
    
    print("\n✅ 所有示例运行完成!")


async def run_specific_examples():
    """运行特定示例"""
    examples = {
        "1": ("基础聊天", example_basic_chat),
        "2": ("多轮对话", example_multi_turn_conversation),
        "3": ("知识库检索(RAG)", example_rag_chat),
        "4": ("MCP工具调用", example_mcp_tools),
        "5": ("基础流式响应", example_streaming_chat),
        "6": ("流式响应+RAG+工具", example_streaming_with_rag_and_tools),
        "7": ("纯知识库流式响应", example_streaming_knowledge_only),
        "8": ("纯工具流式响应", example_streaming_tools_only),
        "9": ("本地Ollama模型", example_ollama_local_model),
    }
    
    print("🤖 DooTask AI聊天接口使用示例")
    
    while True:
        print("\n" + "=" * 50)
        print("请选择要运行的示例:")

        for key, (name, _) in examples.items():
            print(f"  {key}. {name}")
    
        print("  0. 运行所有示例")
        print("  q. 退出")
        choice = input("\n请输入选项 (0-9 或 q): ").strip()
        
        if choice.lower() == 'q':
            print("👋 再见!")
            break
        elif choice == '0':
            await main()
            break
        elif choice in examples:
            name, func = examples[choice]
            print(f"\n🚀 运行示例: {name}")
            print("-" * 40)
            try:
                await func()
                print(f"\n✅ 示例 '{name}' 运行完成!")
            except Exception as e:
                print(f"\n❌ 示例运行出错: {e}")
        else:
            print("❌ 无效选项，请重新输入")


if __name__ == "__main__":
    import sys

    if not API_KEY:
        print("❌ 请设置 OPENAI_API_KEY 环境变量")
        exit(1)

    # 如果有命令行参数 --all，运行所有示例
    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        asyncio.run(main())
    else:
        # 否则运行交互式选择
        asyncio.run(run_specific_examples()) 