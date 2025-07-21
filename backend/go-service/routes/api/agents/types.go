package agents

import (
	"encoding/json"
	"time"
)

// Agent 智能体模型
type Agent struct {
	ID             int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string          `gorm:"type:varchar(255);not null" json:"name" validate:"required,max=255"`
	Description    *string         `gorm:"type:text" json:"description"`
	Prompt         string          `gorm:"type:text;not null" json:"prompt" validate:"required"`
	AIModelID      *int64          `gorm:"column:ai_model_id" json:"ai_model_id"`
	Temperature    float64         `gorm:"type:decimal(3,2);default:0.7" json:"temperature" validate:"min=0,max=2"`
	Tools          json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"tools"`
	KnowledgeBases json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"knowledge_bases"`
	Metadata       json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsActive       bool            `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// 关联查询字段
	AIModelName     *string `gorm:"-" json:"ai_model_name,omitempty"`
	AIModelProvider *string `gorm:"-" json:"ai_model_provider,omitempty"`
}

// TableName 指定表名
func (Agent) TableName() string {
	return "agents"
}

// CreateAgentRequest 创建智能体请求
type CreateAgentRequest struct {
	Name           string          `json:"name" validate:"required,max=255"`
	Description    *string         `json:"description"`
	Prompt         string          `json:"prompt" validate:"required"`
	AIModelID      *int64          `json:"ai_model_id"`
	Temperature    float64         `json:"temperature" validate:"min=0,max=2"`
	Tools          json.RawMessage `json:"tools"`
	KnowledgeBases json.RawMessage `json:"knowledge_bases"`
	Metadata       json.RawMessage `json:"metadata"`
}

// UpdateAgentRequest 更新智能体请求
type UpdateAgentRequest struct {
	Name           *string         `json:"name" validate:"omitempty,max=255"`
	Description    *string         `json:"description"`
	Prompt         *string         `json:"prompt"`
	AIModelID      *int64          `json:"ai_model_id"`
	Temperature    *float64        `json:"temperature" validate:"omitempty,min=0,max=2"`
	Tools          json.RawMessage `json:"tools"`
	KnowledgeBases json.RawMessage `json:"knowledge_bases"`
	Metadata       json.RawMessage `json:"metadata"`
	IsActive       *bool           `json:"is_active"`
}

// AgentListResponse 智能体列表响应
type AgentListResponse struct {
	Items      []Agent `json:"items"`
	Total      int64   `json:"total"`
	Page       int     `json:"page"`
	PageSize   int     `json:"page_size"`
	TotalPages int     `json:"total_pages"`
}

// AgentResponse 智能体详情响应
type AgentResponse struct {
	*Agent
	// 统计信息
	ConversationCount int64 `json:"conversation_count"`
	MessageCount      int64 `json:"message_count"`
	TokenUsage        int64 `json:"token_usage"`
}

// AgentQueryParams 智能体查询参数
type AgentQueryParams struct {
	Page      int    `form:"page,default=1" validate:"min=1"`
	PageSize  int    `form:"page_size,default=20" validate:"min=1,max=100"`
	Search    string `form:"search"`
	AIModelID *int64 `form:"ai_model_id"`
	IsActive  *bool  `form:"is_active"`
	OrderBy   string `form:"order_by,default=created_at"`
	OrderDir  string `form:"order_dir,default=desc" validate:"oneof=asc desc"`
}

// GetOrderBy 获取排序字段
func (p *AgentQueryParams) GetOrderBy() string {
	allowedFields := map[string]bool{
		"id":         true,
		"name":       true,
		"created_at": true,
		"updated_at": true,
	}

	if allowedFields[p.OrderBy] {
		return p.OrderBy
	}
	return "created_at"
}
