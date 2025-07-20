// 通用API响应类型
export interface APIResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 智能体相关类型
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  prompt: string;
  model: string; // 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo'
  temperature: number;
  maxTokens?: number;
  tools: string[]; // MCP工具ID列表
  knowledgeBases: string[]; // 知识库ID列表
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  description: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  tools?: string[];
  knowledgeBases?: string[];
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  isActive?: boolean;
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
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
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
  description: string;
  embeddingModel?: string;
}

export interface UploadDocumentRequest {
  knowledgeBaseId: string;
  file: File;
  title?: string;
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
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'local';
  apiKey: string;
  baseUrl?: string;
  maxTokens: number;
  isDefault: boolean;
  isActive: boolean;
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
