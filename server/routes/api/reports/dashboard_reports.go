package reports

import (
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"
)

// getDashboardAssetOverview 获取仪表板资产概览
func getDashboardAssetOverview() AssetOverview {
	var overview AssetOverview

	// 总资产数和价值
	global.DB.Model(&models.Asset{}).Count(&overview.TotalAssets)

	var totalValue *float64
	row := global.DB.Model(&models.Asset{}).Select("SUM(purchase_price)").Row()
	if row != nil {
		err := row.Scan(&totalValue)
		if err == nil && totalValue != nil {
			overview.TotalValue = *totalValue
		}
	}

	// 各状态资产数
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusAvailable).Count(&overview.AvailableAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusBorrowed).Count(&overview.BorrowedAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusMaintenance).Count(&overview.MaintenanceAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusScrapped).Count(&overview.ScrappedAssets)

	// 计算增长率（相比上月）
	lastMonth := time.Now().AddDate(0, -1, 0)
	var lastMonthAssets int64
	global.DB.Model(&models.Asset{}).Where("created_at < ?", lastMonth).Count(&lastMonthAssets)

	if lastMonthAssets > 0 {
		overview.GrowthRate = float64(overview.TotalAssets-lastMonthAssets) / float64(lastMonthAssets) * 100
	}

	return overview
}

// getDashboardBorrowOverview 获取仪表板借用概览
func getDashboardBorrowOverview() BorrowOverview {
	var overview BorrowOverview

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	tomorrow := today.AddDate(0, 0, 1)

	// 活跃借用数
	global.DB.Model(&models.BorrowRecord{}).Where("status = ?", models.BorrowStatusBorrowed).Count(&overview.ActiveBorrows)

	// 超期借用数
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).
		Count(&overview.OverdueBorrows)

	// 今日借用数
	global.DB.Model(&models.BorrowRecord{}).
		Where("borrow_date >= ? AND borrow_date < ?", today, tomorrow).
		Count(&overview.TodayBorrows)

	// 今日归还数
	global.DB.Model(&models.BorrowRecord{}).
		Where("actual_return_date >= ? AND actual_return_date < ?", today, tomorrow).
		Count(&overview.TodayReturns)

	// 超期率
	if overview.ActiveBorrows > 0 {
		overview.OverdueRate = float64(overview.OverdueBorrows) / float64(overview.ActiveBorrows) * 100
	}

	return overview
}

// getDashboardInventoryOverview 获取仪表板盘点概览
func getDashboardInventoryOverview() InventoryOverview {
	var overview InventoryOverview

	// 计算活跃任务数（pending + in_progress）
	var pendingTasks, inProgressTasks int64
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", models.InventoryTaskStatusPending).Count(&pendingTasks)
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", models.InventoryTaskStatusInProgress).Count(&inProgressTasks)
	overview.ActiveTasks = pendingTasks + inProgressTasks

	// 已完成任务数
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", models.InventoryTaskStatusCompleted).Count(&overview.CompletedTasks)

	// 最近完成任务的准确率
	var task models.InventoryTask
	if err := global.DB.Where("status = ?", models.InventoryTaskStatusCompleted).
		Order("updated_at DESC").First(&task).Error; err == nil {

		var normalCount, totalRecords int64
		global.DB.Model(&models.InventoryRecord{}).
			Where("task_id = ? AND result = ?", task.ID, models.InventoryResultNormal).
			Count(&normalCount)
		global.DB.Model(&models.InventoryRecord{}).
			Where("task_id = ?", task.ID).
			Count(&totalRecords)

		if totalRecords > 0 {
			overview.AccuracyRate = float64(normalCount) / float64(totalRecords) * 100
		}
	}

	return overview
}

// getDashboardRecentActivity 获取仪表板最近活动
func getDashboardRecentActivity() RecentActivity {
	var activity RecentActivity

	// 最近资产
	var recentAssets []RecentAsset
	global.DB.Table("assets a").
		Select("a.id, a.asset_no, a.name, c.name as category_name, a.created_at").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Order("a.created_at DESC").
		Limit(5).
		Find(&recentAssets)
	activity.RecentAssets = recentAssets

	// 最近借用
	var recentBorrows []RecentBorrow
	global.DB.Table("borrow_records br").
		Select("br.id, a.asset_no, a.name as asset_name, u.name as borrower_name, br.borrow_date").
		Joins("JOIN assets a ON a.id = br.asset_id").
		Joins("JOIN users u ON u.id = br.borrower_id").
		Order("br.borrow_date DESC").
		Limit(5).
		Find(&recentBorrows)
	activity.RecentBorrows = recentBorrows

	// 最近归还
	var recentReturns []RecentReturn
	global.DB.Table("borrow_records br").
		Select("br.id, a.asset_no, a.name as asset_name, u.name as borrower_name, br.actual_return_date").
		Joins("JOIN assets a ON a.id = br.asset_id").
		Joins("JOIN users u ON u.id = br.borrower_id").
		Where("br.actual_return_date IS NOT NULL").
		Order("br.actual_return_date DESC").
		Limit(5).
		Find(&recentReturns)
	activity.RecentReturns = recentReturns

	return activity
}

// getDashboardAlerts 获取仪表板系统警报
func getDashboardAlerts() []SystemAlert {
	var alerts []SystemAlert
	now := time.Now()

	// 超期借用警报
	var overdueCount int64
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).
		Count(&overdueCount)

	if overdueCount > 0 {
		alerts = append(alerts, SystemAlert{
			Type:        "overdue",
			Title:       "超期借用提醒",
			Description: "有资产超期未归还，请及时处理",
			Count:       overdueCount,
			Severity:    "high",
			CreatedAt:   now,
		})
	}

	// 保修即将到期警报
	var warrantyExpiringCount int64
	thirtyDaysLater := now.AddDate(0, 0, 30)
	global.DB.Model(&models.Asset{}).
		Where(`
			purchase_date IS NOT NULL 
			AND warranty_period IS NOT NULL 
			AND datetime(purchase_date, '+' || warranty_period || ' months') BETWEEN ? AND ?
		`, now, thirtyDaysLater).
		Count(&warrantyExpiringCount)

	if warrantyExpiringCount > 0 {
		alerts = append(alerts, SystemAlert{
			Type:        "warranty_expiring",
			Title:       "保修即将到期",
			Description: "有资产保修期即将在30天内到期",
			Count:       warrantyExpiringCount,
			Severity:    "medium",
			CreatedAt:   now,
		})
	}

	// 维护中资产警报
	var maintenanceCount int64
	global.DB.Model(&models.Asset{}).
		Where("status = ?", models.AssetStatusMaintenance).
		Count(&maintenanceCount)

	if maintenanceCount > 0 {
		alerts = append(alerts, SystemAlert{
			Type:        "maintenance_due",
			Title:       "资产维护中",
			Description: "有资产正在维护中，请关注维护进度",
			Count:       maintenanceCount,
			Severity:    "low",
			CreatedAt:   now,
		})
	}

	return alerts
}
