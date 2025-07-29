package reports

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"gorm.io/gorm"
)

// getInventorySummary 获取盘点汇总数据
func getInventorySummary(query *gorm.DB) InventorySummary {
	var summary InventorySummary

	// 总任务数
	query.Count(&summary.TotalTasks)

	// 已完成任务数
	query.Where("status = ?", models.InventoryTaskStatusCompleted).Count(&summary.CompletedTasks)

	// 待开始任务数
	query.Where("status = ?", models.InventoryTaskStatusPending).Count(&summary.PendingTasks)

	// 进行中任务数
	query.Where("status = ?", models.InventoryTaskStatusInProgress).Count(&summary.InProgressTasks)

	// 总记录数
	global.DB.Model(&models.InventoryRecord{}).Count(&summary.TotalRecords)

	// 整体准确率
	var normalCount, totalRecords int64
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultNormal).Count(&normalCount)
	global.DB.Model(&models.InventoryRecord{}).Count(&totalRecords)

	if totalRecords > 0 {
		summary.AccuracyRate = float64(normalCount) / float64(totalRecords) * 100
	}

	return summary
}

// getInventoryTaskAnalysis 获取盘点任务分析
func getInventoryTaskAnalysis(query *gorm.DB) []InventoryTaskStats {
	var stats []InventoryTaskStats

	rows, err := query.Select(`
		it.id as task_id,
		it.name as task_name,
		it.task_type,
		it.status,
		it.start_date,
		it.end_date,
		COUNT(DISTINCT ir.asset_id) as total_assets,
		COUNT(ir.id) as checked_assets,
		SUM(CASE WHEN ir.result = 'normal' THEN 1 ELSE 0 END) as normal_count,
		SUM(CASE WHEN ir.result = 'surplus' THEN 1 ELSE 0 END) as surplus_count,
		SUM(CASE WHEN ir.result = 'deficit' THEN 1 ELSE 0 END) as deficit_count,
		SUM(CASE WHEN ir.result = 'damaged' THEN 1 ELSE 0 END) as damaged_count
	`).
		Table("inventory_tasks it").
		Joins("LEFT JOIN inventory_records ir ON ir.task_id = it.id").
		Group("it.id, it.name, it.task_type, it.status, it.start_date, it.end_date").
		Order("it.created_at DESC").
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat InventoryTaskStats
		rows.Scan(
			&stat.TaskID, &stat.TaskName, &stat.TaskType, &stat.Status,
			&stat.StartDate, &stat.EndDate, &stat.TotalAssets, &stat.CheckedAssets,
			&stat.NormalCount, &stat.SurplusCount, &stat.DeficitCount, &stat.DamagedCount,
		)

		// 计算准确率
		if stat.CheckedAssets > 0 {
			stat.AccuracyRate = float64(stat.NormalCount) / float64(stat.CheckedAssets) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getInventoryResultAnalysis 获取盘点结果分析
func getInventoryResultAnalysis() InventoryResultAnalysis {
	var analysis InventoryResultAnalysis

	// 各状态记录数
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultNormal).Count(&analysis.NormalCount)
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultSurplus).Count(&analysis.SurplusCount)
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultDeficit).Count(&analysis.DeficitCount)
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultDamaged).Count(&analysis.DamagedCount)

	// 总记录数
	totalRecords := analysis.NormalCount + analysis.SurplusCount + analysis.DeficitCount + analysis.DamagedCount

	// 计算比例
	if totalRecords > 0 {
		analysis.NormalRate = float64(analysis.NormalCount) / float64(totalRecords) * 100
		analysis.SurplusRate = float64(analysis.SurplusCount) / float64(totalRecords) * 100
		analysis.DeficitRate = float64(analysis.DeficitCount) / float64(totalRecords) * 100
		analysis.DamagedRate = float64(analysis.DamagedCount) / float64(totalRecords) * 100
	}

	return analysis
}

// getInventoryDepartmentAnalysis 获取部门盘点分析
func getInventoryDepartmentAnalysis() []InventoryDepartmentStats {
	var stats []InventoryDepartmentStats

	rows, err := global.DB.Raw(`
		SELECT 
			d.id as department_id,
			COALESCE(d.name, '未分配') as department_name,
			COUNT(DISTINCT a.id) as total_assets,
			COUNT(ir.id) as checked_assets,
			SUM(CASE WHEN ir.result = 'normal' THEN 1 ELSE 0 END) as normal_count,
			SUM(CASE WHEN ir.result != 'normal' THEN 1 ELSE 0 END) as issue_count
		FROM departments d
		LEFT JOIN assets a ON a.department_id = d.id
		LEFT JOIN inventory_records ir ON ir.asset_id = a.id
		GROUP BY d.id, d.name
		HAVING checked_assets > 0
		ORDER BY department_name
	`).Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat InventoryDepartmentStats
		var departmentID *uint
		rows.Scan(
			&departmentID, &stat.DepartmentName, &stat.TotalAssets,
			&stat.CheckedAssets, &stat.NormalCount, &stat.IssueCount,
		)
		stat.DepartmentID = departmentID

		// 计算准确率
		if stat.CheckedAssets > 0 {
			stat.AccuracyRate = float64(stat.NormalCount) / float64(stat.CheckedAssets) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getInventoryCategoryAnalysis 获取分类盘点分析
func getInventoryCategoryAnalysis() []InventoryCategoryStats {
	var stats []InventoryCategoryStats

	rows, err := global.DB.Raw(`
		SELECT 
			c.id as category_id,
			c.name as category_name,
			COUNT(DISTINCT a.id) as total_assets,
			COUNT(ir.id) as checked_assets,
			SUM(CASE WHEN ir.result = 'normal' THEN 1 ELSE 0 END) as normal_count,
			SUM(CASE WHEN ir.result != 'normal' THEN 1 ELSE 0 END) as issue_count
		FROM categories c
		LEFT JOIN assets a ON a.category_id = c.id
		LEFT JOIN inventory_records ir ON ir.asset_id = a.id
		GROUP BY c.id, c.name
		HAVING checked_assets > 0
		ORDER BY category_name
	`).Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat InventoryCategoryStats
		rows.Scan(
			&stat.CategoryID, &stat.CategoryName, &stat.TotalAssets,
			&stat.CheckedAssets, &stat.NormalCount, &stat.IssueCount,
		)

		// 计算准确率
		if stat.CheckedAssets > 0 {
			stat.AccuracyRate = float64(stat.NormalCount) / float64(stat.CheckedAssets) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getInventoryTrendAnalysis 获取盘点趋势分析
func getInventoryTrendAnalysis() []InventoryTrendStats {
	var stats []InventoryTrendStats

	// 获取最近12个月的盘点趋势
	rows, err := global.DB.Raw(`
		SELECT 
			strftime('%Y-%m', it.created_at) as month,
			COUNT(DISTINCT it.id) as task_count,
			CASE 
				WHEN COUNT(ir.id) > 0 THEN 
					CAST(SUM(CASE WHEN ir.result = 'normal' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ir.id) * 100
				ELSE 0
			END as accuracy_rate
		FROM inventory_tasks it
		LEFT JOIN inventory_records ir ON ir.task_id = it.id
		WHERE it.created_at >= date('now', '-12 months')
		GROUP BY strftime('%Y-%m', it.created_at)
		ORDER BY month DESC
	`).Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat InventoryTrendStats
		rows.Scan(&stat.Month, &stat.TaskCount, &stat.AccuracyRate)
		stats = append(stats, stat)
	}

	return stats
}
