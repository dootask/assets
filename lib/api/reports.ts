
import apiClient from '@/lib/axios';
import type { APIResponse } from '@/lib/types';
import { downloadUrl } from "@dootask/tools";

// 报表查询参数
export interface ReportQueryParams {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  department_id?: string;
  status?: string;
  value_range?: string;
  warranty_status?: string;
  include_sub_categories?: boolean;
  borrower_name?: string;
  asset_category_id?: string;
  overdue_only?: boolean;
  borrow_duration?: string;
  task_type?: string;
}

// 借用报表数据类型
export interface BorrowReportData {
  summary: {
    total_borrows: number;
    active_borrows: number;
    returned_borrows: number;
    overdue_borrows: number;
    average_return_days: number;
  };
  by_department: Array<{
    department_name: string;
    borrow_count: number;
    active_count: number;
    overdue_count: number;
    percentage: number;
  }>;
  by_asset: Array<{
    asset_id: number;
    asset_name: string;
    asset_no: string;
    borrow_count: number;
    total_days: number;
  }>;
  overdue_analysis: {
    total_overdue: number;
    overdue_rate: number;
    average_overdue_days: number;
    by_overdue_days: Array<{
      days_range: string;
      count: number;
    }>;
  };
  monthly_trend: Array<{
    month: string;
    borrow_count: number;
    return_count: number;
  }>;
  popular_assets: Array<{
    asset_id: number;
    asset_name: string;
    asset_no: string;
    borrow_count: number;
    rank: number;
  }>;
}

// 资产报表数据类型
export interface AssetReportData {
  summary: {
    total_assets: number;
    available_assets: number;
    borrowed_assets: number;
    maintenance_assets: number;
    scrapped_assets: number;
    total_value: number;
  };
  by_category: Array<{
    category_id: number;
    category_name: string;
    asset_count: number;
    total_value: number;
    percentage: number;
  }>;
  by_department: Array<{
    department_name: string;
    asset_count: number;
    total_value: number;
    percentage: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  by_purchase_year: Array<{
    year: number;
    count: number;
    total_value: number;
  }>;
  value_analysis: {
    high_value: number;
    medium_value: number;
    low_value: number;
    no_value: number;
    average_value: number;
  };
  warranty_status: {
    in_warranty: number;
    expired_warranty: number;
    no_warranty: number;
  };
  utilization_rate: {
    total_assets: number;
    borrowed_assets: number;
    available_assets: number;
    utilization_rate: number;
    borrow_rate: number;
  };
  by_location?: Array<{
    location: string;
    count: number;
    total_value: number;
    percentage: number;
  }>;
  by_supplier?: Array<{
    supplier: string;
    count: number;
    total_value: number;
    percentage: number;
  }>;
  by_purchase_month?: Array<{
    month: string;
    count: number;
    total_value: number;
  }>;
}

// 盘点报表数据类型
export interface InventoryReportData {
  summary: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    pending_tasks: number;
    total_records: number;
    accuracy_rate: number;
  };
  task_analysis: Array<{
    task_id: number;
    task_name: string;
    task_type: string;
    status: string;
    start_date: string | null;
    total_assets: number;
    checked_assets: number;
    normal_count: number;
    surplus_count: number;
    deficit_count: number;
    damaged_count: number;
    accuracy_rate: number;
  }>;
  result_analysis: {
    normal_count: number;
    surplus_count: number;
    deficit_count: number;
    damaged_count: number;
    normal_rate: number;
    surplus_rate: number;
    deficit_rate: number;
    damaged_rate: number;
  };
  department_analysis: Array<{
    department_name: string;
    total_assets: number;
    checked_assets: number;
    issue_count: number;
    accuracy_rate: number;
  }>;
  category_analysis: Array<{
    category_id: number;
    category_name: string;
    total_assets: number;
    checked_assets: number;
    issue_count: number;
    accuracy_rate: number;
  }>;
  trend_analysis: Array<{
    month: string;
    task_count: number;
    accuracy_rate: number;
  }>;
}

