package dashboard

import (
	"time"
)

// DashboardStats 仪表板统计数据
type DashboardStats struct {
	Agents         AgentStats         `json:"agents"`
	Conversations  ConversationStats  `json:"conversations"`
	Messages       MessageStats       `json:"messages"`
	KnowledgeBases KnowledgeBaseStats `json:"knowledge_bases"`
	MCPTools       MCPToolStats       `json:"mcp_tools"`
	SystemStatus   SystemStatusInfo   `json:"system_status"`
	LastUpdated    time.Time          `json:"last_updated"`
}

// AgentStats 智能体统计
type AgentStats struct {
	Total    int64 `json:"total"`
	Active   int64 `json:"active"`
	Inactive int64 `json:"inactive"`
}

// ConversationStats 对话统计
type ConversationStats struct {
	Total  int64 `json:"total"`
	Today  int64 `json:"today"`
	Active int64 `json:"active"`
}

// MessageStats 消息统计
type MessageStats struct {
	Total               int64   `json:"total"`
	Today               int64   `json:"today"`
	AverageResponseTime float64 `json:"average_response_time"`
}

// KnowledgeBaseStats 知识库统计
type KnowledgeBaseStats struct {
	Total          int64 `json:"total"`
	DocumentsCount int64 `json:"documents_count"`
}

// MCPToolStats MCP工具统计
type MCPToolStats struct {
	Total  int64 `json:"total"`
	Active int64 `json:"active"`
}

// SystemStatusInfo 系统状态信息
type SystemStatusInfo struct {
	GoService     ServiceStatus `json:"go_service"`
	PythonService ServiceStatus `json:"python_service"`
	Database      ServiceStatus `json:"database"`
	Webhook       ServiceStatus `json:"webhook"`
}

// ServiceStatus 服务状态
type ServiceStatus struct {
	Status    string    `json:"status"` // online, offline, error
	Uptime    int64     `json:"uptime"` // 运行时间（秒）
	LastCheck time.Time `json:"last_check"`
	Details   string    `json:"details,omitempty"`
}

// RecentActivity 最近活动
type RecentActivity struct {
	RecentAgents        []RecentAgent        `json:"recent_agents"`
	RecentConversations []RecentConversation `json:"recent_conversations"`
}

// RecentAgent 最近智能体活动
type RecentAgent struct {
	ID            int64     `json:"id"`
	Name          string    `json:"name"`
	IsActive      bool      `json:"is_active"`
	TodayMessages int64     `json:"today_messages"`
	LastUsed      time.Time `json:"last_used"`
}

// RecentConversation 最近对话
type RecentConversation struct {
	ID            int64     `json:"id"`
	UserName      string    `json:"user_name"`
	AgentName     string    `json:"agent_name"`
	MessagesCount int64     `json:"messages_count"`
	LastActivity  time.Time `json:"last_activity"`
}

// SystemHealthResponse 系统健康检查响应
type SystemHealthResponse struct {
	Status   string                   `json:"status"` // healthy, warning, error
	Services map[string]ServiceStatus `json:"services"`
	Summary  SystemHealthSummary      `json:"summary"`
}

// SystemHealthSummary 系统健康汇总
type SystemHealthSummary struct {
	HealthyServices int      `json:"healthy_services"`
	TotalServices   int      `json:"total_services"`
	OverallScore    int      `json:"overall_score"` // 0-100
	Issues          []string `json:"issues,omitempty"`
}
