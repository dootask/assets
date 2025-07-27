package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// AssetStatus 资产状态枚举
type AssetStatus string

const (
	AssetStatusAvailable   AssetStatus = "available"   // 可用
	AssetStatusBorrowed    AssetStatus = "borrowed"    // 借用中
	AssetStatusMaintenance AssetStatus = "maintenance" // 维护中
	AssetStatusScrapped    AssetStatus = "scrapped"    // 已报废
)

// Asset 资产模型
type Asset struct {
	ID                  uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	AssetNo             string         `json:"asset_no" gorm:"size:100;uniqueIndex;not null" validate:"required,max=100"`
	Name                string         `json:"name" gorm:"size:200;not null" validate:"required,max=200"`
	CategoryID          uint           `json:"category_id" gorm:"not null;index" validate:"required"`
	DepartmentID        *uint          `json:"department_id" gorm:"index"`
	Brand               string         `json:"brand" gorm:"size:100" validate:"max=100"`
	Model               string         `json:"model" gorm:"size:100" validate:"max=100"`
	SerialNumber        string         `json:"serial_number" gorm:"size:100" validate:"max=100"`
	PurchaseDate        *time.Time     `json:"purchase_date" gorm:"type:date"`
	PurchasePrice       *float64       `json:"purchase_price" gorm:"type:decimal(12,2)"`
	Supplier            string         `json:"supplier" gorm:"size:200" validate:"max=200"`
	WarrantyPeriod      *int           `json:"warranty_period"` // 保修期（月）
	Status              AssetStatus    `json:"status" gorm:"size:20;default:available" validate:"oneof=available borrowed maintenance scrapped"`
	Location            string         `json:"location" gorm:"size:200" validate:"max=200"`
	ResponsiblePerson   string         `json:"responsible_person" gorm:"size:100" validate:"max=100"`
	Description         string         `json:"description" gorm:"type:text"`
	ImageURL            string         `json:"image_url" gorm:"size:500" validate:"max=500"`
	CustomAttributes    datatypes.JSON `json:"custom_attributes" gorm:"type:json"` // 自定义属性
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联关系
	Category      Category       `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Department    *Department    `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
	BorrowRecords []BorrowRecord `json:"borrow_records,omitempty" gorm:"foreignKey:AssetID"`
}

// TableName 指定表名
func (Asset) TableName() string {
	return "assets"
}

// BeforeCreate 创建前钩子
func (a *Asset) BeforeCreate(tx *gorm.DB) error {
	// 设置默认状态
	if a.Status == "" {
		a.Status = AssetStatusAvailable
	}
	return nil
}

// BeforeUpdate 更新前钩子
func (a *Asset) BeforeUpdate(tx *gorm.DB) error {
	// 可以在这里添加更新前的逻辑
	return nil
}

// BeforeDelete 删除前钩子
func (a *Asset) BeforeDelete(tx *gorm.DB) error {
	// 检查是否有未归还的借用记录
	var borrowCount int64
	if err := tx.Model(&BorrowRecord{}).Where("asset_id = ? AND status = ?", a.ID, BorrowStatusBorrowed).Count(&borrowCount).Error; err != nil {
		return err
	}
	if borrowCount > 0 {
		return gorm.ErrRecordNotFound // 可以自定义错误类型
	}

	return nil
}

// IsAvailable 检查资产是否可用
func (a *Asset) IsAvailable() bool {
	return a.Status == AssetStatusAvailable
}

// IsBorrowed 检查资产是否被借用
func (a *Asset) IsBorrowed() bool {
	return a.Status == AssetStatusBorrowed
}

// GetWarrantyEndDate 获取保修结束日期
func (a *Asset) GetWarrantyEndDate() *time.Time {
	if a.PurchaseDate == nil || a.WarrantyPeriod == nil {
		return nil
	}
	endDate := a.PurchaseDate.AddDate(0, *a.WarrantyPeriod, 0)
	return &endDate
}

// IsUnderWarranty 检查是否在保修期内
func (a *Asset) IsUnderWarranty() bool {
	endDate := a.GetWarrantyEndDate()
	if endDate == nil {
		return false
	}
	return time.Now().Before(*endDate)
}