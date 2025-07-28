package reports

import (
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"
)

// getDashboardAssetOverview 获取仪表板资产概览
func getDashboardAssetOverview() AssetOverview {
	var overview AssetOverview
	
	// 总资产数
	global.DB.Model(&models.Asset{}).Count(&overview.TotalAssets)
	
	// 总价值
	var totalValue *float64
	global.DB.Model(&models.Asset{}).Select("SUM(purchase_price)").Row().Scan(&totalValue)
	if totalValue != nil {
		overview.TotalValue = *totalValue
	}
	
	// 各状态资产数
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusAvailable).Count(&overview.AvailableAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusBorrowed).Count(&overview.BorrowedAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusMaintenance).Count(&overview.MaintenanceAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusScrapped).Count(&overview.ScrappedAssets)
	
	// 计算增长率（相比上月）
	lastMonth := time.Now().AddDate(0, -1, 0)
	var lastMonthCount int64
	global.DB.Model(&models.Asset{}).Where("created_at < ?", lastMonth).Count(&lastMonthCount)
	
	if lastMonthCount > 0 {
		overview.GrowthRate = float64(overview.TotalAssets-lastMonthCount) / float64(lastMonthCount) * 100
	}
	
	return overview
}

// getDashboardBorrowOverview 获取仪表板借用概览
func getDashboardBorrowOverview() BorrowOverview {
	var overview BorrowOverview
	
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	tomorrow := today.Add(24 * time.Hour)
	
	// 活跃借用数
	global.DB.Model(&models.BorrowRecord{}).Where("status = ?", models.BorrowStatusBorrowed).Count(&overview.ActiveBorrows)
	
	// 超期借用数
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).
		Count(&overview.OverdueBorrows)
	
	// 今日借用数
	global.DB.Model(&models.BorrowRecord{}).
		Where("borrow_date BETWEEN ? AND ?", today, tomorrow).
		Count(&overview.TodayBorrows)
	
	// 今日归还数
	global.DB.Model(&models.BorrowRecord{}).
		Where("actual_return_date BETWEEN ? AND ?", today, tomorrow).
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
	
	// 各状态任务数
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", models.InventoryTaskStatusPending).Count(&overview.PendingTasks)
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", models.InventoryTaskStatusInProgress).Count(&overview.InProgressTasks)
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", models.InventoryTaskStatusCompleted).Count(&overview.CompletedTasks)
	
	// 最近完成任务的准确率
	var lastTask models.InventoryTask
	if err := global.DB.Where("status = ?", models.InventoryTaskStatusCompleted).
		Order("end_date DESC").First(&lastTask).Error; err == nil {
		
		var normalCount, totalRecords int64
		global.DB.Model(&models.InventoryRecord{}).Where("task_id = ? AND result = ?", lastTask.ID, models.InventoryResultNormal).Count(&normalCount)
		global.DB.Model(&models.InventoryRecord{}).Where("task_id = ?", lastTask.ID).Count(&totalRecords)
		
		if totalRecords > 0 {
			overview.LastAccuracyRate = float64(normalCount) / float64(totalRecords) * 100
		}
	}
	
	return overview
}

// getDashboardRecentActivity 获取仪表板最近活动
func getDashboardRecentActivity() RecentActivity {
	var activity RecentActivity
	
	// 最近资产
	activity.RecentAssets = getDashboardRecentAssets()
	
	// 最近借用
	activity.RecentBorrows = getDashboardRecentBorrows()
	
	// 最近归还
	activity.RecentReturns = getDashboardRecentReturns()
	
	return activity
}

// getDashboardRecentAssets 获取最近资产
func getDashboardRecentAssets() []RecentAsset {
	var assets []RecentAsset
	
	rows, err := global.DB.Raw(`
		SELECT a.id, a.asset_no, a.name, c.name as category_name, a.created_at
		FROM assets a
		LEFT JOIN categories c ON c.id = a.category_id
		ORDER BY a.created_at DESC
		LIMIT 5
	`).Rows()
	
	if err != nil {
		return assets
	}
	defer rows.Close()
	
	for rows.Next() {
		var asset RecentAsset
		rows.Scan(&asset.ID, &asset.AssetNo, &asset.Name, &asset.CategoryName, &asset.CreatedAt)
		assets = append(assets, asset)
	}
	
	return assets
}

// getDashboardRecentBorrows 获取最近借用
func getDashboardRecentBorrows() []RecentBorrow {
	var borrows []RecentBorrow
	
	rows, err := global.DB.Raw(`
		SELECT br.id, a.asset_no, a.name as asset_name, br.borrower_name, br.borrow_date
		FROM borrow_records br
		JOIN assets a ON a.id = br.asset_id
		ORDER BY br.borrow_date DESC
		LIMIT 5
	`).Rows()
	
	if err != nil {
		return borrows
	}
	defer rows.Close()
	
	for rows.Next() {
		var borrow RecentBorrow
		rows.Scan(&borrow.ID, &borrow.AssetNo, &borrow.AssetName, &borrow.BorrowerName, &borrow.BorrowDate)
		borrows = append(borrows, borrow)
	}
	
	return borrows
}

// getDashboardRecentReturns 获取最近归还
func getDashboardRecentReturns() []RecentReturn {
	var returns []RecentReturn
	
	rows, err := global.DB.Raw(`
		SELECT br.id, a.asset_no, a.name as asset_name, br.borrower_name, br.actual_return_date
		FROM borrow_records br
		JOIN assets a ON a.id = br.asset_id
		WHERE br.actual_return_date IS NOT NULL
		ORDER BY br.actual_return_date DESC
		LIMIT 5
	`).Rows()
	
	if err != nil {
		return returns
	}
	defer rows.Close()
	
	for rows.Next() {
		var returnRecord RecentReturn
		rows.Scan(&returnRecord.ID, &returnRecord.AssetNo, &returnRecord.AssetName, &returnRecord.BorrowerName, &returnRecord.ActualReturnDate)
		returns = append(returns, returnRecord)
	}
	
	return returns
}

// getDashboardAlerts 获取系统警报
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
			Description: "有资产超期未归还",
			Count:       overdueCount,
			Severity:    "high",
			CreatedAt:   now,
		})
	}
	
	// 保修即将到期警报
	var warrantyExpiringCount int64
	thirtyDaysLater := now.AddDate(0, 0, 30)
	global.DB.Model(&models.Asset{}).Where(`
		purchase_date IS NOT NULL 
		AND warranty_period IS NOT NULL 
		AND datetime(purchase_date, '+' || warranty_period || ' months') BETWEEN ? AND ?
	`, now, thirtyDaysLater).Count(&warrantyExpiringCount)
	
	if warrantyExpiringCount > 0 {
		alerts = append(alerts, SystemAlert{
			Type:        "warranty_expiring",
			Title:       "保修即将到期",
			Description: "有资产保修期即将到期",
			Count:       warrantyExpiringCount,
			Severity:    "medium",
			CreatedAt:   now,
		})
	}
	
	// 维护中资产警报
	var maintenanceCount int64
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusMaintenance).Count(&maintenanceCount)
	
	if maintenanceCount > 0 {
		alerts = append(alerts, SystemAlert{
			Type:        "maintenance_due",
			Title:       "维护中资产",
			Description: "有资产正在维护中",
			Count:       maintenanceCount,
			Severity:    "low",
			CreatedAt:   now,
		})
	}
	
	return alerts
}