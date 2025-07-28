import axios from '@/lib/axios';

// 资产报表数据接口
export interface AssetReportData {
  summary: AssetSummary;
  by_category: CategoryStats[];
  by_department: DepartmentStats[];
  by_status: StatusStats[];
  by_purchase_year: PurchaseYearStats[];
  value_analysis: ValueAnalysis;
  warranty_status: WarrantyStatus;
}

export interface AssetSummary {
  total_assets: number;
  total_value: number;
  available_assets: number;
  borrowed_assets: number;
  maintenance_assets: number;
  scrapped_assets: number;
}

export interface CategoryStats {
  category_id: number;
  category_name: string;
  asset_count: number;
  total_value: number;
  percentage: number;
}

export interface DepartmentStats {
  department_id?: number;
  department_name: string;
  asset_count: number;
  total_value: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface PurchaseYearStats {
  year: number;
  count: number;
  total_value: number;
}

export interface ValueAnalysis {
  high_value: number;
  medium_value: number;
  low_value: number;
  no_value: number;
  average_value: number;
}

export interface WarrantyStatus {
  in_warranty: number;
  out_of_warranty: number;
  no_warranty_info: number;
}

// 借用报表数据接口
export interface BorrowReportData {
  summary: BorrowSummary;
  by_department: BorrowDepartmentStats[];
  by_asset: BorrowAssetStats[];
  overdue_analysis: OverdueAnalysis;
  monthly_trend: MonthlyBorrowStats[];
  popular_assets: PopularAssetStats[];
}

export interface BorrowSummary {
  total_borrows: number;
  active_borrows: number;
  returned_borrows: number;
  overdue_borrows: number;
  average_return_days: number;
}

export interface BorrowDepartmentStats {
  department_id?: number;
  department_name: string;
  borrow_count: number;
  active_count: number;
  overdue_count: number;
  percentage: number;
}

export interface BorrowAssetStats {
  asset_id: number;
  asset_no: string;
  asset_name: string;
  borrow_count: number;
  total_days: number;
}

export interface OverdueAnalysis {
  total_overdue: number;
  overdue_rate: number;
  average_overdue_days: number;
  by_overdue_days: OverdueDaysStats[];
}

export interface OverdueDaysStats {
  days_range: string;
  count: number;
}

export interface MonthlyBorrowStats {
  month: string;
  borrow_count: number;
  return_count: number;
}

export interface PopularAssetStats {
  asset_id: number;
  asset_no: string;
  asset_name: string;
  borrow_count: number;
  rank: number;
}

// 盘点报表数据接口
export interface InventoryReportData {
  summary: InventorySummary;
  task_analysis: InventoryTaskStats[];
  result_analysis: InventoryResultAnalysis;
  department_analysis: InventoryDepartmentStats[];
  category_analysis: InventoryCategoryStats[];
  trend_analysis: InventoryTrendStats[];
}

export interface InventorySummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  total_records: number;
  accuracy_rate: number;
}

export interface InventoryTaskStats {
  task_id: number;
  task_name: string;
  task_type: string;
  status: string;
  start_date?: string;
  end_date?: string;
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
  department_id?: number;
  department_name: string;
  total_assets: number;
  checked_assets: number;
  normal_count: number;
  issue_count: number;
  accuracy_rate: number;
}

export interface InventoryCategoryStats {
  category_id: number;
  category_name: string;
  total_assets: number;
  checked_assets: number;
  normal_count: number;
  issue_count: number;
  accuracy_rate: number;
}

export interface InventoryTrendStats {
  month: string;
  task_count: number;
  accuracy_rate: number;
}

// 仪表板报表数据接口
export interface DashboardReportData {
  asset_overview: AssetOverview;
  borrow_overview: BorrowOverview;
  inventory_overview: InventoryOverview;
  recent_activity: RecentActivity;
  alerts: SystemAlert[];
}

export interface AssetOverview {
  total_assets: number;
  total_value: number;
  available_assets: number;
  borrowed_assets: number;
  maintenance_assets: number;
  scrapped_assets: number;
  growth_rate: number;
}

export interface BorrowOverview {
  active_borrows: number;
  overdue_borrows: number;
  today_borrows: number;
  today_returns: number;
  overdue_rate: number;
}

export interface InventoryOverview {
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  last_accuracy_rate: number;
}

export interface RecentActivity {
  recent_assets: RecentAsset[];
  recent_borrows: RecentBorrow[];
  recent_returns: RecentReturn[];
}

export interface RecentAsset {
  id: number;
  asset_no: string;
  name: string;
  category_name: string;
  created_at: string;
}

