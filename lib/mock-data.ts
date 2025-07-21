import type {
  Agent,
  AIModelConfig,
  Conversation,
  CreateAgentRequest,
  CreateKnowledgeBaseRequest,
  CreateMCPToolRequest,
  DashboardStats,
  KnowledgeBase,
  MCPTool,
  SystemSettings,
  UpdateAgentRequest,
  UpdateMCPToolRequest,
} from './types';

// 本地存储键名
const STORAGE_KEYS = {
  AGENTS: 'dootask_ai_agents',
  CONVERSATIONS: 'dootask_ai_conversations',
  KNOWLEDGE_BASES: 'dootask_ai_knowledge_bases',
  MCP_TOOLS: 'dootask_ai_mcp_tools',
  SYSTEM_SETTINGS: 'dootask_ai_system_settings',
} as const;

// 生成UUID的简单实现
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 格式化时间
const formatTime = (date: Date = new Date()): string => {
  return date.toISOString();
};

// 默认智能体数据
const DEFAULT_AGENTS: Agent[] = [
  {
    id: '1',
    name: '技术助手',
    description: '专业的技术支持智能体，擅长解答技术问题和提供开发建议',
    prompt: '你是一个专业的技术助手，擅长回答各种技术问题。请用专业、准确、友好的语气回答用户的问题。',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    tools: ['dootask-search', 'project-manager'],
    knowledgeBases: ['tech-docs'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    statistics: {
      totalMessages: 156,
      todayMessages: 23,
      averageResponseTime: 2.3,
      successRate: 0.95,
    },
  },
  {
    id: '2',
    name: '客服助手',
    description: '友好的客服智能体，专门处理用户咨询和问题解答',
    prompt: '你是一个友好的客服助手，要以热情、耐心的态度帮助用户解决问题。',
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    maxTokens: 1500,
    tools: ['user-search', 'faq-search'],
    knowledgeBases: ['faq-base'],
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    statistics: {
      totalMessages: 89,
      todayMessages: 15,
      averageResponseTime: 1.8,
      successRate: 0.92,
    },
  },
  {
    id: '3',
    name: '任务助手',
    description: '专门用于任务管理和项目协作的智能体',
    prompt: '你是一个专业的任务管理助手，帮助用户创建、管理和跟踪任务和项目进度。',
    model: 'gpt-4',
    temperature: 0.6,
    maxTokens: 2000,
    tools: ['task-manager', 'project-manager', 'calendar'],
    knowledgeBases: ['project-docs'],
    isActive: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    statistics: {
      totalMessages: 45,
      todayMessages: 7,
      averageResponseTime: 3.1,
      successRate: 0.98,
    },
  },
];

// 默认对话数据
const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    agentId: '1',
    agentName: '技术助手',
    dootaskChatId: 'chat-001',
    dootaskUserId: 'user-001',
    userId: 'user-001',
    userName: '张三',
    context: { lastTopic: '技术咨询' },
    messagesCount: 5,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:45:00Z',
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'assistant',
      content: '好的，我已经帮您分析了这个技术问题。建议您可以尝试...',
      responseTime: 2.1,
      createdAt: '2024-01-15T08:45:00Z',
    },
  },
  {
    id: 'conv-2',
    agentId: '2',
    agentName: '客服助手',
    dootaskChatId: 'chat-002',
    dootaskUserId: 'user-002',
    userId: 'user-002',
    userName: '李四',
    context: { issue: '账户问题' },
    messagesCount: 3,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:10:00Z',
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-2',
      role: 'assistant',
      content: '您的账户问题已经解决，请查收邮件确认。',
      responseTime: 1.5,
      createdAt: '2024-01-15T09:10:00Z',
    },
  },
];

// 默认知识库数据
const DEFAULT_KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: 'tech-docs',
    name: '技术文档库',
    description: '包含技术规范、API文档、最佳实践等技术资料',
    documentsCount: 25,
    embeddingModel: 'text-embedding-ada-002',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'faq-base',
    name: '常见问题库',
    description: '用户常见问题和答案库',
    documentsCount: 15,
    embeddingModel: 'text-embedding-ada-002',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
];

