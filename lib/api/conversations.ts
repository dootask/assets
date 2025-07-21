import axios from '@/lib/axios';
import { Conversation, Message } from '@/lib/types';

// 对话查询参数接口
export interface ConversationQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  agent_id?: number;
  is_active?: boolean;
  user_id?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  start_date?: string;
  end_date?: string;
}

// 消息查询参数接口
export interface MessageQueryParams {
  page?: number;
  page_size?: number;
  role?: 'user' | 'assistant' | 'system';
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

// 对话列表响应接口
export interface ConversationListResponse {
  items: Conversation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  statistics: ConversationStatistics;
}

// 消息列表响应接口
export interface MessageListResponse {
  items: Message[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 对话详情响应接口
export interface ConversationDetailResponse extends Conversation {
  total_messages: number;
  average_response_time: number;
  total_tokens_used: number;
  last_activity: string;
}

// 对话统计信息接口
export interface ConversationStatistics {
  total: number;
  today: number;
  active: number;
  average_messages: number;
  average_response_time: number;
  success_rate: number;
}

/**
 * 获取对话列表
 */
export const fetchConversations = async (params: ConversationQueryParams = {}): Promise<ConversationListResponse> => {
  const response = await axios.get('/conversations', { params });

  // 确保返回的数据有默认值，防止undefined错误
  const data = response.data;
  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || 1,
    page_size: data.page_size || 20,
    total_pages: data.total_pages || 0,
    statistics: {
      total: data.statistics?.total || 0,
      today: data.statistics?.today || 0,
      active: data.statistics?.active || 0,
      average_messages: data.statistics?.average_messages || 0,
      average_response_time: data.statistics?.average_response_time || 0,
      success_rate: data.statistics?.success_rate || 0,
    },
  };
};

/**
 * 获取对话详情
 */
export const fetchConversation = async (id: string): Promise<ConversationDetailResponse> => {
  const response = await axios.get<ConversationDetailResponse>(`/conversations/${id}`);
  return response.data;
};

/**
 * 获取对话消息
 */
export const fetchConversationMessages = async (
  conversationId: string,
  params: MessageQueryParams = {}
): Promise<MessageListResponse> => {
  const response = await axios.get<MessageListResponse>(`/conversations/${conversationId}/messages`, { params });
  return response.data;
};

/**
 * 获取对话统计信息
 */
export const fetchConversationStats = async (): Promise<ConversationStatistics> => {
  const response = await axios.get<ConversationStatistics>('/conversations/stats');
  return response.data;
};

// 兼容现有前端代码的转换函数
export const convertConversationData = (conversation: Record<string, unknown>): Conversation => {
  return {
    id: conversation.id?.toString() || '',
    agentId: conversation.agent_id?.toString() || '',
    agentName: (conversation.agent_name as string) || (conversation.agentName as string) || '',
    dootaskChatId: (conversation.dootask_chat_id as string) || '',
    dootaskUserId: (conversation.dootask_user_id as string) || '',
    userId: (conversation.dootask_user_id as string) || '',
    userName: (conversation.user_name as string) || (conversation.userName as string) || '',
    context: (conversation.context as Record<string, unknown>) || {},
    messagesCount: (conversation.message_count as number) || (conversation.messagesCount as number) || 0,
    createdAt: (conversation.created_at as string) || (conversation.createdAt as string) || '',
    updatedAt: (conversation.updated_at as string) || (conversation.updatedAt as string) || '',
    lastMessage: (conversation.last_message as Message) || (conversation.lastMessage as Message) || undefined,
  };
};

export const convertMessageData = (message: Record<string, unknown>): Message => {
  return {
    id: message.id?.toString() || '',
    conversationId: (message.conversation_id as string) || (message.conversationId as string) || '',
    role: (message.role as 'user' | 'assistant' | 'system') || 'user',
    content: (message.content as string) || '',
    metadata: (message.metadata as Record<string, unknown>) || {},
    responseTime: (message.response_time as number) || (message.responseTime as number) || undefined,
    createdAt: (message.created_at as string) || (message.createdAt as string) || '',
  };
};
