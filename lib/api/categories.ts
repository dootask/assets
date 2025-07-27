import { axiosInstance } from '../axios';

export interface Category {
  id: number;
  name: string;
  code: string;
  parent_id?: number;
  description: string;
  attributes?: any;
  asset_count?: number;
  parent?: Category;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  code: string;
  parent_id?: number;
  description: string;
  attributes?: any;
  asset_count: number;
  children: CategoryTreeNode[];
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
  parent_id?: number;
  description?: string;
  attributes?: any;
}

export interface UpdateCategoryRequest {
  name?: string;
  code?: string;
  parent_id?: number;
  description?: string;
  attributes?: any;
}

export interface CategoryFilters {
  name?: string;
  code?: string;
  parent_id?: number;
}

// 获取分类树
export const getCategories = async (filters?: CategoryFilters): Promise<CategoryTreeNode[]> => {
  const response = await axiosInstance.get('/categories', { params: filters });
  return response.data.data;
};

// 获取分类详情
export const getCategory = async (id: number): Promise<Category> => {
  const response = await axiosInstance.get(`/categories/${id}`);
  return response.data.data;
};

// 创建分类
export const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
  const response = await axiosInstance.post('/categories', data);
  return response.data.data;
};

// 更新分类
export const updateCategory = async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
  const response = await axiosInstance.put(`/categories/${id}`, data);
  return response.data.data;
};

// 删除分类
export const deleteCategory = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/categories/${id}`);
};

// 获取分类下的资产
export const getCategoryAssets = async (id: number, page = 1, pageSize = 12) => {
  const response = await axiosInstance.get(`/categories/${id}/assets`, {
    params: { page, page_size: pageSize }
  });
  return response.data.data;
};