// 仪表板报表数据类型
export interface DashboardReportData {
  asset_summary: {
    total_assets: number;
    available_assets: number;
    borrowed_assets: number;
    maintenance_assets: number;
  };
  borrow_summary: {
    active_borrows: number;
    overdue_borrows: number;
    today_returns: number;
  };
  inventory_summary: {
    active_tasks: number;
    completed_tasks: number;
    accuracy_rate: number;
  };
  recent_activities: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// 盘点相关独立类型定义（供charts组件使用）
export interface InventoryTaskStats {
  task_id: number;
  task_name: string;
  task_type: string;
  status: string;
  start_date: string | null;
  total_assets: number;
  checked_assets: number;
  normal_count: number;
  surplus_count: number;
  deficit_count: number;
  damaged_count: number;
  accuracy_rate: number;
}

export interface InventoryResultAnalysis {
  normal_count: number;
  surplus_count: number;
  deficit_count: number;
  damaged_count: number;
  normal_rate: number;
  surplus_rate: number;
  deficit_rate: number;
  damaged_rate: number;
}

export interface InventoryDepartmentStats {
  department_name: string;
  total_assets: number;
  checked_assets: number;
  issue_count: number;
  accuracy_rate: number;
}

export interface InventoryCategoryStats {
  category_id: number;
  category_name: string;
  total_assets: number;
  checked_assets: number;
  issue_count: number;
  accuracy_rate: number;
}

export interface InventoryTrendStats {
  month: string;
  task_count: number;
  accuracy_rate: number;
}

// 自定义报表请求类型
export interface CustomReportRequest {
  type: 'asset' | 'borrow' | 'inventory';
  fields: string[];
  filters: Record<string, string | number | boolean>;
  date_range?: {
    start_date: string;
    end_date: string;
  };
  group_by?: string[];
  sort_by?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// 自定义报表响应类型
export interface CustomReportResponse {
  columns: Array<{
    key: string;
    label: string;
    type: string;
  }>;
  data: Array<Record<string, string | number | boolean>>;
  total: number;
}

/**
 * 获取借用统计报表
 */
export const fetchBorrowReports = async (params?: ReportQueryParams): Promise<BorrowReportData> => {
  try {
    const response = await apiClient.get<APIResponse<BorrowReportData>>('/reports/borrow', { params });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch borrow reports:', error);
    // 对于其他错误，直接抛出异常让上层处理
    throw error;
  }
};

/**
 * 获取资产统计报表
 */
export const fetchAssetReports = async (params?: ReportQueryParams): Promise<AssetReportData> => {
  try {
    const response = await apiClient.get<APIResponse<AssetReportData>>('/reports/assets', { params });
    console.log('Asset reports API response:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch asset reports:', error);
    throw error;
  }
};

/**
 * 获取盘点统计报表
 */
export const fetchInventoryReports = async (params?: ReportQueryParams): Promise<InventoryReportData> => {
  try {
    const response = await apiClient.get<APIResponse<InventoryReportData>>('/reports/inventory', { params });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch inventory reports:', error);
    throw error;
  }
};

/**
 * 获取仪表板报表数据
 */
export const fetchDashboardReports = async (): Promise<DashboardReportData> => {
  try {
    const response = await apiClient.get<APIResponse<DashboardReportData>>('/reports/dashboard');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch dashboard reports:', error);
    throw error;
  }
};

/**
 * 获取自定义报表
 */
export const fetchCustomReports = async (request: CustomReportRequest): Promise<CustomReportResponse> => {
  try {
    const response = await apiClient.post<APIResponse<CustomReportResponse>>('/reports/custom', request);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch custom reports:', error);
    throw error;
  }
};

/**
 * 导出借用报表
 */
export const exportBorrowReports = async (format: string = 'excel', params?: ReportQueryParams): Promise<Blob> => {
  try {
    const response = await apiClient.get('/reports/borrow/export', {
      params: { format, ...params },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to export borrow reports:', error);
    throw error;
  }
};

/**
 * 导出资产报表
 */
export const exportAssetReports = async (format: string = 'excel', params?: ReportQueryParams): Promise<{ data: { download_url: string; filename: string; message: string } }> => {
  const response = await apiClient.get('/reports/assets/export', {
    params: { format, ...params },
  });
  return response.data;
};

/**
 * 导出盘点报表
 */
export const exportInventoryReports = async (format: string = 'excel', params?: ReportQueryParams): Promise<{ data: { download_url: string; filename: string; message: string } }> => {
  const response = await apiClient.get('/reports/inventory/export', {
    params: { format, ...params },
  });
  return response.data;
};

/**
 * 导出自定义报表
 */
export const exportCustomReports = async (request: CustomReportRequest & { format: string }): Promise<{ data: { download_url: string; filename: string; message: string } }> => {
  const response = await apiClient.post('/reports/custom/export', request);
  return response.data;
};

/**
 * 下载文件辅助函数
 */
export const downloadFile = async (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  try {
    await downloadUrl(url);
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

/**
 * 下载文件辅助函数
 */
export const downloadFileFromUrl = async (url: string, filename: string) => {
  try {
    await downloadUrl(url);
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

/**
 * 生成月度报告
 */
export const generateMonthlyReport = async (month?: string): Promise<{ data: { download_url: string; filename: string; message: string } }> => {
  const response = await apiClient.post('/reports/monthly',
    { month: month || new Date().toISOString().slice(0, 7) }
  );
  return response.data;
};

/**
 * 导出资产清单
 */
export const exportAssetInventory = async (): Promise<{ data: { download_url: string; filename: string; message: string } }> => {
  const response = await apiClient.get('/reports/asset-inventory/export');
  return response.data;
};
