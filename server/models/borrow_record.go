package models

import (
	"time"

	"gorm.io/gorm"
)

// BorrowStatus 借用状态枚举
type BorrowStatus string

const (
	BorrowStatusBorrowed BorrowStatus = "borrowed" // 借用中
	BorrowStatusReturned BorrowStatus = "returned" // 已归还
	BorrowStatusOverdue  BorrowStatus = "overdue"  // 超期
)

// BorrowRecord 借用记录模型
type BorrowRecord struct {
	ID                   uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	AssetID              uint           `json:"asset_id" gorm:"not null;index" validate:"required"`
	BorrowerName         string         `json:"borrower_name" gorm:"size:100;not null" validate:"required,max=100"`
	BorrowerContact      string         `json:"borrower_contact" gorm:"size:100" validate:"max=100"`
	DepartmentID         *uint          `json:"department_id" gorm:"index"`
	BorrowDate           time.Time      `json:"borrow_date" gorm:"not null" validate:"required"`
	ExpectedReturnDate   *time.Time     `json:"expected_return_date"`
	ActualReturnDate     *time.Time     `json:"actual_return_date"`
	Status               BorrowStatus   `json:"status" gorm:"size:20;default:borrowed" validate:"oneof=borrowed returned overdue"`
	Purpose              string         `json:"purpose" gorm:"type:text"`
	Notes                string         `json:"notes" gorm:"type:text"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联关系
	Asset      Asset       `json:"asset,omitempty" gorm:"foreignKey:AssetID"`
	Department *Department `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
}

// TableName 指定表名
func (BorrowRecord) TableName() string {
	return "borrow_records"
}

// BeforeCreate 创建前钩子
func (br *BorrowRecord) BeforeCreate(tx *gorm.DB) error {
	// 设置默认状态
	if br.Status == "" {
		br.Status = BorrowStatusBorrowed
	}
	
	// 设置默认借用时间
	if br.BorrowDate.IsZero() {
		br.BorrowDate = time.Now()
	}
	
	return nil
}

// BeforeUpdate 更新前钩子
func (br *BorrowRecord) BeforeUpdate(tx *gorm.DB) error {
	// 如果设置了归还时间但状态还是借用中，自动更新状态
	if br.ActualReturnDate != nil && br.Status == BorrowStatusBorrowed {
		br.Status = BorrowStatusReturned
	}
	
	return nil
}

// AfterCreate 创建后钩子
func (br *BorrowRecord) AfterCreate(tx *gorm.DB) error {
	// 更新资产状态为借用中
	return tx.Model(&Asset{}).Where("id = ?", br.AssetID).Update("status", AssetStatusBorrowed).Error
}

// AfterUpdate 更新后钩子
func (br *BorrowRecord) AfterUpdate(tx *gorm.DB) error {
	// 如果归还了，更新资产状态为可用
	if br.Status == BorrowStatusReturned {
		return tx.Model(&Asset{}).Where("id = ?", br.AssetID).Update("status", AssetStatusAvailable).Error
	}
	return nil
}

// IsOverdue 检查是否超期
func (br *BorrowRecord) IsOverdue() bool {
	if br.ExpectedReturnDate == nil || br.ActualReturnDate != nil {
		return false
	}
	return time.Now().After(*br.ExpectedReturnDate)
}

// GetOverdueDays 获取超期天数
func (br *BorrowRecord) GetOverdueDays() int {
	if !br.IsOverdue() {
		return 0
	}
	return int(time.Since(*br.ExpectedReturnDate).Hours() / 24)
}

// Return 归还资产
func (br *BorrowRecord) Return(tx *gorm.DB) error {
	now := time.Now()
	br.ActualReturnDate = &now
	br.Status = BorrowStatusReturned
	return tx.Save(br).Error
}