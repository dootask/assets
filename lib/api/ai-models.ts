import { getProviderInfo } from '@/lib/ai';
import apiClient from '@/lib/axios';
import {
  AIModelConfig,
  AIModelListResponse,
  AIModelResponse,
  CreateAIModelRequest,
  UpdateAIModelRequest,
} from '@/lib/types';

export interface GetAIModelsParams {
  page?: number;
  size?: number;
  provider?: string;
  enabled?: boolean;
}

// AI模型API服务
export const aiModelsApi = {
  // 获取AI模型列表
  getAIModels: async (params: GetAIModelsParams = {}): Promise<AIModelListResponse['data']> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.provider) searchParams.append('provider', params.provider);
    if (params.enabled !== undefined) searchParams.append('enabled', params.enabled.toString());

    const response = await apiClient.get<AIModelListResponse>(`/admin/ai-models?${searchParams.toString()}`);
    return response.data.data;
  },

  // 获取单个AI模型详情
  getAIModel: async (id: number): Promise<AIModelConfig> => {
    const response = await apiClient.get<AIModelResponse>(`/admin/ai-models/${id}`);
    return response.data.data;
  },

  // 创建AI模型
  createAIModel: async (data: CreateAIModelRequest): Promise<AIModelConfig> => {
    const response = await apiClient.post<AIModelResponse>('/admin/ai-models', data);
    return response.data.data;
  },

  // 更新AI模型
  updateAIModel: async (id: number, data: UpdateAIModelRequest): Promise<AIModelConfig> => {
    const response = await apiClient.put<AIModelResponse>(`/admin/ai-models/${id}`, data);
    return response.data.data;
  },

  // 删除AI模型
  deleteAIModel: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ success: boolean; data: { message: string } }>(`/admin/ai-models/${id}`);
    return response.data.data;
  },
};

export const getModelDisplayName = (model: AIModelConfig): string => {
  if (model.displayName) return model.displayName;

  // 根据provider和model_name生成显示名称
  const providerInfo = getProviderInfo(model.provider);
  return `${model.name} (${providerInfo.name})`;
};
