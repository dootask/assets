import apiClient from '@/lib/axios';
import type {
  APIResponse,
  AssetFilters,
  AssetResponse,
  BatchDeleteAssetsRequest,
  BatchDeleteAssetsResponse,
  BatchUpdateAssetsRequest,
  BatchUpdateAssetsResponse,
  CheckAssetNoResponse,
  CreateAssetRequest,
  ImportAssetRequest,
  ImportAssetResponse,
  PaginationRequest,
  PaginationResponse,
  UpdateAssetRequest,
} from '@/lib/types';

// 获取资产列表
export const getAssets = async (params: PaginationRequest & { filters?: AssetFilters }) => {
  const queryParams = new URLSearchParams();

  // 添加分页参数
  queryParams.append('page', params.page.toString());
  queryParams.append('page_size', params.page_size.toString());

  // 添加排序参数
  if (params.sorts && params.sorts.length > 0) {
    params.sorts.forEach((sort, index) => {
      queryParams.append(`sorts[${index}][key]`, sort.key);
      queryParams.append(`sorts[${index}][desc]`, sort.desc.toString());
    });
  }

  // 添加筛选参数
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(`filters[${key}]`, value.toString());
      }
    });
  }

  const response = await apiClient.get<APIResponse<PaginationResponse<AssetResponse[]>>>(
    `/assets?${queryParams.toString()}`
  );
  return response.data;
};

// 获取资产详情
export const getAsset = async (id: number) => {
  const response = await apiClient.get<APIResponse<AssetResponse>>(`/assets/${id}`);
  return response.data;
};

// 创建资产
export const createAsset = async (data: CreateAssetRequest) => {
  const response = await apiClient.post<APIResponse<AssetResponse>>('/assets', data);
  return response.data;
};

// 更新资产
export const updateAsset = async (id: number, data: UpdateAssetRequest) => {
  const response = await apiClient.put<APIResponse<AssetResponse>>(`/assets/${id}`, data);
  return response.data;
};

// 删除资产
export const deleteAsset = async (id: number) => {
  const response = await apiClient.delete<APIResponse<{ message: string }>>(`/assets/${id}`);
  return response.data;
};

// 检查资产编号是否存在
export const checkAssetNo = async (assetNo: string) => {
  const response = await apiClient.get<APIResponse<CheckAssetNoResponse>>(`/assets/check-asset-no/${assetNo}`);
  return response.data;
};

// 批量导入资产
export const importAssets = async (data: ImportAssetRequest) => {
  const response = await apiClient.post<APIResponse<ImportAssetResponse>>('/assets/import', data);
  return response.data;
};

// 导出资产 - 返回下载URL
export const exportAssets = async (filters?: AssetFilters): Promise<{
  download_url: string;
  filename: string;
  message: string;
}> => {
  const queryParams = new URLSearchParams();

  // 添加筛选参数
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(`filters[${key}]`, value.toString());
      }
    });
  }

  const response = await apiClient.get(`/assets/export?${queryParams.toString()}`);
  return response.data.data;
};

// 批量更新资产
export const batchUpdateAssets = async (data: BatchUpdateAssetsRequest) => {
  const response = await apiClient.put<APIResponse<BatchUpdateAssetsResponse>>('/assets/batch', data);
  return response.data;
};

// 批量删除资产
export const batchDeleteAssets = async (data: BatchDeleteAssetsRequest) => {
  const response = await apiClient.delete<APIResponse<BatchDeleteAssetsResponse>>('/assets/batch', { data });
  return response.data;
};

// 上传资产图片
export const uploadAssetImage = async (file: File): Promise<{ data: { filepath: string; filename: string; size: number } }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * 获取资产导入模板下载URL
 */
export const getAssetTemplate = async (): Promise<{ data: { download_url: string; filename: string; message: string } }> => {
  const response = await apiClient.get('/assets/template');
  return response.data;
};
