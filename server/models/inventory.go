package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// InventoryTaskType 盘点任务类型枚举
type InventoryTaskType string

const (
	InventoryTaskTypeFull       InventoryTaskType = "full"       // 全盘
	InventoryTaskTypeCategory   InventoryTaskType = "category"   // 按分类盘点
	InventoryTaskTypeDepartment InventoryTaskType = "department" // 按部门盘点
)

// InventoryTaskStatus 盘点任务状态枚举
type InventoryTaskStatus string

const (
	InventoryTaskStatusPending    InventoryTaskStatus = "pending"     // 待开始
	InventoryTaskStatusInProgress InventoryTaskStatus = "in_progress" // 进行中
	InventoryTaskStatusCompleted  InventoryTaskStatus = "completed"   // 已完成
)

// InventoryTask 盘点任务模型
type InventoryTask struct {
	ID          uint                    `json:"id" gorm:"primaryKey;autoIncrement"`
	TaskName    string                  `json:"task_name" gorm:"size:200;not null" validate:"required,max=200"`
	TaskType    InventoryTaskType       `json:"task_type" gorm:"size:50;default:full" validate:"oneof=full category department"`
	ScopeFilter datatypes.JSON          `json:"scope_filter" gorm:"type:json"` // 盘点范围过滤条件
	Status      InventoryTaskStatus     `json:"status" gorm:"size:20;default:pending" validate:"oneof=pending in_progress completed"`
	StartDate   *time.Time              `json:"start_date"`
	EndDate     *time.Time              `json:"end_date"`
	CreatedBy   string                  `json:"created_by" gorm:"size:100" validate:"max=100"`
	Notes       string                  `json:"notes" gorm:"type:text"`
	CreatedAt   time.Time               `json:"created_at"`
	UpdatedAt   time.Time               `json:"updated_at"`
	DeletedAt   gorm.DeletedAt          `json:"-" gorm:"index"`

	// 关联关系
	Records []InventoryRecord `json:"records,omitempty" gorm:"foreignKey:TaskID"`
}

// TableName 指定表名
func (InventoryTask) TableName() string {
	return "inventory_tasks"
}

// BeforeCreate 创建前钩子
func (it *InventoryTask) BeforeCreate(tx *gorm.DB) error {
	// 设置默认状态
	if it.Status == "" {
		it.Status = InventoryTaskStatusPending
	}
	
	// 设置默认任务类型
	if it.TaskType == "" {
		it.TaskType = InventoryTaskTypeFull
	}
	
	return nil
}

// InventoryResult 盘点结果枚举
type InventoryResult string

const (
	InventoryResultNormal  InventoryResult = "normal"  // 正常
	InventoryResultSurplus InventoryResult = "surplus" // 盘盈
	InventoryResultDeficit InventoryResult = "deficit" // 盘亏
	InventoryResultDamaged InventoryResult = "damaged" // 损坏
)

// InventoryRecord 盘点记录模型
type InventoryRecord struct {
	ID             uint            `json:"id" gorm:"primaryKey;autoIncrement"`
	TaskID         uint            `json:"task_id" gorm:"not null;index" validate:"required"`
	AssetID        uint            `json:"asset_id" gorm:"not null;index" validate:"required"`
	ExpectedStatus AssetStatus     `json:"expected_status" gorm:"size:20"` // 系统中的状态
	ActualStatus   AssetStatus     `json:"actual_status" gorm:"size:20"`   // 实际盘点状态
	Result         InventoryResult `json:"result" gorm:"size:20" validate:"oneof=normal surplus deficit damaged"`
	Notes          string          `json:"notes" gorm:"type:text"`
	CheckedAt      *time.Time      `json:"checked_at"`
	CheckedBy      string          `json:"checked_by" gorm:"size:100" validate:"max=100"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	DeletedAt      gorm.DeletedAt  `json:"-" gorm:"index"`

	// 关联关系
	Task  InventoryTask `json:"task,omitempty" gorm:"foreignKey:TaskID"`
	Asset Asset         `json:"asset,omitempty" gorm:"foreignKey:AssetID"`
}

// TableName 指定表名
func (InventoryRecord) TableName() string {
	return "inventory_records"
}

// BeforeCreate 创建前钩子
func (ir *InventoryRecord) BeforeCreate(tx *gorm.DB) error {
	// 设置默认盘点时间
	if ir.CheckedAt == nil {
		now := time.Now()
		ir.CheckedAt = &now
	}
	
	return nil
}

// InventoryScopeFilter 盘点范围过滤条件结构
type InventoryScopeFilter struct {
	CategoryIDs    []uint `json:"category_ids,omitempty"`
	DepartmentIDs  []uint `json:"department_ids,omitempty"`
	AssetStatuses  []AssetStatus `json:"asset_statuses,omitempty"`
	LocationFilter string `json:"location_filter,omitempty"`
}