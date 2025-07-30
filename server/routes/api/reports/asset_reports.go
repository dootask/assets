package reports

import (
	"time"

	"asset-management-system/server/models"

	"gorm.io/gorm"
)

// getAssetSummary 获取资产汇总数据
func getAssetSummary(baseQuery *gorm.DB) AssetSummary {
	var summary AssetSummary

	// 总资产数
	query1 := baseQuery.Session(&gorm.Session{})
	query1.Count(&summary.TotalAssets)

	// 总价值
	var totalValue *float64
	query2 := baseQuery.Session(&gorm.Session{})
	row := query2.Select("SUM(purchase_price)").Row()
	if row != nil {
		err := row.Scan(&totalValue)
		if err == nil && totalValue != nil {
			summary.TotalValue = *totalValue
		}
	}

	// 各状态资产数 - 为每个查询创建新的session
	query3 := baseQuery.Session(&gorm.Session{})
	query3.Where("status = ?", models.AssetStatusAvailable).Count(&summary.AvailableAssets)

	query4 := baseQuery.Session(&gorm.Session{})
	query4.Where("status = ?", models.AssetStatusBorrowed).Count(&summary.BorrowedAssets)

	query5 := baseQuery.Session(&gorm.Session{})
	query5.Where("status = ?", models.AssetStatusMaintenance).Count(&summary.MaintenanceAssets)

	query6 := baseQuery.Session(&gorm.Session{})
	query6.Where("status = ?", models.AssetStatusScrapped).Count(&summary.ScrappedAssets)

	return summary
}

// getAssetsByCategory 获取按分类统计的资产数据
func getAssetsByCategory(query *gorm.DB) []CategoryStats {
	var stats []CategoryStats

	rows, err := query.Select(`
		c.id as category_id,
		c.name as category_name,
		COUNT(a.id) as asset_count,
		COALESCE(SUM(a.purchase_price), 0) as total_value
	`).
		Joins("a").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Group("c.id, c.name").
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	var totalAssets int64
	query.Count(&totalAssets)

	for rows.Next() {
		var stat CategoryStats
		rows.Scan(&stat.CategoryID, &stat.CategoryName, &stat.AssetCount, &stat.TotalValue)

		if totalAssets > 0 {
			stat.Percentage = float64(stat.AssetCount) / float64(totalAssets) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getAssetsByDepartment 获取按部门统计的资产数据
func getAssetsByDepartment(query *gorm.DB) []DepartmentStats {
	var stats []DepartmentStats

	rows, err := query.Select(`
		d.id as department_id,
		COALESCE(d.name, '未分配') as department_name,
		COUNT(a.id) as asset_count,
		COALESCE(SUM(a.purchase_price), 0) as total_value
	`).
		Joins("a").
		Joins("LEFT JOIN departments d ON d.id = a.department_id").
		Group("d.id, d.name").
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	var totalAssets int64
	query.Count(&totalAssets)

	for rows.Next() {
		var stat DepartmentStats
		var departmentID *uint
		rows.Scan(&departmentID, &stat.DepartmentName, &stat.AssetCount, &stat.TotalValue)
		stat.DepartmentID = departmentID

		if totalAssets > 0 {
			stat.Percentage = float64(stat.AssetCount) / float64(totalAssets) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getAssetsByStatus 获取按状态统计的资产数据
func getAssetsByStatus(query *gorm.DB) []StatusStats {
	var stats []StatusStats

	rows, err := query.Select("status, COUNT(*) as count").
		Group("status").
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	var totalAssets int64
	query.Count(&totalAssets)

	for rows.Next() {
		var stat StatusStats
		rows.Scan(&stat.Status, &stat.Count)

		if totalAssets > 0 {
			stat.Percentage = float64(stat.Count) / float64(totalAssets) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getAssetsByPurchaseYear 获取按采购年份统计的资产数据
func getAssetsByPurchaseYear(query *gorm.DB) []PurchaseYearStats {
	var stats []PurchaseYearStats

	rows, err := query.Select(`
		strftime('%Y', purchase_date) as year,
		COUNT(*) as count,
		COALESCE(SUM(purchase_price), 0) as total_value
	`).
		Where("purchase_date IS NOT NULL").
		Group("strftime('%Y', purchase_date)").
		Order("year DESC").
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat PurchaseYearStats
		var yearStr string
		rows.Scan(&yearStr, &stat.Count, &stat.TotalValue)

		if year, err := time.Parse("2006", yearStr); err == nil {
			stat.Year = year.Year()
		}

		stats = append(stats, stat)
	}

	return stats
}

// getAssetValueAnalysis 获取资产价值分析
func getAssetValueAnalysis(baseQuery *gorm.DB) ValueAnalysis {
	var analysis ValueAnalysis

	// 高价值资产 (>10000)
	query1 := baseQuery.Session(&gorm.Session{})
	query1.Where("purchase_price > ?", 10000).Count(&analysis.HighValue)

	// 中等价值资产 (1000-10000)
	query2 := baseQuery.Session(&gorm.Session{})
	query2.Where("purchase_price BETWEEN ? AND ?", 1000, 10000).Count(&analysis.MediumValue)

	// 低价值资产 (<1000)
	query3 := baseQuery.Session(&gorm.Session{})
	query3.Where("purchase_price > 0 AND purchase_price < ?", 1000).Count(&analysis.LowValue)

	// 无价值信息资产
	query4 := baseQuery.Session(&gorm.Session{})
	query4.Where("purchase_price IS NULL OR purchase_price = 0").Count(&analysis.NoValue)

	// 平均价值
	var avgValue *float64
	query5 := baseQuery.Session(&gorm.Session{})
	row := query5.Where("purchase_price > 0").Select("AVG(purchase_price)").Row()
	if row != nil {
		err := row.Scan(&avgValue)
		if err == nil && avgValue != nil {
			analysis.AverageValue = *avgValue
		}
	}

	return analysis
}

// getAssetWarrantyStatus 获取资产保修状态
func getAssetWarrantyStatus(baseQuery *gorm.DB) WarrantyStatus {
	var status WarrantyStatus

	now := time.Now()

	// 保修期内 (purchase_date + warranty_period > now)
	query1 := baseQuery.Session(&gorm.Session{})
	query1.Where(`
		purchase_date IS NOT NULL 
		AND warranty_period IS NOT NULL 
		AND datetime(purchase_date, '+' || warranty_period || ' months') > ?
	`, now).Count(&status.InWarranty)

	// 保修期外
	query2 := baseQuery.Session(&gorm.Session{})
	query2.Where(`
		purchase_date IS NOT NULL 
		AND warranty_period IS NOT NULL 
		AND datetime(purchase_date, '+' || warranty_period || ' months') <= ?
	`, now).Count(&status.ExpiredWarranty)

	// 无保修信息
	query3 := baseQuery.Session(&gorm.Session{})
	query3.Where("purchase_date IS NULL OR warranty_period IS NULL").Count(&status.NoWarranty)

	return status
}
