package models

import (
	"time"

	"gorm.io/gorm"
)

// Department 部门模型
type Department struct {
	ID          uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string         `json:"name" gorm:"size:100;not null" validate:"required,max=100"`
	Code        string         `json:"code" gorm:"size:50;index;not null" validate:"required,max=50"`
	Manager     string         `json:"manager" gorm:"size:100" validate:"max=100"`
	Contact     string         `json:"contact" gorm:"size:100" validate:"max=100"`
	Description string         `json:"description" gorm:"type:text"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联关系
	Assets        []Asset        `json:"assets,omitempty" gorm:"foreignKey:DepartmentID"`
	BorrowRecords []BorrowRecord `json:"borrow_records,omitempty" gorm:"foreignKey:DepartmentID"`
}

// TableName 指定表名
func (Department) TableName() string {
	return "departments"
}

// BeforeCreate 创建前钩子
func (d *Department) BeforeCreate(tx *gorm.DB) error {
	// 可以在这里添加创建前的逻辑
	return nil
}

// BeforeUpdate 更新前钩子
func (d *Department) BeforeUpdate(tx *gorm.DB) error {
	// 可以在这里添加更新前的逻辑
	return nil
}

// BeforeDelete 删除前钩子
func (d *Department) BeforeDelete(tx *gorm.DB) error {
	// 检查是否有关联资产
	var assetCount int64
	if err := tx.Model(&Asset{}).Where("department_id = ?", d.ID).Count(&assetCount).Error; err != nil {
		return err
	}
	if assetCount > 0 {
		return gorm.ErrRecordNotFound // 可以自定义错误类型
	}

	return nil
}
