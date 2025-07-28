package categories

import (
	"asset-management-system/server/models"
	"time"
)

// CategoryResponse 分类响应结构
type CategoryResponse struct {
	models.Category
	AssetCount int `json:"asset_count"`
}

// CategoryTreeResponse 分类树响应结构
type CategoryTreeResponse struct {
	ID          uint                   `json:"id"`
	Name        string                 `json:"name"`
	Code        string                 `json:"code"`
	ParentID    *uint                  `json:"parent_id"`
	Description string                 `json:"description"`
	Attributes  interface{}            `json:"attributes"`
	AssetCount  int                    `json:"asset_count"`
	Children    []CategoryTreeResponse `json:"children"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// CreateCategoryRequest 创建分类请求
type CreateCategoryRequest struct {
	Name        string      `json:"name" validate:"required,max=100"`
	Code        string      `json:"code" validate:"required,max=50"`
	ParentID    *uint       `json:"parent_id"`
	Description string      `json:"description"`
	Attributes  interface{} `json:"attributes"`
}

// UpdateCategoryRequest 更新分类请求
type UpdateCategoryRequest struct {
	Name        *string     `json:"name" validate:"omitempty,max=100"`
	Code        *string     `json:"code" validate:"omitempty,max=50"`
	ParentID    *uint       `json:"parent_id"`
	Description *string     `json:"description"`
	Attributes  interface{} `json:"attributes"`
}

// CategoryFilters 分类筛选条件
type CategoryFilters struct {
	Name     *string `json:"name" form:"name"`
	Code     *string `json:"code" form:"code"`
	ParentID *uint   `json:"parent_id" form:"parent_id"`
}
