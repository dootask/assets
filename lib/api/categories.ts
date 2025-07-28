import apiClient from '@/lib/axios';

// 分类属性字段类型定义
export interface AttributeField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  default_value?: unknown;
}

// 用于保存的属性字段类型（不包含id）
export interface SaveAttributeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  default_value?: unknown;
}

// 分类属性结构
export interface CategoryAttributes {
  fields: AttributeField[];
}

// 用于保存的分类属性结构
export interface SaveCategoryAttributes {
  fields: SaveAttributeField[];
}

export interface Category {
  id: number;
  name: string;
  code: string;
  parent_id?: number | null;
  description?: string;
  attributes?: CategoryAttributes;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  code: string;
  parent_id?: number | null;
  description?: string;
  attributes?: CategoryAttributes;
  asset_count?: number;
  created_at: string;
  updated_at: string;
  children?: CategoryTreeNode[];
}

export interface CategoryFilters {
  name?: string;
  code?: string;
  parent_id?: number;
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
  parent_id?: number;
  description?: string;
  attributes?: SaveCategoryAttributes;
}

export interface UpdateCategoryRequest {
  name?: string;
  code?: string;
  parent_id?: number;
  description?: string;
  attributes?: SaveCategoryAttributes;
}

// 获取分类树
export const getCategories = async (filters?: CategoryFilters): Promise<CategoryTreeNode[]> => {
  const response = await apiClient.get('/categories', { params: filters });
  return response.data.data;
};

// 创建分类
export const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
  const response = await apiClient.post('/categories', data);
  return response.data.data;
};

// 更新分类
export const updateCategory = async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
  const response = await apiClient.put(`/categories/${id}`, data);
  return response.data.data;
};

// 删除分类
export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};

// 获取分类详情
export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await apiClient.get(`/categories/${id}`);
  return response.data.data;
};

// 更新分类属性
export const updateCategoryAttributes = async (id: number, attributes: SaveCategoryAttributes): Promise<Category> => {
  const response = await apiClient.put(`/categories/${id}/attributes`, { attributes });
  return response.data.data;
};

// 获取分类下的资产
export const getCategoryAssets = async (id: number, page = 1, pageSize = 12) => {
  const response = await apiClient.get(`/categories/${id}/assets`, {
    params: { page, page_size: pageSize }
  });
  return response.data.data;
};