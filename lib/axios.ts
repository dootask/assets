import axios from 'axios';
import { toast } from 'sonner';
import { storage } from './storage';

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证头等
apiClient.interceptors.request.use(
  config => {
    const token = storage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 错误码翻译函数
const translateErrorCode = (code: string): string => {
  const errorMap: Record<string, string> = {
    AUTH_001: '用户名或密码错误',
    AUTH_002: '登录已过期，请重新登录',
    AUTH_003: '权限不足，无法访问该资源',
    USER_001: '用户不存在',
    AGENT_001: '智能体创建失败',
    AGENT_002: '智能体不存在',
    KNOWLEDGE_001: '知识库创建失败',
    KNOWLEDGE_002: '文档上传失败',
    TOOL_001: 'MCP工具配置失败',
    VALIDATION_001: '输入数据验证失败',
    FORMAT_001: '请求数据格式不正确',
    WEBHOOK_001: 'Webhook配置错误',
    AI_001: 'AI服务暂不可用',
    AI_002: 'AI响应超时',
    // AI模型管理相关错误码
    AI_MODEL_001: '查询AI模型失败',
    AI_MODEL_002: 'AI模型不存在',
    AI_MODEL_003: 'AI模型名称已存在',
    AI_MODEL_004: 'AI模型操作失败',
    AI_MODEL_005: '删除AI模型失败',
    AI_MODEL_006: '该AI模型正在被智能体使用，无法删除',
  };
  return errorMap[code] || '系统错误，请稍后重试';
};

// 统一错误处理函数
const handleApiError = (response: { status: number; data: { code: string; message: string; data?: unknown } }) => {
  const { status, data } = response;
  const userMessage = translateErrorCode(data.code);

  switch (status) {
    case 400:
      // 数据格式错误
      toast.error('请求错误', {
        description: userMessage,
      });
      break;

    case 401:
      // 认证失败，跳转登录
      toast.error('认证失败', {
        description: userMessage,
      });
      // 清除本地token
      storage.removeItem('authToken');
      // 这里可以添加跳转逻辑，但在插件系统中可能不需要独立登录
      break;

    case 403:
      // 权限不足
      toast.error('权限不足', {
        description: userMessage,
      });
      break;

    case 422:
      // 数据验证错误
      toast.error('验证错误', {
        description: userMessage,
      });
      break;

    case 500:
      toast.error('服务器错误', {
        description: '系统内部错误，请稍后重试',
      });
      break;

    default:
      toast.error('操作失败', {
        description: userMessage,
      });
  }
};

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // 服务器返回错误响应
      handleApiError(error.response);
    } else if (error.request) {
      // 网络错误
      toast.error('网络错误', {
        description: '请检查网络连接后重试',
      });
    } else {
      // 其他错误
      toast.error('请求失败', {
        description: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
