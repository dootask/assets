import apiClient from '@/lib/axios';
import type {
  APIResponse,
  OperationLogFilters,
  OperationLogResponse,
  OperationLogStats,
  PaginationRequest,
  PaginationResponse,
} from '@/lib/types';

// 获取操作日志列表
export const getOperationLogs = async (params: PaginationRequest & { filters?: OperationLogFilters }) => {
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

  const response = await apiClient.get<APIResponse<PaginationResponse<OperationLogResponse[]>>>(
    `/logs?${queryParams.toString()}`
  );
  return response.data;
};

// 获取操作日志详情
export const getOperationLog = async (id: number) => {
  const response = await apiClient.get<APIResponse<OperationLogResponse>>(`/logs/${id}`);
  return response.data;
};

// 获取操作日志统计
export const getOperationLogStats = async () => {
  const response = await apiClient.get<APIResponse<OperationLogStats>>('/logs/stats');
  return response.data;
};
