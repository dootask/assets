import apiClient from '@/lib/axios';
import type { APIResponse, PaginationRequest, PaginationResponse } from '@/lib/types';
import { downloadUrl } from "@dootask/tools";

// 备份文件类型
export interface BackupFile {
  filename: string;
  download_url: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

// 备份信息类型（包含格式化大小）
export interface BackupInfo extends BackupFile {
  formatted_size: string;
}

// 创建备份请求
export type CreateBackupRequest = Record<string, never>

// 创建备份响应
export interface CreateBackupResponse {
  filename: string;
  file_path: string;
  file_size: number;
  created_at: string;
}


// 删除备份响应
export interface DeleteBackupResponse {
  message: string;
}

// 恢复备份请求
export interface RestoreBackupRequest {
  filename: string; // 要恢复的备份文件名
}

// 恢复备份响应
export interface RestoreBackupResponse {
  message: string;
  restored_at: string;
}

// 备份筛选条件
export interface BackupFilters {
  keyword?: string;
  date_from?: string;
  date_to?: string;
}

// 获取备份列表
export const getBackups = async (params: PaginationRequest & { filters?: BackupFilters }) => {
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

  const response = await apiClient.get<APIResponse<PaginationResponse<BackupFile[]>>>(
    `/backup?${queryParams.toString()}`
  );
  return response.data;
};

// 创建备份
export const createBackup = async (data: CreateBackupRequest = {}) => {
  const response = await apiClient.post<APIResponse<CreateBackupResponse>>(
    '/backup/create',
    data
  );
  return response.data;
};

// 获取备份信息
export const getBackupInfo = async (filename: string) => {
  const response = await apiClient.get<APIResponse<BackupInfo>>(`/backup/${filename}/info`);
  return response.data;
};

// 下载备份文件
export const downloadBackup = async (filename: string) => {
  const response = await apiClient.get(`/backup/${filename}/download`, {
    responseType: 'blob',
  });
  return response;
};


// 删除备份
export const deleteBackup = async (filename: string) => {
  const response = await apiClient.delete<APIResponse<DeleteBackupResponse>>(
    `/backup/${filename}`
  );
  return response.data;
};

// 恢复备份
export const restoreBackup = async (data: RestoreBackupRequest) => {
  const response = await apiClient.post<APIResponse<RestoreBackupResponse>>(
    '/backup/restore',
    data
  );
  return response.data;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 下载文件到本地
export const downloadFileToLocal = async (filename: string) => {
  try {
    const response = await downloadBackup(filename);

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));

    try {
      await downloadUrl(url);
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    return true;
  } catch (error) {
    console.error('下载文件失败:', error);
    throw error;
  }
};
