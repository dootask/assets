package database

import (
	"asset-management-system/server/global"
	"fmt"
)

// CreateIndexes 创建数据库索引
func CreateIndexes() error {
	// 资产表索引
	assetIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_assets_asset_no ON assets(asset_no)",
		"CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id)",
		"CREATE INDEX IF NOT EXISTS idx_assets_department_id ON assets(department_id)",
		"CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status)",
		"CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at)",
		"CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON assets(purchase_date)",
		"CREATE INDEX IF NOT EXISTS idx_assets_responsible_person ON assets(responsible_person)",
	}

	// 分类表索引
	categoryIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code)",
		"CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)",
		"CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)",
	}

	// 部门表索引
	departmentIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code)",
		"CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name)",
		"CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager)",
	}

	// 借用记录表索引
	borrowIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_borrow_records_asset_id ON borrow_records(asset_id)",
		"CREATE INDEX IF NOT EXISTS idx_borrow_records_department_id ON borrow_records(department_id)",
		"CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status)",
		"CREATE INDEX IF NOT EXISTS idx_borrow_records_borrow_date ON borrow_records(borrow_date)",
		"CREATE INDEX IF NOT EXISTS idx_borrow_records_expected_return_date ON borrow_records(expected_return_date)",
		"CREATE INDEX IF NOT EXISTS idx_borrow_records_borrower_name ON borrow_records(borrower_name)",
	}

	// 盘点任务表索引
	inventoryTaskIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_inventory_tasks_status ON inventory_tasks(status)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_tasks_task_type ON inventory_tasks(task_type)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_tasks_created_by ON inventory_tasks(created_by)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_tasks_start_date ON inventory_tasks(start_date)",
	}

	// 盘点记录表索引
	inventoryRecordIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_inventory_records_task_id ON inventory_records(task_id)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_records_asset_id ON inventory_records(asset_id)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_records_result ON inventory_records(result)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_records_checked_at ON inventory_records(checked_at)",
		"CREATE INDEX IF NOT EXISTS idx_inventory_records_checked_by ON inventory_records(checked_by)",
	}

	// 操作日志表索引
	operationLogIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_operation_logs_table_name ON operation_logs(table_name)",
		"CREATE INDEX IF NOT EXISTS idx_operation_logs_record_id ON operation_logs(record_id)",
		"CREATE INDEX IF NOT EXISTS idx_operation_logs_operation ON operation_logs(operation)",
		"CREATE INDEX IF NOT EXISTS idx_operation_logs_operator ON operation_logs(operator)",
		"CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at)",
		"CREATE INDEX IF NOT EXISTS idx_operation_logs_table_record ON operation_logs(table_name, record_id)",
	}

	// 系统配置表索引
	systemConfigIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_system_configs_config_key ON system_configs(config_key)",
	}

	// 合并所有索引
	allIndexes := append(assetIndexes, categoryIndexes...)
	allIndexes = append(allIndexes, departmentIndexes...)
	allIndexes = append(allIndexes, borrowIndexes...)
	allIndexes = append(allIndexes, inventoryTaskIndexes...)
	allIndexes = append(allIndexes, inventoryRecordIndexes...)
	allIndexes = append(allIndexes, operationLogIndexes...)
	allIndexes = append(allIndexes, systemConfigIndexes...)

	// 执行索引创建
	for _, indexSQL := range allIndexes {
		if err := global.DB.Exec(indexSQL).Error; err != nil {
			return fmt.Errorf("创建索引失败: %v, SQL: %s", err, indexSQL)
		}
	}

	fmt.Println("数据库索引创建完成")
	return nil
}