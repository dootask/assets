import axios from '@/lib/axios';
import { ConversationFilters, ConversationListData, Message, PaginationRequest, PaginationResponse } from '@/lib/types';

// 消息筛选条件
export interface MessageFilters {
  role?: 'user' | 'assistant' | 'system';
}

// 消息列表数据
export interface MessageListData {
  items: Message[];
}

// 对话详情响应
export interface ConversationDetailResponse {
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
  totalMessages: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  lastActivity: string;
}

/**
 * 获取对话列表
 */
export const fetchConversations = async (
  params: Partial<PaginationRequest> & { filters?: ConversationFilters } = { page: 1, page_size: 12 }
): Promise<PaginationResponse<ConversationListData>> => {
  const defaultParams: PaginationRequest = {
    page: 1,
    page_size: 12,
    sorts: [{ key: 'created_at', desc: true }],
    filters: params.filters || {},
  };

  const requestParams = { ...defaultParams, ...params };
  const response = await axios.get<PaginationResponse<ConversationListData>>('/conversations', {
    params: requestParams,
  });

  return response.data;
};

/**
 * 获取对话详情
 */
export const fetchConversation = async (id: string): Promise<ConversationDetailResponse> => {
  const response = await axios.get<ConversationDetailResponse>(`/conversations/${id}`);
  return response.data;
};

/**
 * 获取对话消息列表
 */
export const fetchMessages = async (
  conversationId: string,
  params: Partial<PaginationRequest> & { filters?: MessageFilters } = { page: 1, page_size: 50 }
): Promise<PaginationResponse<MessageListData>> => {
  const defaultParams: PaginationRequest = {
    page: 1,
    page_size: 50,
    sorts: [{ key: 'created_at', desc: false }], // 消息默认升序排列
    filters: params.filters || {},
  };

  const requestParams = { ...defaultParams, ...params };
  const response = await axios.get<PaginationResponse<MessageListData>>(`/conversations/${conversationId}/messages`, {
    params: requestParams,
  });

  return response.data;
};

// 创建分页请求参数的辅助函数
export const createConversationListRequest = (
  page = 1,
  pageSize = 12,
  filters: Record<string, unknown> = {},
  sorts: { key: string; desc: boolean }[] = []
): PaginationRequest => {
  return {
    page,
    page_size: pageSize,
    sorts: sorts.length > 0 ? sorts : [{ key: 'created_at', desc: true }],
    filters,
  };
};
