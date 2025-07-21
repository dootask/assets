import axiosInstance from '@/lib/axios';
import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBase,
  KnowledgeBaseDocument,
  UploadDocumentRequest,
} from '@/lib/types';

// 后端API响应类型
interface KnowledgeBaseListResponse {
  items: KnowledgeBase[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface KnowledgeBaseResponse extends KnowledgeBase {
  documents_count: number;
  total_chunks: number;
  processed_chunks: number;
  last_document_upload?: string;
}

interface DocumentListResponse {
  items: KnowledgeBaseDocument[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface KnowledgeBaseQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  embedding_model?: string;
  is_active?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

interface DocumentQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  file_type?: string;
  status?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

// 前端表单数据类型
interface KnowledgeBaseFormData {
  name: string;
  description?: string;
  embeddingModel: string;
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

interface DocumentFormData {
  title: string;
  content: string;
  fileType: string;
  fileSize: number;
  filePath?: string;
  metadata?: Record<string, unknown>;
}

// 知识库管理API
export const knowledgeBasesApi = {
  // 获取知识库列表
  list: async (params: KnowledgeBaseQueryParams = {}): Promise<KnowledgeBaseListResponse> => {
    const response = await axiosInstance.get<KnowledgeBaseListResponse>('/admin/knowledge-bases', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        search: params.search,
        embedding_model: params.embedding_model,
        is_active: params.is_active,
        order_by: params.order_by || 'created_at',
        order_dir: params.order_dir || 'desc',
      },
    });
    return response.data;
  },

  // 获取知识库详情
  get: async (id: number): Promise<KnowledgeBaseResponse> => {
    const response = await axiosInstance.get<KnowledgeBaseResponse>(`/admin/knowledge-bases/${id}`);
    return response.data;
  },

  // 创建知识库
  create: async (data: KnowledgeBaseFormData): Promise<KnowledgeBase> => {
    const requestData = formatCreateRequestForAPI(data);
    const response = await axiosInstance.post<KnowledgeBase>('/admin/knowledge-bases', requestData);
    return formatKnowledgeBaseForUI(response.data);
  },

  // 更新知识库
  update: async (id: number, data: Partial<KnowledgeBaseFormData>): Promise<KnowledgeBase> => {
    const requestData = formatUpdateRequestForAPI(data);
    const response = await axiosInstance.put<KnowledgeBase>(`/admin/knowledge-bases/${id}`, requestData);
    return formatKnowledgeBaseForUI(response.data);
  },

  // 删除知识库
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/knowledge-bases/${id}`);
  },

  // 获取文档列表
  getDocuments: async (id: number, params: DocumentQueryParams = {}): Promise<DocumentListResponse> => {
    const response = await axiosInstance.get<DocumentListResponse>(`/admin/knowledge-bases/${id}/documents`, {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        search: params.search,
        file_type: params.file_type,
        status: params.status,
        order_by: params.order_by || 'created_at',
        order_dir: params.order_dir || 'desc',
      },
    });
    return response.data;
  },

  // 上传文档
  uploadDocument: async (id: number, data: DocumentFormData): Promise<KnowledgeBaseDocument> => {
    const requestData = formatDocumentRequestForAPI(data);
    const response = await axiosInstance.post<KnowledgeBaseDocument>(
      `/admin/knowledge-bases/${id}/documents`,
      requestData
    );
    return formatDocumentForUI(response.data);
  },

  // 删除文档
  deleteDocument: async (id: number, docId: number): Promise<void> => {
    await axiosInstance.delete(`/admin/knowledge-bases/${id}/documents/${docId}`);
  },
};

// 辅助函数 - 格式化知识库数据（从后端格式转换为前端兼容格式）
export const formatKnowledgeBaseForUI = (
  kb: KnowledgeBase
): KnowledgeBase & {
  embeddingModel: string;
  documentsCount: number;
  isActive: boolean;
} => {
  return {
    ...kb,
    // 映射字段以兼容现有UI
    embeddingModel: kb.embedding_model || 'text-embedding-ada-002',
    documentsCount: kb.documents_count || 0,
    isActive: kb.is_active !== undefined ? kb.is_active : true,
  };
};

// 辅助函数 - 格式化创建请求数据（从前端格式转换为后端格式）
export const formatCreateRequestForAPI = (data: KnowledgeBaseFormData): CreateKnowledgeBaseRequest => {
  return {
    name: data.name,
    description: data.description || null,
    embedding_model: data.embeddingModel,
    chunk_size: data.chunkSize || 1000,
    chunk_overlap: data.chunkOverlap || 200,
    metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
  };
};

// 辅助函数 - 格式化更新请求数据（从前端格式转换为后端格式）
export const formatUpdateRequestForAPI = (data: Partial<KnowledgeBaseFormData>) => {
  const result: Partial<{
    name: string;
    description: string | null;
    embedding_model: string;
    chunk_size: number;
    chunk_overlap: number;
    metadata: string;
    is_active: boolean;
  }> = {};

  if (data.name !== undefined) result.name = data.name;
  if (data.description !== undefined) result.description = data.description || null;
  if (data.embeddingModel !== undefined) result.embedding_model = data.embeddingModel;
  if (data.chunkSize !== undefined) result.chunk_size = data.chunkSize;
  if (data.chunkOverlap !== undefined) result.chunk_overlap = data.chunkOverlap;
  if (data.metadata !== undefined) {
    result.metadata = data.metadata ? JSON.stringify(data.metadata) : '{}';
  }
  if (data.isActive !== undefined) result.is_active = data.isActive;

  return result;
};

// 辅助函数 - 格式化文档数据（从后端格式转换为前端兼容格式）
export const formatDocumentForUI = (
  doc: KnowledgeBaseDocument
): KnowledgeBaseDocument & {
  name: string;
  size: string;
  uploadedAt: string;
  chunks: number;
  type: string;
} => {
  return {
    ...doc,
    // 映射字段以兼容现有UI
    name: doc.title,
    size: formatFileSize(doc.file_size || 0),
    uploadedAt: doc.created_at,
    chunks: doc.chunks_count || 0,
    type: doc.file_type || 'unknown',
  };
};

// 辅助函数 - 格式化文档请求数据（从前端格式转换为后端格式）
export const formatDocumentRequestForAPI = (data: DocumentFormData): UploadDocumentRequest => {
  return {
    title: data.title,
    content: data.content,
    file_type: data.fileType,
    file_size: data.fileSize,
    file_path: data.filePath || null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
  };
};

// 辅助函数 - 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 辅助函数 - 解析知识库元数据字段
export const parseKnowledgeBaseMetadata = (kb: KnowledgeBase) => {
  try {
    return {
      ...kb,
      metadata: typeof kb.metadata === 'string' ? JSON.parse(kb.metadata as string) : kb.metadata || {},
    };
  } catch (error) {
    console.error('解析知识库元数据失败:', error);
    return {
      ...kb,
      metadata: {},
    };
  }
};

// 辅助函数 - 解析文档元数据字段
export const parseDocumentMetadata = (doc: KnowledgeBaseDocument) => {
  try {
    return {
      ...doc,
      metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata as string) : doc.metadata || {},
    };
  } catch (error) {
    console.error('解析文档元数据失败:', error);
    return {
      ...doc,
      metadata: {},
    };
  }
};
