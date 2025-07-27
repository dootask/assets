// 通用API响应类型
export interface APIResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 统一分页类型 - 与后端保持一致

// 排序字段
export interface SortField {
  key: string; // 排序字段名
  desc: boolean; // true: 降序, false: 升序
}

// 统一分页请求结构
export interface PaginationRequest {
  page: number; // 页码
  page_size: number; // 每页条数，默认12
  sorts?: SortField[]; // 排序字段数组
  filters?: Record<string, unknown>; // 筛选条件，每个接口可定义不同结构
}

export interface PaginationBase {
  current_page: number; // 当前页码
  page_size: number; // 每页条数
  total_items: number; // 总条数
  total_pages: number; // 总页数
}

// 统一分页响应结构
export interface PaginationResponse<T> extends PaginationBase {
  data: T; // 数据，使用泛型支持不同数据结构
}

// 各模块筛选条件接口

// 智能体筛选条件
export interface AgentFilters {
  search?: string;
  ai_model_id?: number;
  is_active?: boolean;
}

// 对话筛选条件
export interface ConversationFilters {
  search?: string;
  agent_id?: number;
  is_active?: boolean;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

// AI模型筛选条件
export interface AIModelFilters {
  provider?: string;
  is_enabled?: boolean;
}

// 知识库筛选条件
export interface KnowledgeBaseFilters {
  search?: string;
  embedding_model?: string;
  is_active?: boolean;
}

// MCP工具筛选条件
export interface MCPToolFilters {
  search?: string;
  category?: 'dootask' | 'external' | 'custom';
  type?: 'internal' | 'external';
  is_active?: boolean;
}

// 统一列表数据结构

// 智能体列表数据
export interface AgentListData {
  items: Agent[];
}

// 对话列表数据
export interface ConversationListData {
  items: Conversation[];
  statistics: ConversationStatistics;
}

// AI模型列表数据
export interface AIModelListData {
  items: AIModelConfig[];
}

// 知识库列表数据
export interface KnowledgeBaseListData {
  items: KnowledgeBase[];
}

// MCP工具列表数据
export interface MCPToolListData {
  items: MCPTool[];
}

// 对话统计信息
export interface ConversationStatistics {
  total: number;
  today: number;
  active: number;
  average_messages: number;
  average_response_time: number;
  success_rate: number;
}

// 智能体相关类型
export interface Agent {
  id: number;
  name: string;
  description?: string | null;
  prompt: string;
  ai_model_id?: number | null;
  temperature: number;
  tools: number[]; // JSONB array
  knowledge_bases: number[]; // JSONB array
  metadata: Record<string, unknown>; // JSONB object
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // 关联的AI模型对象
  ai_model?: AIModelConfig | null;

