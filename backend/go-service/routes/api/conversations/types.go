package conversations

import (
	"encoding/json"
	"time"
)

// Conversation 对话模型
type Conversation struct {
	ID            int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	AgentID       int64           `gorm:"column:agent_id;not null" json:"agent_id"`
	DootaskChatID string          `gorm:"column:dootask_chat_id;type:varchar(255);not null" json:"dootask_chat_id"`
	DootaskUserID string          `gorm:"column:dootask_user_id;type:varchar(255);not null" json:"dootask_user_id"`
	Context       json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"context"`
	IsActive      bool            `gorm:"column:is_active;default:true" json:"is_active"`
	CreatedAt     time.Time       `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time       `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// 关联模型
	Agent        *Agent    `gorm:"foreignKey:AgentID" json:"agent,omitempty"`
	Messages     []Message `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
	MessageCount int64     `gorm:"-" json:"message_count,omitempty"`

	// 前端兼容字段
	AgentName   string   `gorm:"-" json:"agent_name,omitempty"`
	UserName    string   `gorm:"-" json:"user_name,omitempty"`
	LastMessage *Message `gorm:"-" json:"last_message,omitempty"`
}

// Message 消息模型
type Message struct {
	ID             int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	ConversationID int64           `gorm:"column:conversation_id;not null" json:"conversation_id"`
	Role           string          `gorm:"type:varchar(20);not null" json:"role"`
	Content        string          `gorm:"type:text;not null" json:"content"`
	Metadata       json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	TokensUsed     int             `gorm:"column:tokens_used;default:0" json:"tokens_used"`
	ModelUsed      *string         `gorm:"column:model_used;type:varchar(100)" json:"model_used"`
	CreatedAt      time.Time       `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// 前端兼容字段
	ResponseTime *float64 `gorm:"-" json:"response_time,omitempty"`
}

// Agent 智能体简化模型
type Agent struct {
	ID   int64  `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
}

// TableName 指定表名
func (Conversation) TableName() string {
	return "conversations"
}

func (Message) TableName() string {
	return "messages"
}

// ConversationQueryParams 对话查询参数
type ConversationQueryParams struct {
	Page      int     `form:"page,default=1" validate:"min=1"`
	PageSize  int     `form:"page_size,default=20" validate:"min=1,max=100"`
	Search    string  `form:"search"`
	AgentID   *int64  `form:"agent_id"`
	IsActive  *bool   `form:"is_active"`
	UserID    string  `form:"user_id"`
	OrderBy   string  `form:"order_by,default=created_at"`
	OrderDir  string  `form:"order_dir,default=desc" validate:"oneof=asc desc"`
	StartDate *string `form:"start_date"`
	EndDate   *string `form:"end_date"`
}

// MessageQueryParams 消息查询参数
type MessageQueryParams struct {
	Page     int    `form:"page,default=1" validate:"min=1"`
	PageSize int    `form:"page_size,default=50" validate:"min=1,max=200"`
	Role     string `form:"role" validate:"omitempty,oneof=user assistant system"`
	OrderBy  string `form:"order_by,default=created_at"`
	OrderDir string `form:"order_dir,default=asc" validate:"oneof=asc desc"`
}

// ConversationListResponse 对话列表响应
type ConversationListResponse struct {
	Items      []Conversation         `json:"items"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"page_size"`
	TotalPages int                    `json:"total_pages"`
	Statistics ConversationStatistics `json:"statistics"`
}

// MessageListResponse 消息列表响应
type MessageListResponse struct {
	Items      []Message `json:"items"`
	Total      int64     `json:"total"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
	TotalPages int       `json:"total_pages"`
}

// ConversationDetailResponse 对话详情响应
type ConversationDetailResponse struct {
	*Conversation
	TotalMessages       int64     `json:"total_messages"`
	AverageResponseTime float64   `json:"average_response_time"`
	TotalTokensUsed     int64     `json:"total_tokens_used"`
	LastActivity        time.Time `json:"last_activity"`
}

// ConversationStatistics 对话统计信息
type ConversationStatistics struct {
	Total               int64   `json:"total"`
	Today               int64   `json:"today"`
	Active              int64   `json:"active"`
	AverageMessages     float64 `json:"average_messages"`
	AverageResponseTime float64 `json:"average_response_time"`
	SuccessRate         float64 `json:"success_rate"`
}

// GetOrderBy 获取排序字段
func (p *ConversationQueryParams) GetOrderBy() string {
	allowedFields := map[string]bool{
		"id":         true,
		"agent_id":   true,
		"created_at": true,
		"updated_at": true,
	}

	if allowedFields[p.OrderBy] {
		return p.OrderBy
	}
	return "created_at"
}

// GetOrderBy 获取消息排序字段
func (p *MessageQueryParams) GetOrderBy() string {
	allowedFields := map[string]bool{
		"id":         true,
		"created_at": true,
		"role":       true,
	}

	if allowedFields[p.OrderBy] {
		return p.OrderBy
	}
	return "created_at"
}