// 默认MCP工具数据
const DEFAULT_MCP_TOOLS: MCPTool[] = [
  {
    id: 'dootask-search',
    name: 'DooTask搜索',
    description: '搜索DooTask中的用户、项目、任务等信息',
    category: 'dootask',
    type: 'internal',
    config: { endpoint: '/api/search' },
    permissions: ['read'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    statistics: {
      totalCalls: 234,
      todayCalls: 12,
      averageResponseTime: 0.8,
      successRate: 0.97,
    },
  },
  {
    id: 'task-manager',
    name: '任务管理器',
    description: '创建、更新、删除DooTask中的任务',
    category: 'dootask',
    type: 'internal',
    config: { endpoint: '/api/tasks' },
    permissions: ['read', 'write'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    statistics: {
      totalCalls: 156,
      todayCalls: 8,
      averageResponseTime: 1.2,
      successRate: 0.94,
    },
  },
  {
    id: 'weather-api',
    name: '天气查询',
    description: '获取天气信息的外部API',
    category: 'external',
    type: 'external',
    config: { apiKey: '****', baseUrl: 'https://api.weather.com' },
    permissions: ['read'],
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    statistics: {
      totalCalls: 89,
      todayCalls: 5,
      averageResponseTime: 2.1,
      successRate: 0.99,
    },
  },
];

// 默认系统设置
const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  id: 'system-config',
  aiModels: [
    {
      id: 'openai-gpt-3.5',
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      provider: 'openai',
      apiKey: '****',
      maxTokens: 4000,
      isDefault: true,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      agentCount: 2,
      conversationCount: 45,
      tokenUsage: 12340,
      lastUsedAt: '2024-01-15T10:30:00Z',
      avgResponseTime: '2.1s',
      successRate: '98.5%',
      errorCount: 3,
    },
    {
      id: 'openai-gpt-4',
      name: 'gpt-4',
      displayName: 'GPT-4',
      provider: 'openai',
      apiKey: '****',
      maxTokens: 8000,
      isDefault: false,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-12T00:00:00Z',
      agentCount: 1,
      conversationCount: 23,
      tokenUsage: 8900,
      lastUsedAt: '2024-01-14T15:20:00Z',
      avgResponseTime: '3.4s',
      successRate: '99.1%',
      errorCount: 1,
    },
    {
      id: 'anthropic-claude-3',
      name: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      provider: 'anthropic',
      apiKey: '****',
      maxTokens: 4096,
      isDefault: false,
      isActive: false,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
      agentCount: 0,
      conversationCount: 0,
      tokenUsage: 0,
      avgResponseTime: '-',
      successRate: '-',
      errorCount: 0,
    },
    {
      id: 'deepseek-v2.5',
      name: 'deepseek-chat',
      displayName: 'DeepSeek V2.5',
      provider: 'deepseek',
      apiKey: '****',
      baseUrl: 'https://api.deepseek.com/v1',
      maxTokens: 4000,
      isDefault: false,
      isActive: false,
      createdAt: '2024-01-08T00:00:00Z',
      updatedAt: '2024-01-08T00:00:00Z',
      agentCount: 0,
      conversationCount: 0,
      tokenUsage: 0,
      avgResponseTime: '-',
      successRate: '-',
      errorCount: 0,
    },
  ],
  dootaskIntegration: {
    apiBaseUrl: 'https://dootask.example.com/api',
    token: '****',
    isConnected: true,
    lastSync: '2024-01-15T10:00:00Z',
  },
  webhookConfig: {
    url: 'https://ai-plugin.example.com/webhook',
    secret: '****',
    isActive: true,
    lastReceived: '2024-01-15T10:30:00Z',
  },
  generalSettings: {
    defaultLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
    logLevel: 'info',
    maxConversationHistory: 100,
    autoCleanupDays: 30,
  },
  updatedAt: '2024-01-15T00:00:00Z',
};

// Mock数据管理类
export class MockDataManager {
  // 获取本地存储数据
  private static getStorageData<T>(key: string, defaultData: T): T {
    if (typeof window === 'undefined') return defaultData;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultData;
  }

  // 保存数据到本地存储
  private static setStorageData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // 智能体管理
  static getAgents(): Agent[] {
    return this.getStorageData(STORAGE_KEYS.AGENTS, DEFAULT_AGENTS);
  }

  static getAgent(id: string): Agent | undefined {
    const agents = this.getAgents();
    return agents.find(agent => agent.id === id);
  }

  static createAgent(request: CreateAgentRequest): Agent {
    const agents = this.getAgents();
    const newAgent: Agent = {
      id: generateId(),
      ...request,
      tools: request.tools || [],
      knowledgeBases: request.knowledgeBases || [],
      isActive: true,
      createdAt: formatTime(),
      updatedAt: formatTime(),
      statistics: {
        totalMessages: 0,
        todayMessages: 0,
        averageResponseTime: 0,
        successRate: 0,
      },
    };
    agents.push(newAgent);
    this.setStorageData(STORAGE_KEYS.AGENTS, agents);
    return newAgent;
  }

  static updateAgent(id: string, request: UpdateAgentRequest): Agent | null {
    const agents = this.getAgents();
    const index = agents.findIndex(agent => agent.id === id);
    if (index === -1) return null;

    agents[index] = {
      ...agents[index],
      ...request,
      updatedAt: formatTime(),
    };
    this.setStorageData(STORAGE_KEYS.AGENTS, agents);
    return agents[index];
  }

  static deleteAgent(id: string): boolean {
    const agents = this.getAgents();
    const filteredAgents = agents.filter(agent => agent.id !== id);
    if (filteredAgents.length === agents.length) return false;

    this.setStorageData(STORAGE_KEYS.AGENTS, filteredAgents);
    return true;
  }

  // 对话管理
  static getConversations(): Conversation[] {
    return this.getStorageData(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
  }

  // 知识库管理
  static getKnowledgeBases(): KnowledgeBase[] {
    return this.getStorageData(STORAGE_KEYS.KNOWLEDGE_BASES, DEFAULT_KNOWLEDGE_BASES);
  }

  static createKnowledgeBase(request: CreateKnowledgeBaseRequest): KnowledgeBase {
    const knowledgeBases = this.getKnowledgeBases();
    const newKB: KnowledgeBase = {
      id: generateId(),
      ...request,
      embeddingModel: request.embeddingModel || 'text-embedding-ada-002',
      documentsCount: 0,
      createdAt: formatTime(),
      updatedAt: formatTime(),
    };
    knowledgeBases.push(newKB);
    this.setStorageData(STORAGE_KEYS.KNOWLEDGE_BASES, knowledgeBases);
    return newKB;
  }

  // MCP工具管理
  static getMCPTools(): MCPTool[] {
    return this.getStorageData(STORAGE_KEYS.MCP_TOOLS, DEFAULT_MCP_TOOLS);
  }

  static createMCPTool(request: CreateMCPToolRequest): MCPTool {
    const tools = this.getMCPTools();
    const newTool: MCPTool = {
      id: generateId(),
      ...request,
      permissions: request.permissions || ['read'],
      isActive: true,
      createdAt: formatTime(),
      updatedAt: formatTime(),
      statistics: {
        totalCalls: 0,
        todayCalls: 0,
        averageResponseTime: 0,
        successRate: 0,
      },
    };
    tools.push(newTool);
    this.setStorageData(STORAGE_KEYS.MCP_TOOLS, tools);
    return newTool;
  }

  static updateMCPTool(id: string, request: UpdateMCPToolRequest): MCPTool | null {
    const tools = this.getMCPTools();
    const index = tools.findIndex(tool => tool.id === id);
    if (index === -1) return null;

    tools[index] = {
      ...tools[index],
      ...request,
      updatedAt: formatTime(),
    };
    this.setStorageData(STORAGE_KEYS.MCP_TOOLS, tools);
    return tools[index];
  }

  // 系统设置管理
  static getSystemSettings(): SystemSettings {
    return this.getStorageData(STORAGE_KEYS.SYSTEM_SETTINGS, DEFAULT_SYSTEM_SETTINGS);
  }

  static updateSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    const currentSettings = this.getSystemSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: formatTime(),
    };
    this.setStorageData(STORAGE_KEYS.SYSTEM_SETTINGS, updatedSettings);
    return updatedSettings;
  }

  // 仪表板统计数据
  static getDashboardStats(): DashboardStats {
    const agents = this.getAgents();
    const conversations = this.getConversations();
    const knowledgeBases = this.getKnowledgeBases();
    const mcpTools = this.getMCPTools();

    return {
      agents: {
        total: agents.length,
        active: agents.filter(a => a.isActive).length,
        inactive: agents.filter(a => !a.isActive).length,
      },
      conversations: {
        total: conversations.length,
        today: conversations.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).length,
        active: conversations.length,
      },
      messages: {
        total: agents.reduce((sum, a) => sum + (a.statistics?.totalMessages || 0), 0),
        today: agents.reduce((sum, a) => sum + (a.statistics?.todayMessages || 0), 0),
        averageResponseTime:
          agents.reduce((sum, a) => sum + (a.statistics?.averageResponseTime || 0), 0) / agents.length,
      },
      knowledgeBases: {
        total: knowledgeBases.length,
        documentsCount: knowledgeBases.reduce((sum, kb) => sum + kb.documentsCount, 0),
      },
      mcpTools: {
        total: mcpTools.length,
        active: mcpTools.filter(t => t.isActive).length,
      },
      systemStatus: {
        goService: 'online',
        pythonService: 'online',
        database: 'online',
        webhook: 'connected',
      },
    };
  }

  // AI模型管理方法
  static getAIModels(): AIModelConfig[] {
    const settings = this.getSystemSettings();
    return settings.aiModels;
  }

  static addAIModel(model: Omit<AIModelConfig, 'id'>): AIModelConfig {
    const settings = this.getSystemSettings();
    const newModel: AIModelConfig = {
      ...model,
      id: `${model.provider}-${Date.now()}`,
      createdAt: formatTime(),
      updatedAt: formatTime(),
      agentCount: 0,
      conversationCount: 0,
      tokenUsage: 0,
      avgResponseTime: '-',
      successRate: '-',
      errorCount: 0,
    };

    // 如果设置为默认，取消其他模型的默认状态
    if (newModel.isDefault) {
      settings.aiModels = settings.aiModels.map(m => ({ ...m, isDefault: false }));
    }

    settings.aiModels.push(newModel);
    this.updateSystemSettings(settings);
    return newModel;
  }

  static updateAIModel(modelId: string, updates: Partial<AIModelConfig>): AIModelConfig | null {
    const settings = this.getSystemSettings();
    const modelIndex = settings.aiModels.findIndex(m => m.id === modelId);

    if (modelIndex === -1) return null;

    // 如果设置为默认，取消其他模型的默认状态
    if (updates.isDefault) {
      settings.aiModels = settings.aiModels.map(m => ({ ...m, isDefault: false }));
    }

    settings.aiModels[modelIndex] = {
      ...settings.aiModels[modelIndex],
      ...updates,
      updatedAt: formatTime(),
    };
    this.updateSystemSettings(settings);
    return settings.aiModels[modelIndex];
  }

  static deleteAIModel(modelId: string): boolean {
    return this.removeAIModel(modelId);
  }

  static removeAIModel(modelId: string): boolean {
    const settings = this.getSystemSettings();
    const initialLength = settings.aiModels.length;
    settings.aiModels = settings.aiModels.filter(m => m.id !== modelId);

    // 如果删除的是默认模型，设置第一个激活的模型为默认
    const hasDefault = settings.aiModels.some(m => m.isDefault);
    if (!hasDefault && settings.aiModels.length > 0) {
      const firstActiveModel = settings.aiModels.find(m => m.isActive);
      if (firstActiveModel) {
        firstActiveModel.isDefault = true;
      }
    }

    this.updateSystemSettings(settings);
    return settings.aiModels.length < initialLength;
  }

  // 知识库管理方法补充
  static updateKnowledgeBase(id: string, request: Partial<CreateKnowledgeBaseRequest>): KnowledgeBase | null {
    const knowledgeBases = this.getKnowledgeBases();
    const index = knowledgeBases.findIndex(kb => kb.id === id);
    if (index === -1) return null;

    knowledgeBases[index] = {
      ...knowledgeBases[index],
      ...request,
      updatedAt: formatTime(),
    };
    this.setStorageData(STORAGE_KEYS.KNOWLEDGE_BASES, knowledgeBases);
    return knowledgeBases[index];
  }

  static deleteKnowledgeBase(id: string): boolean {
    const knowledgeBases = this.getKnowledgeBases();
    const filteredKnowledgeBases = knowledgeBases.filter(kb => kb.id !== id);
    if (filteredKnowledgeBases.length === knowledgeBases.length) return false;

    this.setStorageData(STORAGE_KEYS.KNOWLEDGE_BASES, filteredKnowledgeBases);
    return true;
  }

  // 初始化数据（首次使用时）
  static initializeData(): void {
    // 检查是否已有数据，如果没有则使用默认数据
    this.getAgents();
    this.getConversations();
    this.getKnowledgeBases();
    this.getMCPTools();
    this.getSystemSettings();
  }
}
