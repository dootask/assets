package inventory

import (
	"time"

	"asset-management-system/server/models"
)

// CreateInventoryTaskRequest 创建盘点任务请求
type CreateInventoryTaskRequest struct {
	TaskName    string                      `json:"task_name" validate:"required,max=200"`
	TaskType    models.InventoryTaskType    `json:"task_type" validate:"required,oneof=full category department"`
	ScopeFilter models.InventoryScopeFilter `json:"scope_filter"`
	StartDate   *time.Time                  `json:"start_date"`
	EndDate     *time.Time                  `json:"end_date"`
	CreatedBy   string                      `json:"created_by" validate:"max=100"`
	Notes       string                      `json:"notes"`
}

// UpdateInventoryTaskRequest 更新盘点任务请求
type UpdateInventoryTaskRequest struct {
	TaskName  string                   `json:"task_name" validate:"max=200"`
	Status    models.InventoryTaskStatus `json:"status" validate:"oneof=pending in_progress completed"`
	StartDate *time.Time               `json:"start_date"`
	EndDate   *time.Time               `json:"end_date"`
	Notes     string                   `json:"notes"`
}

// CreateInventoryRecordRequest 创建盘点记录请求
type CreateInventoryRecordRequest struct {
	TaskID         uint                    `json:"task_id" validate:"required"`
	AssetID        uint                    `json:"asset_id" validate:"required"`
	ActualStatus   models.AssetStatus      `json:"actual_status" validate:"required"`
	Result         models.InventoryResult  `json:"result" validate:"required,oneof=normal surplus deficit damaged"`
	Notes          string                  `json:"notes"`
	CheckedBy      string                  `json:"checked_by" validate:"max=100"`
}

// BatchCreateInventoryRecordsRequest 批量创建盘点记录请求
type BatchCreateInventoryRecordsRequest struct {
	Records []CreateInventoryRecordRequest `json:"records" validate:"required,dive"`
}

// InventoryTaskListQuery 盘点任务列表查询参数
type InventoryTaskListQuery struct {
	Page     int                         `form:"page" validate:"min=1"`
	PageSize int                         `form:"page_size" validate:"min=1,max=100"`
	Status   models.InventoryTaskStatus  `form:"status"`
	TaskType models.InventoryTaskType    `form:"task_type"`
	Keyword  string                      `form:"keyword"`
}

// InventoryRecordListQuery 盘点记录列表查询参数
type InventoryRecordListQuery struct {
	Page     int                    `form:"page" validate:"min=1"`
	PageSize int                    `form:"page_size" validate:"min=1,max=100"`
	TaskID   uint                   `form:"task_id"`
	Result   models.InventoryResult `form:"result"`
	Keyword  string                 `form:"keyword"`
}

// InventoryTaskResponse 盘点任务响应
type InventoryTaskResponse struct {
	*models.InventoryTask
	TotalAssets    int64 `json:"total_assets"`    // 总资产数
	CheckedAssets  int64 `json:"checked_assets"`  // 已盘点资产数
	NormalAssets   int64 `json:"normal_assets"`   // 正常资产数
	SurplusAssets  int64 `json:"surplus_assets"`  // 盘盈资产数
	DeficitAssets  int64 `json:"deficit_assets"`  // 盘亏资产数
	DamagedAssets  int64 `json:"damaged_assets"`  // 损坏资产数
	Progress       float64 `json:"progress"`      // 盘点进度百分比
}

// InventoryReportResponse 盘点报告响应
type InventoryReportResponse struct {
	Task           *models.InventoryTask `json:"task"`
	Summary        InventoryTaskResponse `json:"summary"`
	Records        []models.InventoryRecord `json:"records"`
	CategoryStats  []CategoryInventoryStats `json:"category_stats"`
	DepartmentStats []DepartmentInventoryStats `json:"department_stats"`
}

// CategoryInventoryStats 分类盘点统计
type CategoryInventoryStats struct {
	CategoryID    uint   `json:"category_id"`
	CategoryName  string `json:"category_name"`
	TotalAssets   int64  `json:"total_assets"`
	CheckedAssets int64  `json:"checked_assets"`
	NormalAssets  int64  `json:"normal_assets"`
	SurplusAssets int64  `json:"surplus_assets"`
	DeficitAssets int64  `json:"deficit_assets"`
	DamagedAssets int64  `json:"damaged_assets"`
}

// DepartmentInventoryStats 部门盘点统计
type DepartmentInventoryStats struct {
	DepartmentID   uint   `json:"department_id"`
	DepartmentName string `json:"department_name"`
	TotalAssets    int64  `json:"total_assets"`
	CheckedAssets  int64  `json:"checked_assets"`
	NormalAssets   int64  `json:"normal_assets"`
	SurplusAssets  int64  `json:"surplus_assets"`
	DeficitAssets  int64  `json:"deficit_assets"`
	DamagedAssets  int64  `json:"damaged_assets"`
}