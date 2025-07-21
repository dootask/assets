import axios from '@/lib/axios';
import { DashboardStats } from '@/lib/types';

// 系统状态接口
export interface SystemStatus {
  go_service: ServiceStatus;
  python_service: ServiceStatus;
  database: ServiceStatus;
  webhook: ServiceStatus;
}

// 服务状态接口
export interface ServiceStatus {
  status: string;
  uptime: number;
  last_check: string;
  details?: string;
}

// 最近活动接口
export interface RecentActivity {
  recent_agents: RecentAgent[];
  recent_conversations: RecentConversation[];
}

// 最近智能体接口
export interface RecentAgent {
  id: number;
  name: string;
  is_active: boolean;
  today_messages: number;
  last_used: string;
}

// 最近对话接口
export interface RecentConversation {
  id: number;
  user_name: string;
  agent_name: string;
  messages_count: number;
  last_activity: string;
}

// 系统健康检查响应接口
export interface SystemHealthResponse {
  status: string;
  services: Record<string, ServiceStatus>;
  summary: SystemHealthSummary;
}

// 系统健康汇总接口
export interface SystemHealthSummary {
  healthy_services: number;
  total_services: number;
  overall_score: number;
  issues?: string[];
}

/**
 * 获取仪表板统计数据
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axios.get('/dashboard/stats');

  // 后端返回的是snake_case字段名，需要转换为前端期望的camelCase
  const data = response.data;
  return {
    agents: {
      total: data.agents?.total || 0,
      active: data.agents?.active || 0,
      inactive: data.agents?.inactive || 0,
    },
    conversations: {
      total: data.conversations?.total || 0,
      today: data.conversations?.today || 0,
      active: data.conversations?.active || 0,
    },
    messages: {
      total: data.messages?.total || 0,
      today: data.messages?.today || 0,
      averageResponseTime: data.messages?.average_response_time || 0,
    },
    knowledgeBases: {
      total: data.knowledge_bases?.total || 0,
      documentsCount: data.knowledge_bases?.documents_count || 0,
    },
    mcpTools: {
      total: data.mcp_tools?.total || 0,
      active: data.mcp_tools?.active || 0,
    },
    systemStatus: {
      goService: data.system_status?.go_service?.status === 'online' ? 'online' : 'offline',
      pythonService: data.system_status?.python_service?.status === 'online' ? 'online' : 'offline',
      database: data.system_status?.database?.status === 'online' ? 'online' : 'offline',
      webhook: data.system_status?.webhook?.status === 'connected' ? 'connected' : 'disconnected',
    },
  };
};

/**
 * 获取系统状态
 */
export const fetchSystemStatus = async (): Promise<SystemStatus> => {
  const response = await axios.get<SystemStatus>('/dashboard/system-status');
  return response.data;
};

/**
 * 获取最近活动
 */
export const fetchRecentActivity = async (): Promise<RecentActivity> => {
  const response = await axios.get<RecentActivity>('/dashboard/recent-activity');
  return response.data;
};

/**
 * 获取系统健康检查
 */
export const fetchSystemHealth = async (): Promise<SystemHealthResponse> => {
  const response = await axios.get<SystemHealthResponse>('/dashboard/health');
  return response.data;
};
