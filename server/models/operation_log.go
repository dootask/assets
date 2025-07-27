package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// OperationType 操作类型枚举
type OperationType string

const (
	OperationTypeCreate OperationType = "create" // 创建
	OperationTypeUpdate OperationType = "update" // 更新
	OperationTypeDelete OperationType = "delete" // 删除
)

// OperationLog 操作日志模型
type OperationLog struct {
	ID         uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Table      string         `json:"table_name" gorm:"column:table_name;size:50;not null;index" validate:"required,max=50"`
	RecordID   uint           `json:"record_id" gorm:"not null;index" validate:"required"`
	Operation  OperationType  `json:"operation" gorm:"size:20;not null" validate:"required,oneof=create update delete"`
	OldData    datatypes.JSON `json:"old_data" gorm:"type:json"`
	NewData    datatypes.JSON `json:"new_data" gorm:"type:json"`
	Operator   string         `json:"operator" gorm:"size:100" validate:"max=100"`
	IPAddress  string         `json:"ip_address" gorm:"size:45" validate:"max=45"`
	UserAgent  string         `json:"user_agent" gorm:"type:text"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (OperationLog) TableName() string {
	return "operation_logs"
}

// BeforeCreate 创建前钩子
func (ol *OperationLog) BeforeCreate(tx *gorm.DB) error {
	// 操作日志不需要特殊处理
	return nil
}

// SystemConfig 系统配置模型
type SystemConfig struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	ConfigKey    string         `json:"config_key" gorm:"size:100;uniqueIndex;not null" validate:"required,max=100"`
	ConfigValue  string         `json:"config_value" gorm:"type:text"`
	Description  string         `json:"description" gorm:"type:text"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (SystemConfig) TableName() string {
	return "system_configs"
}

// BeforeCreate 创建前钩子
func (sc *SystemConfig) BeforeCreate(tx *gorm.DB) error {
	// 系统配置不需要特殊处理
	return nil
}