import apiClient from '@/lib/axios';
import type {
  APIResponse,
  CreateDepartmentRequest,
  DepartmentFilters,
  DepartmentResponse,
  DepartmentStatsResponse,
  PaginationRequest,
  PaginationResponse,
  UpdateDepartmentRequest,
} from '@/lib/types';

// 获取部门列表
export const getDepartments = async (params: PaginationRequest & { filters?: DepartmentFilters }) => {
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

  const response = await apiClient.get<APIResponse<PaginationResponse<DepartmentResponse[]>>>(
    `/departments?${queryParams.toString()}`
  );
  return response.data;
};

// 获取部门详情
export const getDepartment = async (id: number) => {
  const response = await apiClient.get<APIResponse<DepartmentResponse>>(`/departments/${id}`);
  return response.data;
};

// 创建部门
export const createDepartment = async (data: CreateDepartmentRequest) => {
  const response = await apiClient.post<APIResponse<DepartmentResponse>>('/departments', data);
  return response.data;
};

// 更新部门
export const updateDepartment = async (id: number, data: UpdateDepartmentRequest) => {
  const response = await apiClient.put<APIResponse<DepartmentResponse>>(`/departments/${id}`, data);
  return response.data;
};

// 删除部门
export const deleteDepartment = async (id: number) => {
  const response = await apiClient.delete<APIResponse<{ message: string }>>(`/departments/${id}`);
  return response.data;
};

// 获取部门统计信息
export const getDepartmentStats = async (id: number) => {
  const response = await apiClient.get<APIResponse<DepartmentStatsResponse>>(`/departments/${id}/stats`);
  return response.data;
};

// 获取所有部门（无分页，用于仪表板和下拉选择）
export const getAllDepartments = async () => {
  const response = await apiClient.get(`/departments`);
  return response.data;
};