export interface RecentBorrow {
  id: number;
  asset_no: string;
  asset_name: string;
  borrower_name: string;
  borrow_date: string;
}

export interface RecentReturn {
  id: number;
  asset_no: string;
  asset_name: string;
  borrower_name: string;
  actual_return_date: string;
}

export interface SystemAlert {
  type: string;
  title: string;
  description: string;
  count: number;
  severity: string;
  created_at: string;
}

// 报表筛选条件的具体类型定义
export interface AssetReportFilters {
  name?: string;
  asset_no?: string;
  category_id?: number;
  department_id?: number;
  status?: string;
  brand?: string;
  location?: string;
  purchase_date_from?: string;
  purchase_date_to?: string;
  price_low?: number;
  price_high?: number;
}

export interface BorrowReportFilters {
  asset_id?: number;
  borrower_name?: string;
  department_id?: number;
  status?: string;
  borrow_date_from?: string;
  borrow_date_to?: string;
  overdue_only?: boolean;
}

export interface InventoryReportFilters {
  task_id?: number;
  task_type?: string;
  status?: string;
  department_id?: number;
  category_id?: number;
  result?: string;
  start_date?: string;
  end_date?: string;
}

// 报表数据的联合类型
export type ReportFilters = AssetReportFilters | BorrowReportFilters | InventoryReportFilters | Record<string, unknown>;

// 报表数据的具体类型定义
export type ReportDataItem = 
  | CategoryStats 
  | DepartmentStats 
  | StatusStats 
  | BorrowDepartmentStats 
  | BorrowAssetStats 
  | InventoryTaskStats 
  | InventoryDepartmentStats 
  | InventoryCategoryStats
  | Record<string, unknown>;

// 报表汇总数据的联合类型
export type ReportSummary = 
  | AssetSummary 
  | BorrowSummary 
  | InventorySummary 
  | Record<string, unknown>;

// 自定义报表请求接口
export interface CustomReportRequest {
  report_type: string;
  date_range: DateRange;
  filters: ReportFilters;
  group_by: string[];
  metrics: string[];
  sort_by: string;
  sort_order: string;
  limit: number;
}

export interface DateRange {
  start_date?: string;
  end_date?: string;
}

export interface CustomReportResponse {
  report_type: string;
  generated_at: string;
  date_range: DateRange;
  total_count: number;
  data: ReportDataItem[];
  summary: ReportSummary;
}

// 报表查询参数接口
export interface ReportQueryParams {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  department_id?: string;
  status?: string;
  task_type?: string;
}

/**
 * 获取资产统计报表
 */
export const fetchAssetReports = async (params?: ReportQueryParams): Promise<AssetReportData> => {
  const response = await axios.get('/reports/assets', { params });
  return response.data.data;
};

/**
 * 获取借用统计报表
 */
export const fetchBorrowReports = async (params?: ReportQueryParams): Promise<BorrowReportData> => {
  const response = await axios.get('/reports/borrow', { params });
  return response.data.data;
};

/**
 * 获取盘点统计报表
 */
export const fetchInventoryReports = async (params?: ReportQueryParams): Promise<InventoryReportData> => {
  const response = await axios.get('/reports/inventory', { params });
  return response.data.data;
};

/**
 * 获取仪表板报表数据
 */
export const fetchDashboardReports = async (): Promise<DashboardReportData> => {
  const response = await axios.get('/reports/dashboard');
  return response.data.data;
};

/**
 * 获取自定义报表
 */
export const fetchCustomReports = async (request: CustomReportRequest): Promise<CustomReportResponse> => {
  const response = await axios.post('/reports/custom', request);
  return response.data.data;
};

/**
 * 导出资产报表
 */
export const exportAssetReports = async (format: string = 'excel', params?: ReportQueryParams): Promise<Blob> => {
  const response = await axios.get('/reports/assets/export', {
    params: { format, ...params },
    responseType: 'blob',
  });
  return response.data;
};

/**
 * 导出借用报表
 */
export const exportBorrowReports = async (format: string = 'excel', params?: ReportQueryParams): Promise<Blob> => {
  const response = await axios.get('/reports/borrow/export', {
    params: { format, ...params },
    responseType: 'blob',
  });
  return response.data;
};

/**
 * 导出盘点报表
 */
export const exportInventoryReports = async (format: string = 'excel', params?: ReportQueryParams): Promise<Blob> => {
  const response = await axios.get('/reports/inventory/export', {
    params: { format, ...params },
    responseType: 'blob',
  });
  return response.data;
};

/**
 * 导出自定义报表
 */
export const exportCustomReports = async (request: CustomReportRequest & { format: string }): Promise<Blob> => {
  const response = await axios.post('/reports/custom/export', request, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * 下载文件
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};