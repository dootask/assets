package aimodels

import (
	"time"
)

// AIModel AI模型数据结构
type AIModel struct {
	ID          int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"type:varchar(255);not null" validate:"required,min=1,max=255"`
	Provider    string    `json:"provider" gorm:"type:varchar(100);not null" validate:"required,oneof=openai anthropic google azure local"`
	ModelName   string    `json:"model_name" gorm:"type:varchar(255);not null" validate:"required,min=1,max=255"`
	ApiKey      *string   `json:"api_key,omitempty" gorm:"type:text"`
	BaseURL     string    `json:"base_url" gorm:"type:varchar(500)" validate:"omitempty,url"`
	MaxTokens   int       `json:"max_tokens" gorm:"default:4000" validate:"min=1,max=100000"`
	Temperature float32   `json:"temperature" gorm:"type:decimal(3,2);default:0.7" validate:"min=0,max=2"`
	IsEnabled   bool      `json:"is_enabled" gorm:"default:true"`
	IsDefault   bool      `json:"is_default" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 设置表名
func (AIModel) TableName() string {
	return "ai_models"
}

// CreateAIModelRequest 创建AI模型请求
type CreateAIModelRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=255"`
	Provider    string  `json:"provider" validate:"required,oneof=openai anthropic google azure local"`
	ModelName   string  `json:"model_name" validate:"required,min=1,max=255"`
	ApiKey      *string `json:"api_key,omitempty"`
	BaseURL     string  `json:"base_url" validate:"omitempty,url"`
	MaxTokens   int     `json:"max_tokens" validate:"min=1,max=100000"`
	Temperature float32 `json:"temperature" validate:"min=0,max=2"`
	IsEnabled   bool    `json:"is_enabled"`
	IsDefault   bool    `json:"is_default"`
}

// UpdateAIModelRequest 更新AI模型请求
type UpdateAIModelRequest struct {
	Name        *string  `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Provider    *string  `json:"provider,omitempty" validate:"omitempty,oneof=openai anthropic google azure local"`
	ModelName   *string  `json:"model_name,omitempty" validate:"omitempty,min=1,max=255"`
	ApiKey      *string  `json:"api_key,omitempty"`
	BaseURL     *string  `json:"base_url,omitempty" validate:"omitempty,url"`
	MaxTokens   *int     `json:"max_tokens,omitempty" validate:"omitempty,min=1,max=100000"`
	Temperature *float32 `json:"temperature,omitempty" validate:"omitempty,min=0,max=2"`
	IsEnabled   *bool    `json:"is_enabled,omitempty"`
	IsDefault   *bool    `json:"is_default,omitempty"`
}

// AIModelListResponse AI模型列表响应
type AIModelListResponse struct {
	Success bool        `json:"success"`
	Data    AIModelList `json:"data"`
}

// AIModelList AI模型列表数据
type AIModelList struct {
	Models     []AIModel `json:"models"`
	Total      int64     `json:"total"`
	Page       int       `json:"page"`
	Size       int       `json:"size"`
	TotalPages int       `json:"total_pages"`
}

// AIModelResponse 单个AI模型响应
type AIModelResponse struct {
	Success bool    `json:"success"`
	Data    AIModel `json:"data"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
}
