# DooTask AI - API 标准规范

## 🎯 概述

本文档专门定义 DooTask AI 项目的 API 设计标准，包括 HTTP 状态码使用、响应格式、错误码规范等，确保前后端 API 交互的一致性。

## 🔗 HTTP 状态码规范

### 标准状态码使用

- **200 OK**: 请求成功，正常响应
- **400 Bad Request**: 请求数据格式错误
- **401 Unauthorized**: 用户认证失败或令牌无效
- **403 Forbidden**: 用户权限不足，禁止访问
- **422 Unprocessable Entity**: 数据验证错误或通用业务逻辑错误

### 响应格式标准

所有API响应都应遵循统一的格式：

```json
{
  "code": "ERROR_CODE",
  "message": "详细描述",
  "data": {}
}
```

#### 成功响应示例

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    "id": "123",
    "name": "智能体名称"
  }
}
```

#### 错误响应示例

```json
{
  "code": "AUTH_001",
  "message": "Invalid username or password",
  "data": {
    "field": "email"
  }
}
```

## 🎨 前端网络请求规范

### Axios 客户端配置

```typescript
// lib/axios.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(config => {
  const token = storage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      handleApiError(error.response);
    }
    return Promise.reject(error);
  }
);
```

### 错误处理策略

```typescript
const handleApiError = (response: { status: number; data: { code: string; message: string; data?: any } }) => {
  const { status, data } = response;

  switch (status) {
    case 401:
      // 认证失败，清除token并跳转登录
      storage.removeItem('authToken');
      window.location.href = '/login';
      break;
    case 403:
      // 权限不足提示
      toast({
        variant: 'destructive',
        title: '权限不足',
        description: translateErrorCode(data.code),
      });
      break;
    case 422:
      // 数据验证错误
      toast({
        variant: 'destructive',
        title: '验证错误',
        description: translateErrorCode(data.code),
      });
      break;
  }
};
```

## 🔧 后端实现规范

### Go 服务错误返回

```go
type APIError struct {
    Code    string      `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

// 认证失败 - 401
c.JSON(http.StatusUnauthorized, APIError{
    Code:    "AUTH_001",
    Message: "Invalid username or password",
    Data:    nil,
})

// 权限不足 - 403
c.JSON(http.StatusForbidden, APIError{
    Code:    "AUTH_003",
    Message: "Insufficient permissions",
    Data:    nil,
})

// 数据验证错误 - 422
c.JSON(http.StatusUnprocessableEntity, APIError{
    Code:    "VALIDATION_001",
    Message: "Invalid input data",
    Data:    map[string]string{"field": "email"},
})
```

### Python 服务错误返回

```python
from fastapi import HTTPException, status

# 认证失败 - 401
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={
        "code": "AUTH_001",
        "message": "Invalid username or password",
        "data": {}
    }
)

# 数据验证错误 - 422
raise HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail={
        "code": "VALIDATION_001",
        "message": "Invalid input data",
        "data": {"field": "email"}
    }
)
```

## 🎨 前端集成规范

### 错误提示集成

前端应使用 shadcn/ui 的 Toast 组件来显示 API 错误信息：

```typescript
import { toast } from '@/components/ui/use-toast';

// 在错误处理中使用
toast({
  variant: 'destructive',
  title: '操作失败',
  description: translateErrorCode(error.code),
});
```

## 🔍 错误码分类

### 认证相关 (AUTH_xxx)

- `AUTH_001`: 用户名或密码错误
- `AUTH_002`: 登录已过期
- `AUTH_003`: 权限不足

### 验证相关 (VALIDATION_xxx)

- `VALIDATION_001`: 输入数据验证失败
- `VALIDATION_002`: 必填字段缺失

### 格式相关 (FORMAT_xxx)

- `FORMAT_001`: 请求数据格式不正确
- `FORMAT_002`: JSON 解析错误

### 业务相关 (BUSINESS_xxx)

- `USER_001`: 用户不存在
- `TASK_001`: 任务创建失败
- `AGENT_001`: 智能体配置错误

## 📊 TypeScript 类型定义

```typescript
// types/api.ts
interface APIResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface APIError {
  code: string;
  message: string;
  data?: Record<string, any>;
}

// 使用示例
const createAgent = async (agentData: CreateAgentRequest): Promise<Agent> => {
  const response = await apiClient.post<APIResponse<Agent>>('/agents', agentData);
  return response.data.data;
};
```

## 🚀 API 设计最佳实践

1. **响应一致性**: 所有API都使用相同的响应格式 `{code, message, data}`
2. **状态码标准**: 严格按照HTTP状态码语义使用 200/400/401/403/422
3. **错误码分类**: 按业务模块分类错误码，便于问题定位和国际化
4. **类型安全**: 使用TypeScript接口定义API请求和响应类型
5. **向后兼容**: API版本变更时保持向后兼容，渐进式升级
6. **文档同步**: API变更时同步更新接口文档和错误码说明

这些标准确保了 API 的可靠性、可维护性和良好的开发体验。
