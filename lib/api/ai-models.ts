import { getProviderInfo } from '@/lib/ai';
import apiClient from '@/lib/axios';
import {
  AIModelConfig,
  AIModelFilters,
  AIModelListData,
  AIModelResponse,
  CreateAIModelRequest,
  PaginationRequest,
  PaginationResponse,
  UpdateAIModelRequest,
} from '@/lib/types';

// AI模型API服务
export const aiModelsApi = {
  // 获取AI模型列表
  getAIModels: async (
    params: Partial<PaginationRequest> & { filters?: AIModelFilters } = { page: 1, page_size: 12 }
  ): Promise<PaginationResponse<AIModelListData>> => {
    const defaultParams: PaginationRequest = {
      page: 1,
      page_size: 12,
      sorts: [{ key: 'created_at', desc: true }],
      filters: params.filters || {},
    };

    const requestParams = { ...defaultParams, ...params };
    const response = await apiClient.get<PaginationResponse<AIModelListData>>('/ai-models', {
      params: requestParams,
    });
    return response.data;
  },

  // 获取单个AI模型详情
  getAIModel: async (id: number): Promise<AIModelConfig> => {
    const response = await apiClient.get<AIModelResponse>(`/ai-models/${id}`);
    return response.data.data;
  },

  // 创建AI模型
  createAIModel: async (data: CreateAIModelRequest): Promise<AIModelConfig> => {
    const response = await apiClient.post<AIModelResponse>('/ai-models', data);
    return response.data.data;
  },

  // 更新AI模型
  updateAIModel: async (id: number, data: UpdateAIModelRequest): Promise<AIModelConfig> => {
    const response = await apiClient.put<AIModelResponse>(`/ai-models/${id}`, data);
    return response.data.data;
  },

  // 删除AI模型
  deleteAIModel: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ success: boolean; data: { message: string } }>(`/ai-models/${id}`);
    return response.data.data;
  },
};

// 创建分页请求参数的辅助函数
export const createAIModelListRequest = (
  page = 1,
  pageSize = 12,
  filters: Record<string, unknown> = {},
  sorts: { key: string; desc: boolean }[] = []
): PaginationRequest => {
  return {
    page,
    page_size: pageSize,
    sorts: sorts.length > 0 ? sorts : [{ key: 'created_at', desc: true }],
    filters,
  };
};

export default aiModelsApi;

export const getModelDisplayName = (model: AIModelConfig): string => {
  if (model.displayName) return model.displayName;

  // 根据provider和model_name生成显示名称
  const providerInfo = getProviderInfo(model.provider);
  return `${model.name} (${providerInfo.name})`;
};
