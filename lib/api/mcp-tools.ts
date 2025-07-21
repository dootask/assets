import axiosInstance from '@/lib/axios';
import type { CreateMCPToolRequest, MCPTool, UpdateMCPToolRequest } from '@/lib/types';

// API响应类型定义
interface MCPToolListResponse {
  items: MCPToolResponse[]; // 后端返回的原始格式
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface MCPToolResponse {
  id: number; // 后端BIGSERIAL类型返回number
  name: string;
  description?: string | null;
  category: 'dootask' | 'external' | 'custom';
  type: 'internal' | 'external';
  config: Record<string, unknown>;
  permissions: string[];
  is_active: boolean; // 后端返回的字段名
  created_at: string; // 后端返回的字段名
  updated_at: string; // 后端返回的字段名
  // 统计信息
  total_calls?: number;
  today_calls?: number;
  average_response_time?: number;
  success_rate?: number;
  associated_agents?: number;
}

interface MCPToolQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: 'dootask' | 'external' | 'custom';
  type?: 'internal' | 'external';
  is_active?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

interface MCPToolStatsResponse {
  total: number;
  active: number;
  inactive: number;
  dootask_tools: number;
  external_tools: number;
  custom_tools: number;
  internal_tools: number;
  external_type_tools: number;
  total_calls: number;
  avg_response_time: number;
}

interface TestMCPToolRequest {
  test_data?: Record<string, unknown>;
}

interface TestMCPToolResponse {
  success: boolean;
  message: string;
  response_time: number;
  test_result?: Record<string, unknown>;
}

// 前端表单数据类型
interface MCPToolFormData {
  name: string;
  description?: string;
  category: 'dootask' | 'external' | 'custom';
  type: 'internal' | 'external';
  config?: Record<string, unknown>;
  permissions?: string[];
  isActive?: boolean;
  // 用于前端表单的辅助字段
  apiKey?: string;
  baseUrl?: string;
}

// 数据转换函数：前端格式 → 后端格式
const transformToBackendFormat = (data: MCPToolFormData): CreateMCPToolRequest | UpdateMCPToolRequest => {
  const config: Record<string, unknown> = { ...data.config };

  // 处理外部工具的特殊字段
  if (data.type === 'external' && data.baseUrl) {
    config.baseUrl = data.baseUrl;
  }
  if (data.apiKey) {
    config.apiKey = data.apiKey;
  }

  return {
    name: data.name,
    description: data.description || undefined,
    category: data.category,
    type: data.type,
    config,
    permissions: data.permissions || ['read'],
  };
};

// 数据转换函数：后端格式 → 前端格式
const transformToFrontendFormat = (tool: MCPToolResponse): MCPTool => {
  return {
    id: tool.id.toString(), // 转换为string类型
    name: tool.name,
    description: tool.description || '',
    category: tool.category,
    type: tool.type,
    config: tool.config,
    permissions: tool.permissions,
    isActive: tool.is_active, // 转换字段名
    createdAt: tool.created_at, // 转换字段名
    updatedAt: tool.updated_at, // 转换字段名
    statistics:
      tool.total_calls !== undefined
        ? {
            totalCalls: tool.total_calls,
            todayCalls: tool.today_calls || 0,
            averageResponseTime: tool.average_response_time || 0,
            successRate: tool.success_rate || 1,
          }
        : undefined,
  };
};

// MCP工具管理API
export const mcpToolsApi = {
  // 获取工具列表
  list: async (
    params?: MCPToolQueryParams
  ): Promise<{ items: MCPTool[]; total: number; page: number; page_size: number; total_pages: number }> => {
    const response = await axiosInstance.get<MCPToolListResponse>('/admin/mcp-tools', {
      params,
    });

    return {
      ...response.data,
      items: response.data.items.map(transformToFrontendFormat),
    };
  },

  // 获取工具详情
  get: async (id: string): Promise<MCPTool> => {
    const response = await axiosInstance.get<MCPToolResponse>(`/admin/mcp-tools/${id}`);
    return transformToFrontendFormat(response.data);
  },

  // 创建工具
  create: async (data: MCPToolFormData): Promise<MCPTool> => {
    const backendData = transformToBackendFormat(data);
    const response = await axiosInstance.post<MCPToolResponse>('/admin/mcp-tools', backendData);
    return transformToFrontendFormat(response.data);
  },

  // 更新工具
  update: async (id: string, data: Partial<MCPToolFormData>): Promise<MCPTool> => {
    const backendData = transformToBackendFormat(data as MCPToolFormData);
    const response = await axiosInstance.put<MCPToolResponse>(`/admin/mcp-tools/${id}`, backendData);
    return transformToFrontendFormat(response.data);
  },

  // 删除工具
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/admin/mcp-tools/${id}`);
    return response.data;
  },

  // 切换工具状态
  toggle: async (id: string, isActive: boolean): Promise<MCPTool> => {
    const response = await axiosInstance.patch<MCPToolResponse>(`/admin/mcp-tools/${id}/toggle`, {
      is_active: isActive,
    });
    return transformToFrontendFormat(response.data);
  },

  // 测试工具
  test: async (id: string, testData?: Record<string, unknown>): Promise<TestMCPToolResponse> => {
    const response = await axiosInstance.post<TestMCPToolResponse>(`/admin/mcp-tools/${id}/test`, {
      test_data: testData || {},
    });
    return response.data;
  },

  // 获取统计信息
  getStats: async (): Promise<MCPToolStatsResponse> => {
    const response = await axiosInstance.get<MCPToolStatsResponse>('/admin/mcp-tools/stats');
    return response.data;
  },
};

// 导出类型供其他文件使用
export type { MCPToolFormData, MCPToolQueryParams, MCPToolStatsResponse, TestMCPToolRequest, TestMCPToolResponse };
