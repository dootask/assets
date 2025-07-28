import apiClient from '@/lib/axios';
import type { APIResponse, PaginationRequest, PaginationResponse } from '@/lib/types';

// 盘点任务相关类型
export interface InventoryTask {
  id: number;
  task_name: string;
  task_type: 'full' | 'category' | 'department';
  scope_filter: InventoryScopeFilter;
  status: 'pending' | 'in_progress' | 'completed';
  start_date?: string;
  end_date?: string;
  created_by: string;
  notes: string;
  created_at: string;
  updated_at: string;
  total_assets: number;
  checked_assets: number;
  normal_assets: number;
  surplus_assets: number;
  deficit_assets: number;
  damaged_assets: number;
  progress: number;
}

export interface InventoryScopeFilter {
  category_ids?: number[];
  department_ids?: number[];
  asset_statuses?: string[];
  location_filter?: string;
}

export interface CreateInventoryTaskRequest {
  task_name: string;
  task_type: 'full' | 'category' | 'department';
  scope_filter: InventoryScopeFilter;
  start_date?: string;
  end_date?: string;
  created_by: string;
  notes?: string;
}

export interface UpdateInventoryTaskRequest {
  task_name?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface InventoryRecord {
  id: number;
  task_id: number;
  asset_id: number;
  expected_status: string;
  actual_status: string;
  result: 'normal' | 'surplus' | 'deficit' | 'damaged';
  notes: string;
  checked_at?: string;
  checked_by: string;
  created_at: string;
  updated_at: string;
  asset?: {
    id: number;
    asset_no: string;
    name: string;
    category?: { id: number; name: string };
    department?: { id: number; name: string };
  };
  task?: InventoryTask;
}

export interface CreateInventoryRecordRequest {
  task_id: number;
  asset_id: number;
  actual_status: string;
  result: 'normal' | 'surplus' | 'deficit' | 'damaged';
  notes?: string;
  checked_by: string;
}

export interface BatchCreateInventoryRecordsRequest {
  records: CreateInventoryRecordRequest[];
}

export interface InventoryTaskListQuery extends PaginationRequest {
  status?: 'pending' | 'in_progress' | 'completed';
  task_type?: 'full' | 'category' | 'department';
  keyword?: string;
}

export interface InventoryRecordListQuery extends PaginationRequest {
  task_id?: number;
  result?: 'normal' | 'surplus' | 'deficit' | 'damaged';
  keyword?: string;
}

export interface CategoryInventoryStats {
  category_id: number;
  category_name: string;
  total_assets: number;
  checked_assets: number;
  normal_assets: number;
  surplus_assets: number;
  deficit_assets: number;
  damaged_assets: number;
}

export interface DepartmentInventoryStats {
  department_id: number;
  department_name: string;
  total_assets: number;
  checked_assets: number;
  normal_assets: number;
  surplus_assets: number;
  deficit_assets: number;
  damaged_assets: number;
}

export interface InventoryReportResponse {
  task: InventoryTask;
  summary: InventoryTask;
  records: InventoryRecord[];
  category_stats: CategoryInventoryStats[];
  department_stats: DepartmentInventoryStats[];
}

// 获取盘点任务列表
export const getInventoryTasks = async (
  params: InventoryTaskListQuery
): Promise<APIResponse<PaginationResponse<InventoryTask[]>>> => {
  const queryParams = new URLSearchParams();

  // 添加分页参数
  queryParams.append('page', params.page.toString());
  queryParams.append('page_size', params.page_size.toString());

  // 添加筛选参数
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.task_type) {
    queryParams.append('task_type', params.task_type);
  }
  if (params.keyword) {
    queryParams.append('keyword', params.keyword);
  }

  const response = await apiClient.get(`/inventory/tasks?${queryParams.toString()}`);
  return response.data;
};

// 创建盘点任务
export const createInventoryTask = async (data: CreateInventoryTaskRequest): Promise<APIResponse<InventoryTask>> => {
  const response = await apiClient.post('/inventory/tasks', data);
  return response.data;
};

// 获取盘点任务详情
export const getInventoryTask = async (id: number): Promise<APIResponse<InventoryTask>> => {
  const response = await apiClient.get(`/inventory/tasks/${id}`);
  return response.data;
};

// 更新盘点任务
export const updateInventoryTask = async (
  id: number,
  data: UpdateInventoryTaskRequest
): Promise<APIResponse<InventoryTask>> => {
  const response = await apiClient.put(`/inventory/tasks/${id}`, data);
  return response.data;
};

// 删除盘点任务
export const deleteInventoryTask = async (id: number): Promise<APIResponse<{ message: string }>> => {
  const response = await apiClient.delete(`/inventory/tasks/${id}`);
  return response.data;
};

// 获取盘点记录列表
export const getInventoryRecords = async (
  params: InventoryRecordListQuery
): Promise<APIResponse<PaginationResponse<InventoryRecord[]>>> => {
  const queryParams = new URLSearchParams();

  // 添加分页参数
  queryParams.append('page', params.page.toString());
  queryParams.append('page_size', params.page_size.toString());

  // 添加筛选参数
  if (params.task_id) {
    queryParams.append('task_id', params.task_id.toString());
  }
  if (params.result) {
    queryParams.append('result', params.result);
  }
  if (params.keyword) {
    queryParams.append('keyword', params.keyword);
  }

  const response = await apiClient.get(`/inventory/records?${queryParams.toString()}`);
  return response.data;
};

// 创建盘点记录
export const createInventoryRecord = async (
  data: CreateInventoryRecordRequest
): Promise<APIResponse<InventoryRecord>> => {
  const response = await apiClient.post('/inventory/records', data);
  return response.data;
};

// 批量创建盘点记录
export const batchCreateInventoryRecords = async (
  data: BatchCreateInventoryRecordsRequest
): Promise<APIResponse<{ message: string; count: number; records: InventoryRecord[] }>> => {
  const response = await apiClient.post('/inventory/records/batch', data);
  return response.data;
};

// 获取盘点报告
export const getInventoryReport = async (id: number): Promise<APIResponse<InventoryReportResponse>> => {
  const response = await apiClient.get(`/inventory/tasks/${id}/report`);
  return response.data;
};
