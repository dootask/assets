import base64
from functools import cache
import os
from typing import TypeAlias
from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_aws import ChatBedrock
from langchain_community.chat_models import FakeListChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import ChatVertexAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_deepseek import ChatDeepSeek
from langchain_xai import ChatXAI

from schema.models import (
    AllModelEnum,
    AnthropicModelName,
    AWSModelName,
    AzureOpenAIModelName,
    DeepseekModelName,
    FakeModelName,
    GoogleModelName,
    GroqModelName,
    OllamaModelName,
    OpenAICompatibleName,
    OpenAIModelName,
    OpenRouterModelName,
    VertexAIModelName,
    XAIModelName,
)

_MODEL_TABLE = (
    {m: m.value for m in OpenAIModelName}
    | {m: m.value for m in OpenAICompatibleName}
    | {m: m.value for m in AzureOpenAIModelName}
    | {m: m.value for m in DeepseekModelName}
    | {m: m.value for m in AnthropicModelName}
    | {m: m.value for m in GoogleModelName}
    | {m: m.value for m in VertexAIModelName}
    | {m: m.value for m in GroqModelName}
    | {m: m.value for m in AWSModelName}
    | {m: m.value for m in OllamaModelName}
    | {m: m.value for m in OpenRouterModelName}
    | {m: m.value for m in FakeModelName}
    | {m: m.value for m in XAIModelName}
)


class FakeToolModel(FakeListChatModel):
    def __init__(self, responses: list[str]):
        super().__init__(responses=responses)

    def bind_tools(self, tools):
        return self


ModelT: TypeAlias = (
    AzureChatOpenAI
    | ChatOpenAI
    | ChatAnthropic
    | ChatGoogleGenerativeAI
    | ChatVertexAI
    | ChatGroq
    | ChatBedrock
    | ChatOllama
    | FakeToolModel
    | ChatXAI
)


@cache
def get_model(
    model_name: AllModelEnum, config_tuple: Optional[dict] = None, /
) -> ModelT:
    if config_tuple is None:
        config = {}
    config = dict(config_tuple) if config_tuple else {}

    def cfg(key: str, default=None):
        return config.get(key, default)

    # 标准字段映射
    api_key = cfg("api_key")
    base_url = cfg("base_url")
    credentials = cfg("credentials")
    api_version = cfg("api_version")
    proxy_url = cfg("proxy_url")
    temperature = cfg("temperature", 0.7)

    api_model_name = _MODEL_TABLE.get(model_name)
    if not api_model_name:
        raise ValueError(f"Unsupported model: {model_name}")

    if model_name in OpenAIModelName:
        return ChatOpenAI(
            model=api_model_name,
            openai_api_key=api_key,
            temperature=temperature,
            streaming=True,
            openai_proxy=proxy_url,
        )

    if model_name in OpenAICompatibleName:
        if not base_url or not api_model_name:
            raise ValueError(
                "OpenAICompatible requires 'base_url' and 'model' in config"
            )
        return ChatOpenAI(
            model=api_model_name,
            temperature=temperature,
            streaming=True,
            openai_api_base=base_url,
            openai_api_key=api_key,
            openai_proxy=proxy_url,
        )

    if model_name in AzureOpenAIModelName:
        if not api_key or not base_url or not api_model_name:
            raise ValueError(
                "Azure OpenAI requires 'api_key', 'base_url', and 'api_model_name'"
            )
        return AzureChatOpenAI(
            azure_endpoint=base_url,
            deployment_name=api_model_name,
            api_version=api_version or "2024-02-15-preview",
            temperature=temperature,
            streaming=True,
            timeout=60,
            max_retries=3,
            openai_proxy=proxy_url,
        )

    if model_name in DeepseekModelName:
        if not api_key:
            raise ValueError("DeepSeek API requires 'api_key'")
        return ChatDeepSeek(
            model=api_model_name,
            temperature=temperature,
            streaming=True,
            api_key=api_key,
            openai_proxy=proxy_url,
        )

    if model_name in AnthropicModelName:
        if not api_key:
            raise ValueError("Anthropic API requires 'api_key'")
        return ChatAnthropic(
            model=api_model_name,
            temperature=temperature,
            streaming=True,
            anthropic_api_key=api_key,
        )

    if model_name in GoogleModelName:
        if not api_key:
            raise ValueError("Google API requires 'api_key'")
        return ChatGoogleGenerativeAI(
            model=api_model_name,
            temperature=temperature,
            streaming=True,
            google_api_key=api_key,
        )

    if model_name in VertexAIModelName:
        if credentials:
            with open("/tmp/google_credentials.json", "w") as f:
                f.write(base64.decode(credentials))
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/google_credentials.json"
        return ChatVertexAI(
            model=api_model_name, temperature=temperature, streaming=True
        )

    if model_name in GroqModelName:
        temp = 0.0 if model_name == GroqModelName.LLAMA_GUARD_4_12B else 0.5
        return ChatGroq(model=api_model_name, groq_api_key=api_key, temperature=temp)

    if model_name in OllamaModelName:
        if not api_model_name:
            raise ValueError("Ollama requires 'model' in config")
        if base_url:
            return ChatOllama(
                model=api_model_name, temperature=temperature, base_url=base_url
            )
        else:
            return ChatOllama(model=api_model_name, temperature=temperature)

    if model_name in OpenRouterModelName:
        if not api_key:
            raise ValueError("OpenRouter API requires 'api_key'")
        return ChatOpenAI(
            model=api_model_name,
            temperature=temperature,
            streaming=True,
            base_url="https://openrouter.ai/api/v1/",
            api_key=api_key,
            openai_proxy=proxy_url,
        )

    if model_name in XAIModelName:
        return ChatXAI(
            model=api_model_name,
            api_key=api_key,
            openai_proxy=proxy_url,
            temperature=temperature,
        )

    if model_name in FakeModelName:
        return FakeToolModel(responses=["Fake model response"])

    raise ValueError(f"Unsupported model: {model_name}")
