package reports

import (
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"gorm.io/gorm"
)

// getInventorySummary 获取盘点汇总数据
func getInventorySummary(query *gorm.DB) InventorySummary {
	var summary InventorySummary
	
	// 总任务数
	query.Count(&summary.TotalTasks)
	
	// 各状态任务数
	query.Where("status = ?", models.InventoryTaskStatusCompleted).Count(&summary.CompletedTasks)
	query.Where("status = ?", models.InventoryTaskStatusPending).Count(&summary.PendingTasks)
	query.Where("status = ?", models.InventoryTaskStatusInProgress).Count(&summary.InProgressTasks)
	
	// 总记录数
	global.DB.Model(&models.InventoryRecord{}).Count(&summary.TotalRecords)
	
	// 准确率
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
		it.task_name,
		it.task_type,
		it.status,
		it.start_date,
		it.end_date
	`).
	Table("inventory_tasks it").
	Order("it.created_at DESC").
	Rows()
	
	if err != nil {
		return stats
	}
	defer rows.Close()
	
	for rows.Next() {
		var stat InventoryTaskStats
		rows.Scan(&stat.TaskID, &stat.TaskName, &stat.TaskType, &stat.Status, &stat.StartDate, &stat.EndDate)
		
		// 获取该任务的详细统计
		taskStats := getInventoryTaskDetailStats(stat.TaskID)
		stat.TotalAssets = taskStats.TotalAssets
		stat.CheckedAssets = taskStats.CheckedAssets
		stat.NormalCount = taskStats.NormalCount
		stat.SurplusCount = taskStats.SurplusCount
		stat.DeficitCount = taskStats.DeficitCount
		stat.DamagedCount = taskStats.DamagedCount
		stat.AccuracyRate = taskStats.AccuracyRate
		
		stats = append(stats, stat)
	}
	
	return stats
}

// getInventoryTaskDetailStats 获取盘点任务详细统计
func getInventoryTaskDetailStats(taskID uint) struct {
	TotalAssets  int64
	CheckedAssets int64
	NormalCount  int64
	SurplusCount int64
	DeficitCount int64
	DamagedCount int64
	AccuracyRate float64
} {
	var stats struct {
		TotalAssets  int64
		CheckedAssets int64
		NormalCount  int64
		SurplusCount int64
		DeficitCount int64
		DamagedCount int64
		AccuracyRate float64
	}
	
	// 总资产数和已检查资产数
	global.DB.Model(&models.InventoryRecord{}).Where("task_id = ?", taskID).Count(&stats.CheckedAssets)
	stats.TotalAssets = stats.CheckedAssets // 简化处理，实际应该根据任务范围计算
	
	// 各结果统计
	global.DB.Model(&models.InventoryRecord{}).Where("task_id = ? AND result = ?", taskID, models.InventoryResultNormal).Count(&stats.NormalCount)
	global.DB.Model(&models.InventoryRecord{}).Where("task_id = ? AND result = ?", taskID, models.InventoryResultSurplus).Count(&stats.SurplusCount)
	global.DB.Model(&models.InventoryRecord{}).Where("task_id = ? AND result = ?", taskID, models.InventoryResultDeficit).Count(&stats.DeficitCount)
	global.DB.Model(&models.InventoryRecord{}).Where("task_id = ? AND result = ?", taskID, models.InventoryResultDamaged).Count(&stats.DamagedCount)
	
	// 准确率
	if stats.CheckedAssets > 0 {
		stats.AccuracyRate = float64(stats.NormalCount) / float64(stats.CheckedAssets) * 100
	}
	
	return stats
}

// getInventoryResultAnalysis 获取盘点结果分析
func getInventoryResultAnalysis() InventoryResultAnalysis {
	var analysis InventoryResultAnalysis
	
	// 各结果统计
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultNormal).Count(&analysis.NormalCount)
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultSurplus).Count(&analysis.SurplusCount)
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultDeficit).Count(&analysis.DeficitCount)
	global.DB.Model(&models.InventoryRecord{}).Where("result = ?", models.InventoryResultDamaged).Count(&analysis.DamagedCount)
	
	// 计算总数
	total := analysis.NormalCount + analysis.SurplusCount + analysis.DeficitCount + analysis.DamagedCount
	
	// 计算比率
	if total > 0 {
		analysis.NormalRate = float64(analysis.NormalCount) / float64(total) * 100
		analysis.SurplusRate = float64(analysis.SurplusCount) / float64(total) * 100
		analysis.DeficitRate = float64(analysis.DeficitCount) / float64(total) * 100
		analysis.DamagedRate = float64(analysis.DamagedCount) / float64(total) * 100
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
		FROM assets a
		LEFT JOIN departments d ON d.id = a.department_id
		LEFT JOIN inventory_records ir ON ir.asset_id = a.id
		GROUP BY d.id, d.name
		HAVING checked_assets > 0
	`).Rows()
	
	if err != nil {
		return stats
	}
	defer rows.Close()
	
	for rows.Next() {
		var stat InventoryDepartmentStats
		var departmentID *uint
		rows.Scan(&departmentID, &stat.DepartmentName, &stat.TotalAssets, &stat.CheckedAssets, &stat.NormalCount, &stat.IssueCount)
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
		FROM assets a
		JOIN categories c ON c.id = a.category_id
		LEFT JOIN inventory_records ir ON ir.asset_id = a.id
		GROUP BY c.id, c.name
		HAVING checked_assets > 0
	`).Rows()
	
	if err != nil {
		return stats
	}
	defer rows.Close()
	
	for rows.Next() {
		var stat InventoryCategoryStats
		rows.Scan(&stat.CategoryID, &stat.CategoryName, &stat.TotalAssets, &stat.CheckedAssets, &stat.NormalCount, &stat.IssueCount)
		
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
	
	// 获取最近6个月的盘点趋势
	for i := 5; i >= 0; i-- {
		monthStart := time.Now().AddDate(0, -i, 0)
		monthStart = time.Date(monthStart.Year(), monthStart.Month(), 1, 0, 0, 0, 0, monthStart.Location())
		monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)
		
		var taskCount int64
		global.DB.Model(&models.InventoryTask{}).
			Where("created_at BETWEEN ? AND ?", monthStart, monthEnd).
			Count(&taskCount)
		
		// 计算该月的准确率
		var normalCount, totalRecords int64
		global.DB.Raw(`
			SELECT 
				COUNT(CASE WHEN ir.result = 'normal' THEN 1 END) as normal_count,
				COUNT(ir.id) as total_records
			FROM inventory_records ir
			JOIN inventory_tasks it ON it.id = ir.task_id
			WHERE it.created_at BETWEEN ? AND ?
		`, monthStart, monthEnd).Row().Scan(&normalCount, &totalRecords)
		
		var accuracyRate float64
		if totalRecords > 0 {
			accuracyRate = float64(normalCount) / float64(totalRecords) * 100
		}
		
		stats = append(stats, InventoryTrendStats{
			Month:        monthStart.Format("2006-01"),
			TaskCount:    taskCount,
			AccuracyRate: accuracyRate,
		})
	}
	
	return stats
}