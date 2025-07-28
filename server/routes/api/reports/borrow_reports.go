package reports

import (
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"gorm.io/gorm"
)

// getBorrowSummary 获取借用汇总数据
func getBorrowSummary(query *gorm.DB) BorrowSummary {
	var summary BorrowSummary
	
	// 总借用数
	query.Count(&summary.TotalBorrows)
	
	// 活跃借用数
	query.Where("status = ?", models.BorrowStatusBorrowed).Count(&summary.ActiveBorrows)
	
	// 已归还借用数
	query.Where("status = ?", models.BorrowStatusReturned).Count(&summary.ReturnedBorrows)
	
	// 超期借用数
	now := time.Now()
	query.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).Count(&summary.OverdueBorrows)
	
	// 平均归还天数
	var avgDays *float64
	query.Where("status = ? AND actual_return_date IS NOT NULL", models.BorrowStatusReturned).
		Select("AVG(julianday(actual_return_date) - julianday(borrow_date))").
		Row().Scan(&avgDays)
	if avgDays != nil {
		summary.AverageReturnDays = *avgDays
	}
	
	return summary
}

// getBorrowsByDepartment 获取按部门统计的借用数据
func getBorrowsByDepartment(query *gorm.DB) []BorrowDepartmentStats {
	var stats []BorrowDepartmentStats
	
	rows, err := query.Select(`
		d.id as department_id,
		COALESCE(d.name, '未分配') as department_name,
		COUNT(br.id) as borrow_count,
		SUM(CASE WHEN br.status = 'borrowed' THEN 1 ELSE 0 END) as active_count,
		SUM(CASE WHEN br.status = 'borrowed' AND br.expected_return_date < datetime('now') THEN 1 ELSE 0 END) as overdue_count
	`).
	Table("borrow_records br").
	Joins("LEFT JOIN departments d ON d.id = br.department_id").
	Group("d.id, d.name").
	Rows()
	
	if err != nil {
		return stats
	}
	defer rows.Close()
	
	var totalBorrows int64
	query.Count(&totalBorrows)
	
	for rows.Next() {
		var stat BorrowDepartmentStats
		var departmentID *uint
		rows.Scan(&departmentID, &stat.DepartmentName, &stat.BorrowCount, &stat.ActiveCount, &stat.OverdueCount)
		stat.DepartmentID = departmentID
		
		if totalBorrows > 0 {
			stat.Percentage = float64(stat.BorrowCount) / float64(totalBorrows) * 100
		}
		
		stats = append(stats, stat)
	}
	
	return stats
}

// getBorrowsByAsset 获取按资产统计的借用数据
func getBorrowsByAsset(query *gorm.DB) []BorrowAssetStats {
	var stats []BorrowAssetStats
	
	rows, err := query.Select(`
		a.id as asset_id,
		a.asset_no,
		a.name as asset_name,
		COUNT(br.id) as borrow_count,
		COALESCE(SUM(
			CASE 
				WHEN br.actual_return_date IS NOT NULL THEN julianday(br.actual_return_date) - julianday(br.borrow_date)
				WHEN br.status = 'borrowed' THEN julianday('now') - julianday(br.borrow_date)
				ELSE 0
			END
		), 0) as total_days
	`).
	Table("borrow_records br").
	Joins("JOIN assets a ON a.id = br.asset_id").
	Group("a.id, a.asset_no, a.name").
	Order("borrow_count DESC").
	Limit(20).
	Rows()
	
	if err != nil {
		return stats
	}
	defer rows.Close()
	
	for rows.Next() {
		var stat BorrowAssetStats
		rows.Scan(&stat.AssetID, &stat.AssetNo, &stat.AssetName, &stat.BorrowCount, &stat.TotalDays)
		stats = append(stats, stat)
	}
	
	return stats
}

// getBorrowOverdueAnalysis 获取借用超期分析
func getBorrowOverdueAnalysis(query *gorm.DB) OverdueAnalysis {
	var analysis OverdueAnalysis
	
	now := time.Now()
	
	// 总超期数
	query.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).Count(&analysis.TotalOverdue)
	
	// 超期率
	var totalActive int64
	query.Where("status = ?", models.BorrowStatusBorrowed).Count(&totalActive)
	if totalActive > 0 {
		analysis.OverdueRate = float64(analysis.TotalOverdue) / float64(totalActive) * 100
	}
	
	// 平均超期天数
	var avgOverdueDays *float64
	query.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).
		Select("AVG(julianday('now') - julianday(expected_return_date))").
		Row().Scan(&avgOverdueDays)
	if avgOverdueDays != nil {
		analysis.AverageOverdueDays = *avgOverdueDays
	}
	
	// 按超期天数分组统计
	analysis.ByOverdueDays = getBorrowOverdueDaysStats(query)
	
	return analysis
}