  // 统计信息
  statistics?: AgentStatistics | null;
}

export interface AgentStatistics {
  totalMessages: number;
  todayMessages: number;
  averageResponseTime: number;
  successRate: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string | null;
  prompt: string;
  ai_model_id?: number | null;
  temperature: number;
  tools?: number[]; // JSONB array
  knowledge_bases?: number[]; // JSONB array
  metadata?: Record<string, unknown>; // JSONB object
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string | null;
  prompt?: string;
  ai_model_id?: number | null;
  temperature?: number;
  tools?: unknown; // JSONB array
  knowledge_bases?: unknown; // JSONB array
  metadata?: unknown; // JSONB object
  is_active?: boolean;
}

// 智能体列表响应类型
export interface AgentListResponse {
  items: Agent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 智能体详情响应类型（包含统计信息）
export interface AgentResponse extends Agent {
  conversation_count: number;
  message_count: number;
  token_usage: number;
}

// 智能体查询参数类型
export interface AgentQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ai_model_id?: number;
  is_active?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

// 对话相关类型
export interface Conversation {
  id: string;
  agent_id: string;
  agent_name: string;
  dootask_chat_id: string;
  dootask_user_id: string;
  user_id: string;
  user_name: string;
  context: Record<string, unknown>;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  response_time?: number;
  created_at: string;
}

// 知识库相关类型
export interface KnowledgeBase {
  id: number; // 后端返回number类型
  name: string;
  description?: string | null;
  embedding_model: string; // 后端字段名
  chunk_size: number;
  chunk_overlap: number;
  metadata: unknown; // JSONB字段
  is_active: boolean; // 后端字段名
  created_at: string; // 后端字段名
  updated_at: string; // 后端字段名
  documents_count?: number; // 后端字段名
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  filePath?: string;
  fileType: 'pdf' | 'docx' | 'markdown' | 'text';
  fileSize: number;
  metadata: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string | null;
  embedding_model: string; // 后端字段名
  chunk_size?: number;
  chunk_overlap?: number;
  metadata?: string; // JSON字符串
}

export interface UploadDocumentRequest {
  title: string; // 修改为title而不是knowledgeBaseId
  content: string;
  file_type: string;
  file_size: number;
  file_path?: string | null;
  metadata?: string; // JSON字符串
}

// MCP工具相关类型
export interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: 'dootask' | 'external' | 'custom';
  type: 'internal' | 'external';
  config: Record<string, unknown>;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statistics?: MCPToolStatistics;
}

export interface MCPToolStatistics {
  totalCalls: number;
  todayCalls: number;
  averageResponseTime: number;
  successRate: number;
}

export interface CreateMCPToolRequest {
  name: string;
  description: string;
  category: 'dootask' | 'external' | 'custom';
  type: 'internal' | 'external';
  config: Record<string, unknown>;
  permissions?: string[];
}

export interface UpdateMCPToolRequest extends Partial<CreateMCPToolRequest> {
  isActive?: boolean;
}

// 系统设置相关类型
export interface SystemSettings {
  id: string;
  aiModels: AIModelConfig[];
  dootaskIntegration: DooTaskIntegrationConfig;
  webhookConfig: WebhookConfig;
  generalSettings: GeneralSettings;
  updatedAt: string;
}

export interface AIModelConfig {
  id: number;
  name: string;
  provider: string;
  model_name: string;
  api_key?: string | null;
  base_url: string;
  proxy_url?: string;
  max_tokens: number;
  temperature: number;
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // 前端扩展字段（用于显示）
  displayName?: string;
  agentCount?: number;
  conversationCount?: number;
  tokenUsage?: number;
  lastUsedAt?: string;
  avgResponseTime?: string;
  successRate?: string;
  errorCount?: number;
}

export interface CreateAIModelRequest {
  name: string;
  provider: string;
  model_name: string;
  api_key?: string | null;
  base_url?: string;
  proxy_url?: string;
  max_tokens: number;
  temperature: number;
  is_enabled: boolean;
  is_default: boolean;
}

export interface UpdateAIModelRequest {
  name?: string;
  provider?: string;
  model_name?: string;
  api_key?: string | null;
  base_url?: string;
  proxy_url?: string;
  max_tokens?: number;
  temperature?: number;
  is_enabled?: boolean;
  is_default?: boolean;
}

export interface AIModelListResponse {
  success: boolean;
  data: {
    models: AIModelConfig[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
  };
}

export interface AIModelResponse {
  success: boolean;
  data: AIModelConfig;
}

export interface DooTaskIntegrationConfig {
  apiBaseUrl: string;
  token: string;
  isConnected: boolean;
  lastSync: string;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  isActive: boolean;
  lastReceived?: string;
}

export interface GeneralSettings {
  defaultLanguage: 'zh-CN' | 'en-US';
  timezone: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxConversationHistory: number;
  autoCleanupDays: number;
}

// 仪表板统计类型
export interface DashboardStats {
  agents: {
    total: number;
    active: number;
    inactive: number;
  };
  conversations: {
    total: number;
    today: number;
    active: number;
  };
  messages: {
    total: number;
    today: number;
    averageResponseTime: number;
  };
  knowledgeBases: {
    total: number;
    documentsCount: number;
  };
  mcpTools: {
    total: number;
    active: number;
  };
  systemStatus: {
    goService: 'online' | 'offline';
    pythonService: 'online' | 'offline';
    database: 'online' | 'offline';
    webhook: 'connected' | 'disconnected';
  };
}

// 系统状态类型
export interface SystemStatus {
  service: string;
  status: 'online' | 'offline' | 'error';
  uptime: number;
  lastCheck: string;
  details?: Record<string, unknown>;
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 表单相关类型
export interface FormErrors {
  [key: string]: string[] | undefined;
}

// 操作结果类型
export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// 智能体详情页面的扩展类型
export interface AgentDetail extends Agent {
  toolDetails: MCPTool[];
  knowledgeBaseDetails: KnowledgeBase[];
  conversationCount?: number;
  messageCount?: number;
  lastUsedAt?: string;
}

// 知识库文档类型
export interface KnowledgeBaseDocument {
  id: number; // 后端返回number类型
  knowledge_base_id: number; // 后端字段名
  title: string; // 后端字段名
  content: string;
  file_path?: string | null;
  file_type: string; // 后端字段名
  file_size: number; // 后端字段名
  metadata: unknown; // JSONB字段
  chunk_index: number;
  parent_doc_id?: number | null;
  status: 'processed' | 'processing' | 'failed'; // 处理状态
  is_active: boolean; // 后端字段名
  created_at: string; // 后端字段名
  updated_at: string; // 后端字段名
  chunks_count?: number; // 后端字段名
}

// 资产管理相关类型

// 资产状态枚举
export type AssetStatus = 'available' | 'borrowed' | 'maintenance' | 'scrapped';

// 资产类型
export interface Asset {
  id: number;
  asset_no: string;
  name: string;
  category_id: number;
  department_id?: number;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date?: string;
  purchase_price?: number;
  supplier: string;
  warranty_period?: number;
  status: AssetStatus;
  location: string;
  responsible_person: string;
  description: string;
  image_url: string;
  custom_attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  category?: Category;
  department?: Department;
  borrow_records?: BorrowRecord[];
}

// 资产响应类型（包含计算字段）
export interface AssetResponse extends Asset {
  warranty_end_date?: string;
  is_under_warranty: boolean;
}

// 分类类型
export interface Category {
  id: number;
  name: string;
  code: string;
  parent_id?: number;
  description: string;
  attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  parent?: Category;
  children?: Category[];
  assets?: Asset[];
}

// 部门类型
export interface Department {
  id: number;
  name: string;
  code: string;
  manager: string;
  contact: string;
  description: string;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  assets?: Asset[];
  borrow_records?: BorrowRecord[];
}

// 借用记录类型
export type BorrowStatus = 'borrowed' | 'returned' | 'overdue';

export interface BorrowRecord {
  id: number;
  asset_id: number;
  borrower_name: string;
  borrower_contact: string;
  department_id?: number;
  borrow_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  status: BorrowStatus;
  purpose: string;
  notes: string;
  created_at: string;
  updated_at: string;
  
