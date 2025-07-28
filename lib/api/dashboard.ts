import apiClient from '@/lib/axios';
import { AssetDashboardStats } from '@/lib/types';

/**
 * 获取资产管理系统仪表板统计数据
 */
export const fetchDashboardStats = async (): Promise<AssetDashboardStats> => {
  const response = await apiClient.get('/dashboard/stats');

  if (response.data.code === 'SUCCESS' && response.data.data) {
    const data = response.data.data;

    return {
      assets: {
        total: data.assets?.total || 0,
        available: data.assets?.available || 0,
        borrowed: data.assets?.borrowed || 0,
        maintenance: data.assets?.maintenance || 0,
        scrapped: data.assets?.scrapped || 0,
      },
      categories: {
        total: data.categories?.total || 0,
      },
      departments: {
        total: data.departments?.total || 0,
      },
      borrowRecords: {
        total: data.borrow?.total || 0,
        active: data.borrow?.active || 0,
        overdue: data.borrow?.overdue || 0,
        todayReturns: data.borrow?.today_returns || 0,
      },
      recentAssets: data.recent_assets || [],
      recentBorrows: data.recent_borrows || [],
    };
  } else {
    throw new Error(response.data.message || 'Failed to load dashboard data');
  }
};

/**
 * 获取所有分类（无分页）
 */
export const fetchCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

/**
 * 获取所有部门（无分页）
 */
export const fetchDepartments = async () => {
  const response = await apiClient.get('/departments');
  return response.data;
};
