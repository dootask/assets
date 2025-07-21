// 通用API响应类型
export interface APIResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 智能体相关类型
export interface Agent {
  id: number;
  name: string;
  description?: string | null;
  prompt: string;
  ai_model_id?: number | null;
  temperature: number;
  tools: unknown; // JSONB array
  knowledge_bases: unknown; // JSONB array
  metadata: unknown; // JSONB object
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // 关联的AI模型对象
  ai_model?: AIModelConfig | null;

  // 前端扩展字段（兼容现有UI）
  model?: string; // 从ai_model.name映射
  maxTokens?: number;
  isActive?: boolean; // 从is_active映射
  avatar?: string;
  statistics?: AgentStatistics;
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
  tools?: unknown; // JSONB array
  knowledge_bases?: unknown; // JSONB array
  metadata?: unknown; // JSONB object
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
  agentId: string;
  agentName: string;
  dootaskChatId: string;
  dootaskUserId: string;
  userId: string;
  userName: string;
  context: Record<string, unknown>;
  messagesCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  responseTime?: number;
  createdAt: string;
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

  // 前端兼容字段
  embeddingModel?: string; // 从embedding_model映射
  documentsCount?: number; // 从documents_count映射
  createdAt?: string; // 从created_at映射
  updatedAt?: string; // 从updated_at映射
  isActive?: boolean; // 从is_active映射
  documents?: Document[];
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
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'local';
  model_name: string;
  api_key?: string | null;
  base_url: string;
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
  max_tokens: number;
  temperature: number;
  is_enabled: boolean;
  is_default: boolean;
}

export interface UpdateAIModelRequest {
  name?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'azure' | 'local';
  model_name?: string;
  api_key?: string | null;
  base_url?: string;
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

  // 前端兼容字段
  name?: string; // 从title映射
  size?: string; // 从file_size映射
  uploadedAt?: string; // 从created_at映射
  chunks?: number; // 从chunks_count映射
  type?: string; // 从file_type映射
}