  // 关联数据
  asset?: Asset;
  department?: Department;
}

// 资产筛选条件
export interface AssetFilters {
  name?: string;
  asset_no?: string;
  category_id?: number;
  department_id?: number;
  status?: AssetStatus;
  brand?: string;
  model?: string;
  location?: string;
  responsible_person?: string;
  purchase_date_from?: string;
  purchase_date_to?: string;
  price_low?: number;
  price_high?: number;
}

// 创建资产请求
export interface CreateAssetRequest {
  asset_no: string;
  name: string;
  category_id: number;
  department_id?: number;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  supplier?: string;
  warranty_period?: number;
  status?: AssetStatus;
  location?: string;
  responsible_person?: string;
  description?: string;
  image_url?: string;
  custom_attributes?: Record<string, unknown>;
}

// 更新资产请求
export interface UpdateAssetRequest {
  asset_no?: string;
  name?: string;
  category_id?: number;
  department_id?: number;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  supplier?: string;
  warranty_period?: number;
  status?: AssetStatus;
  location?: string;
  responsible_person?: string;
  description?: string;
  image_url?: string;
  custom_attributes?: Record<string, unknown>;
}

// 批量导入资产请求
export interface ImportAssetRequest {
  assets: CreateAssetRequest[];
}

// 批量导入资产响应
export interface ImportAssetResponse {
  success_count: number;
  failed_count: number;
  errors: ImportAssetError[];
  assets: Asset[];
}

// 导入错误详情
export interface ImportAssetError {
  index: number;
  asset_no: string;
  error: string;
}

// 检查资产编号响应
export interface CheckAssetNoResponse {
  exists: boolean;
}

// 部门管理相关类型

// 部门响应类型（包含统计信息）
export interface DepartmentResponse extends Department {
  asset_count: number;
}

// 部门筛选条件
export interface DepartmentFilters {
  name?: string;
  code?: string;
  manager?: string;
}

// 创建部门请求
export interface CreateDepartmentRequest {
  name: string;
  code: string;
  manager?: string;
  contact?: string;
  description?: string;
}

// 更新部门请求
export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  manager?: string;
  contact?: string;
  description?: string;
}

// 部门统计响应
export interface DepartmentStatsResponse {
  total_assets: number;
  assets_by_status: Record<string, number>;
  assets_by_category: Record<string, number>;
  recent_assets: Asset[];
}

// 借用管理相关类型

// 借用记录响应类型（包含计算字段）
export interface BorrowResponse extends BorrowRecord {
  is_overdue: boolean;
  overdue_days: number;
  can_return: boolean;
}

// 借用记录筛选条件
export interface BorrowFilters {
  asset_id?: number;
  borrower_name?: string;
  department_id?: number;
  status?: BorrowStatus;
  borrow_date_from?: string;
  borrow_date_to?: string;
  expected_date_from?: string;
  expected_date_to?: string;
  overdue_only?: boolean;
}

// 创建借用记录请求
export interface CreateBorrowRequest {
  asset_id: number;
  borrower_name: string;
  borrower_contact?: string;
  department_id?: number;
  borrow_date: string;
  expected_return_date?: string;
  purpose?: string;
  notes?: string;
}

// 更新借用记录请求
export interface UpdateBorrowRequest {
  borrower_name?: string;
  borrower_contact?: string;
  department_id?: number;
  borrow_date?: string;
  expected_return_date?: string;
  purpose?: string;
  notes?: string;
}

// 归还资产请求
export interface ReturnAssetRequest {
  actual_return_date?: string;
  notes?: string;
}

// 借用统计响应
export interface BorrowStatsResponse {
  total_borrows: number;
  active_borrows: number;
  overdue_borrows: number;
  returned_borrows: number;
  borrows_by_status: Record<string, number>;
  borrows_by_month: MonthlyBorrowStats[];
  top_borrowers: BorrowerStats[];
  top_assets: AssetBorrowStats[];
}

// 月度借用统计
export interface MonthlyBorrowStats {
  month: string;
  count: number;
  returns: number;
}

// 借用人统计
export interface BorrowerStats {
  borrower_name: string;
  count: number;
  active_count: number;
}

// 资产借用统计
export interface AssetBorrowStats {
  asset_id: number;
  asset_name: string;
  asset_no: string;
  count: number;
}

// 可借用资产响应
export interface AvailableAssetResponse extends Asset {
  last_borrow_date?: string;
  borrow_count: number;
}
