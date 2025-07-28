package departments

import (
	"asset-management-system/server/models"
)

// CreateDepartmentRequest 创建部门请求
type CreateDepartmentRequest struct {
	Name        string `json:"name" validate:"required,max=100"`
	Code        string `json:"code" validate:"required,max=50"`
	Manager     string `json:"manager" validate:"max=100"`
	Contact     string `json:"contact" validate:"max=100"`
	Description string `json:"description"`
}

// UpdateDepartmentRequest 更新部门请求
type UpdateDepartmentRequest struct {
	Name        *string `json:"name" validate:"omitempty,max=100"`
	Code        *string `json:"code" validate:"omitempty,max=50"`
	Manager     *string `json:"manager" validate:"omitempty,max=100"`
	Contact     *string `json:"contact" validate:"omitempty,max=100"`
	Description *string `json:"description"`
}

// DepartmentResponse 部门响应
type DepartmentResponse struct {
	models.Department
	AssetCount int64 `json:"asset_count"`
}

// DepartmentFilters 部门筛选条件
type DepartmentFilters struct {
	Name    *string `json:"name" form:"name"`
	Code    *string `json:"code" form:"code"`
	Manager *string `json:"manager" form:"manager"`
}

// DepartmentStatsResponse 部门统计响应
type DepartmentStatsResponse struct {
	TotalAssets      int64            `json:"total_assets"`
	AssetsByStatus   map[string]int64 `json:"assets_by_status"`
	AssetsByCategory map[string]int64 `json:"assets_by_category"`
	RecentAssets     []models.Asset   `json:"recent_assets"`
}