// getBorrowOverdueDaysStats 获取按超期天数统计
func getBorrowOverdueDaysStats(query *gorm.DB) []OverdueDaysStats {
	var stats []OverdueDaysStats
	
	now := time.Now()
	
	// 1-7天
	var count1to7 int64
	query.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) BETWEEN 1 AND 7
	`, models.BorrowStatusBorrowed, now, now).Count(&count1to7)
	stats = append(stats, OverdueDaysStats{DaysRange: "1-7天", Count: count1to7})
	
	// 8-30天
	var count8to30 int64
	query.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) BETWEEN 8 AND 30
	`, models.BorrowStatusBorrowed, now, now).Count(&count8to30)
	stats = append(stats, OverdueDaysStats{DaysRange: "8-30天", Count: count8to30})
	
	// 31-90天
	var count31to90 int64
	query.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) BETWEEN 31 AND 90
	`, models.BorrowStatusBorrowed, now, now).Count(&count31to90)
	stats = append(stats, OverdueDaysStats{DaysRange: "31-90天", Count: count31to90})
	
	// 90天以上
	var countOver90 int64
	query.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) > 90
	`, models.BorrowStatusBorrowed, now, now).Count(&countOver90)
	stats = append(stats, OverdueDaysStats{DaysRange: "90天以上", Count: countOver90})
	
	return stats
}

// getBorrowMonthlyTrend 获取借用月度趋势
func getBorrowMonthlyTrend(query *gorm.DB) []MonthlyBorrowStats {
	var stats []MonthlyBorrowStats
	
	// 获取最近12个月的借用趋势
	rows, err := global.DB.Raw(`
		WITH months AS (
			SELECT date('now', '-' || (value-1) || ' months', 'start of month') as month_start,
				   strftime('%Y-%m', date('now', '-' || (value-1) || ' months')) as month_label
			FROM generate_series(0, 11)
		)
		SELECT 
			m.month_label as month,
			COALESCE(COUNT(br.id), 0) as borrow_count,
			COALESCE(COUNT(CASE WHEN br.actual_return_date IS NOT NULL 
				AND date(br.actual_return_date) BETWEEN m.month_start 
				AND date(m.month_start, '+1 month', '-1 day') THEN 1 END), 0) as return_count
		FROM months m
		LEFT JOIN borrow_records br ON strftime('%Y-%m', br.borrow_date) = m.month_label
		GROUP BY m.month_label, m.month_start
		ORDER BY m.month_start
	`).Rows()
	
	if err != nil {
		// 如果上面的查询失败，使用简化版本
		return getBorrowMonthlyTrendSimple()
	}
	defer rows.Close()
	
	for rows.Next() {
		var stat MonthlyBorrowStats
		rows.Scan(&stat.Month, &stat.BorrowCount, &stat.ReturnCount)
		stats = append(stats, stat)
	}
	
	return stats
}

// getBorrowMonthlyTrendSimple 获取借用月度趋势（简化版本）
func getBorrowMonthlyTrendSimple() []MonthlyBorrowStats {
	var stats []MonthlyBorrowStats
	
	// 获取最近6个月的数据
	for i := 5; i >= 0; i-- {
		monthStart := time.Now().AddDate(0, -i, 0)
		monthStart = time.Date(monthStart.Year(), monthStart.Month(), 1, 0, 0, 0, 0, monthStart.Location())
		monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)
		
		var borrowCount, returnCount int64
		
		global.DB.Model(&models.BorrowRecord{}).
			Where("borrow_date BETWEEN ? AND ?", monthStart, monthEnd).
			Count(&borrowCount)
			
		global.DB.Model(&models.BorrowRecord{}).
			Where("actual_return_date BETWEEN ? AND ?", monthStart, monthEnd).
			Count(&returnCount)
		
		stats = append(stats, MonthlyBorrowStats{
			Month:       monthStart.Format("2006-01"),
			BorrowCount: borrowCount,
			ReturnCount: returnCount,
		})
	}
	
	return stats
}

// getBorrowPopularAssets 获取热门借用资产
func getBorrowPopularAssets(query *gorm.DB) []PopularAssetStats {
	var stats []PopularAssetStats
	
	rows, err := query.Select(`
		a.id as asset_id,
		a.asset_no,
		a.name as asset_name,
		COUNT(br.id) as borrow_count
	`).
	Table("borrow_records br").
	Joins("JOIN assets a ON a.id = br.asset_id").
	Group("a.id, a.asset_no, a.name").
	Order("borrow_count DESC").
	Limit(10).
	Rows()
	
	if err != nil {
		return stats
	}
	defer rows.Close()
	
	rank := 1
	for rows.Next() {
		var stat PopularAssetStats
		rows.Scan(&stat.AssetID, &stat.AssetNo, &stat.AssetName, &stat.BorrowCount)
		stat.Rank = rank
		rank++
		stats = append(stats, stat)
	}
	
	return stats
}