package models

import "gorm.io/gorm"

// AllModels 返回所有需要迁移的模型
func AllModels() []interface{} {
	return []interface{}{
		&Category{},
		&Department{},
		&Asset{},
		&BorrowRecord{},
		&InventoryTask{},
		&InventoryRecord{},
		&OperationLog{},
		&SystemConfig{},
		&ReportRecord{},
	}
}

// AutoMigrate 自动迁移所有模型
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(AllModels()...)
}
