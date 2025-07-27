package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Category 资产分类模型
type Category struct {
	ID          uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string         `json:"name" gorm:"size:100;not null" validate:"required,max=100"`
	Code        string         `json:"code" gorm:"size:50;uniqueIndex;not null" validate:"required,max=50"`
	ParentID    *uint          `json:"parent_id" gorm:"index"`
	Description string         `json:"description" gorm:"type:text"`
	Attributes  datatypes.JSON `json:"attributes" gorm:"type:json"` // 分类特定属性模板
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联关系
	Parent   *Category  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Assets   []Asset    `json:"assets,omitempty" gorm:"foreignKey:CategoryID"`
}

// TableName 指定表名
func (Category) TableName() string {
	return "categories"
}

// BeforeCreate 创建前钩子
func (c *Category) BeforeCreate(tx *gorm.DB) error {
	// 可以在这里添加创建前的逻辑，比如生成编码等
	return nil
}

// BeforeUpdate 更新前钩子
func (c *Category) BeforeUpdate(tx *gorm.DB) error {
	// 可以在这里添加更新前的逻辑
	return nil
}

// BeforeDelete 删除前钩子
func (c *Category) BeforeDelete(tx *gorm.DB) error {
	// 检查是否有子分类
	var childCount int64
	if err := tx.Model(&Category{}).Where("parent_id = ?", c.ID).Count(&childCount).Error; err != nil {
		return err
	}
	if childCount > 0 {
		return gorm.ErrRecordNotFound // 可以自定义错误类型
	}

	// 检查是否有关联资产
	var assetCount int64
	if err := tx.Model(&Asset{}).Where("category_id = ?", c.ID).Count(&assetCount).Error; err != nil {
		return err
	}
	if assetCount > 0 {
		return gorm.ErrRecordNotFound // 可以自定义错误类型
	}

	return nil
}

// CategoryAttributes 分类属性模板结构
type CategoryAttributes struct {
	Fields []CategoryField `json:"fields"`
}

// CategoryField 分类字段定义
type CategoryField struct {
	Name        string      `json:"name"`
	Label       string      `json:"label"`
	Type        string      `json:"type"` // text, number, date, select, boolean
	Required    bool        `json:"required"`
	Options     []string    `json:"options,omitempty"` // 用于select类型
	DefaultValue interface{} `json:"default_value,omitempty"`
}