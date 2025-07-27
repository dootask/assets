import apiClient from '@/lib/axios';
import type {
    APIResponse,
    AvailableAssetResponse,
    BorrowFilters,
    BorrowResponse,
    BorrowStatsResponse,
    CreateBorrowRequest,
    PaginationRequest,
    PaginationResponse,
    ReturnAssetRequest,
    UpdateBorrowRequest
} from '@/lib/types';

// 获取借用记录列表
export const getBorrowRecords = async (params: PaginationRequest & { filters?: BorrowFilters }) => {
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
  
  const response = await apiClient.get<APIResponse<PaginationResponse<BorrowResponse[]>>>(
    `/borrow?${queryParams.toString()}`
  );
  return response.data;
};

// 获取借用记录详情
export const getBorrowRecord = async (id: number) => {
  const response = await apiClient.get<APIResponse<BorrowResponse>>(`/borrow/${id}`);
  return response.data;
};

// 创建借用记录
export const createBorrowRecord = async (data: CreateBorrowRequest) => {
  const response = await apiClient.post<APIResponse<BorrowResponse>>('/borrow', data);
  return response.data;
};

// 更新借用记录
export const updateBorrowRecord = async (id: number, data: UpdateBorrowRequest) => {
  const response = await apiClient.put<APIResponse<BorrowResponse>>(`/borrow/${id}`, data);
  return response.data;
};

// 删除借用记录
export const deleteBorrowRecord = async (id: number) => {
  const response = await apiClient.delete<APIResponse<{ message: string }>>(`/borrow/${id}`);
  return response.data;
};

// 归还资产
export const returnAsset = async (id: number, data: ReturnAssetRequest = {}) => {
  const response = await apiClient.put<APIResponse<BorrowResponse>>(`/borrow/${id}/return`, data);
  return response.data;
};

// 获取可借用资产列表
export const getAvailableAssets = async (params: { page: number; page_size: number; search?: string }) => {
  const queryParams = new URLSearchParams();
  queryParams.append('page', params.page.toString());
  queryParams.append('page_size', params.page_size.toString());
  
  if (params.search) {
    queryParams.append('search', params.search);
  }
  
  const response = await apiClient.get<APIResponse<PaginationResponse<AvailableAssetResponse[]>>>(
    `/borrow/available-assets?${queryParams.toString()}`
  );
  return response.data;
};

// 获取借用统计信息
export const getBorrowStats = async () => {
  const response = await apiClient.get<APIResponse<BorrowStatsResponse>>('/borrow/stats');
  return response.data;
};

// 更新超期状态
export const updateOverdueStatus = async () => {
  const response = await apiClient.put<APIResponse<{ message: string; updated_count: number }>>('/borrow/update-overdue');
  return response.data;
};