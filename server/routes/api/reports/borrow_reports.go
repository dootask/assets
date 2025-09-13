package reports

import (
	"fmt"
	"strings"
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

	// 已归还借用数 - 对于已归还记录，应该统计所有已归还的记录，不受时间过滤影响
	// 因为时间过滤是基于borrow_date的，但已归还记录应该基于actual_return_date
	global.DB.Model(&models.BorrowRecord{}).Where("status = ?", models.BorrowStatusReturned).Count(&summary.ReturnedBorrows)

	// 超期借用数
	now := time.Now()
	query.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).Count(&summary.OverdueBorrows)

	// 平均归还天数
	var avgDays *float64
	row := query.Where("status = ? AND actual_return_date IS NOT NULL", models.BorrowStatusReturned).
		Select("AVG(julianday(actual_return_date) - julianday(borrow_date))").
		Row()

	if row != nil {
		err := row.Scan(&avgDays)
		if err == nil && avgDays != nil {
			summary.AverageReturnDays = *avgDays
		}
	}

	return summary
}

// getBorrowsByDepartment 获取按部门统计的借用数据
func getBorrowsByDepartment(query *gorm.DB) []BorrowDepartmentStats {
	stats := make([]BorrowDepartmentStats, 0)

	// 先获取总借用数
	var totalBorrows int64
	query.Count(&totalBorrows)

	// 获取原始查询的SQL和参数，用于构建统计查询
	sql := query.Statement.SQL.String()
	var args []interface{}
	if query.Statement.Vars != nil {
		args = query.Statement.Vars
	}

	// 构建统计查询，确保继承WHERE条件
	baseQuery := global.DB.Model(&models.BorrowRecord{})
	if sql != "" && len(args) > 0 {
		// 如果有WHERE条件，解析并应用
		whereClause := strings.TrimPrefix(sql, "SELECT * FROM `borrow_records`")
		if strings.HasPrefix(whereClause, " WHERE") {
			baseQuery = baseQuery.Where(strings.TrimPrefix(whereClause, " WHERE"), args...)
		}
	}

	rows, err := baseQuery.Select(`
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
	stats := make([]BorrowAssetStats, 0)

	// 获取原始查询的SQL和参数，用于构建统计查询
	sql := query.Statement.SQL.String()
	var args []interface{}
	if query.Statement.Vars != nil {
		args = query.Statement.Vars
	}

	// 构建统计查询，确保继承WHERE条件
	baseQuery := global.DB.Model(&models.BorrowRecord{})
	if sql != "" && len(args) > 0 {
		// 如果有WHERE条件，解析并应用
		whereClause := strings.TrimPrefix(sql, "SELECT * FROM `borrow_records`")
		if strings.HasPrefix(whereClause, " WHERE") {
			baseQuery = baseQuery.Where(strings.TrimPrefix(whereClause, " WHERE"), args...)
		}
	}

	rows, err := baseQuery.Select(`
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
func getBorrowOverdueAnalysis(baseQuery *gorm.DB) OverdueAnalysis {
	var analysis OverdueAnalysis

	now := time.Now()

	// 总超期数
	query1 := baseQuery.Session(&gorm.Session{})
	query1.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).Count(&analysis.TotalOverdue)

	// 超期率
	var totalActive int64
	query2 := baseQuery.Session(&gorm.Session{})
	query2.Where("status = ?", models.BorrowStatusBorrowed).Count(&totalActive)
	if totalActive > 0 {
		analysis.OverdueRate = float64(analysis.TotalOverdue) / float64(totalActive) * 100
	}

	// 平均超期天数
	var avgOverdueDays *float64
	query3 := baseQuery.Session(&gorm.Session{})
	row := query3.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now).
		Select("AVG(julianday('now') - julianday(expected_return_date))").
		Row()

	if row != nil {
		err := row.Scan(&avgOverdueDays)
		if err == nil && avgOverdueDays != nil {
			analysis.AverageOverdueDays = *avgOverdueDays
		}
	}

	// 按超期天数分组统计
	analysis.ByOverdueDays = getBorrowOverdueDaysStats(baseQuery)

	return analysis
}

// getBorrowOverdueDaysStats 获取按超期天数统计
func getBorrowOverdueDaysStats(baseQuery *gorm.DB) []OverdueDaysStats {
	var stats []OverdueDaysStats

	now := time.Now()

	// 1-7天
	var count1to7 int64
	query1 := baseQuery.Session(&gorm.Session{})
	query1.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) BETWEEN 1 AND 7
	`, models.BorrowStatusBorrowed, now, now).Count(&count1to7)
	stats = append(stats, OverdueDaysStats{DaysRange: "1-7天", Count: count1to7})

	// 8-30天
	var count8to30 int64
	query2 := baseQuery.Session(&gorm.Session{})
	query2.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) BETWEEN 8 AND 30
	`, models.BorrowStatusBorrowed, now, now).Count(&count8to30)
	stats = append(stats, OverdueDaysStats{DaysRange: "8-30天", Count: count8to30})

	// 31-90天
	var count31to90 int64
	query3 := baseQuery.Session(&gorm.Session{})
	query3.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) BETWEEN 31 AND 90
	`, models.BorrowStatusBorrowed, now, now).Count(&count31to90)
	stats = append(stats, OverdueDaysStats{DaysRange: "31-90天", Count: count31to90})

	// 90天以上
	var countOver90 int64
	query4 := baseQuery.Session(&gorm.Session{})
	query4.Where(`
		status = ? AND expected_return_date < ? 
		AND julianday(?) - julianday(expected_return_date) > 90
	`, models.BorrowStatusBorrowed, now, now).Count(&countOver90)
	stats = append(stats, OverdueDaysStats{DaysRange: "90天以上", Count: countOver90})

	return stats
}

// getBorrowMonthlyTrend 获取借用月度趋势
func getBorrowMonthlyTrend(_ *gorm.DB) []MonthlyBorrowStats {
	// 直接使用简化版本，避免复杂的SQL查询
	return getBorrowMonthlyTrendSimple()
}

// getBorrowMonthlyTrendSimple 获取借用月度趋势（简化版本）
func getBorrowMonthlyTrendSimple() []MonthlyBorrowStats {
	var stats []MonthlyBorrowStats

	// 获取最近6个月的数据
	for i := 5; i >= 0; i-- {
		// 计算目标月份
		targetTime := time.Now().AddDate(0, -i, 0)
		monthStart := time.Date(targetTime.Year(), targetTime.Month(), 1, 0, 0, 0, 0, time.UTC)
		monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)

		var borrowCount, returnCount int64

		// 查询借用数据
		global.DB.Model(&models.BorrowRecord{}).
			Where("borrow_date >= ? AND borrow_date <= ?", monthStart, monthEnd).
			Count(&borrowCount)

		// 查询归还数据
		global.DB.Model(&models.BorrowRecord{}).
			Where("actual_return_date >= ? AND actual_return_date <= ?", monthStart, monthEnd).
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
	stats := make([]PopularAssetStats, 0)

	// 获取原始查询的SQL和参数，用于构建统计查询
	sql := query.Statement.SQL.String()
	var args []interface{}
	if query.Statement.Vars != nil {
		args = query.Statement.Vars
	}

	// 构建统计查询，确保继承WHERE条件
	baseQuery := global.DB.Model(&models.BorrowRecord{})
	if sql != "" && len(args) > 0 {
		// 如果有WHERE条件，解析并应用
		whereClause := strings.TrimPrefix(sql, "SELECT * FROM `borrow_records`")
		if strings.HasPrefix(whereClause, " WHERE") {
			baseQuery = baseQuery.Where(strings.TrimPrefix(whereClause, " WHERE"), args...)
		}
	}

	rows, err := baseQuery.Select(`
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

// getBorrowsByBorrower 获取按借用人统计的借用数据
func getBorrowsByBorrower(query *gorm.DB) []BorrowerStats {
	stats := make([]BorrowerStats, 0)

	// 先获取总借用数
	var totalBorrows int64
	query.Count(&totalBorrows)

	// 获取原始查询的SQL和参数，用于构建统计查询
	sql := query.Statement.SQL.String()
	var args []interface{}
	if query.Statement.Vars != nil {
		args = query.Statement.Vars
	}

	// 构建统计查询，确保继承WHERE条件
	baseQuery := global.DB.Model(&models.BorrowRecord{})
	if sql != "" && len(args) > 0 {
		// 如果有WHERE条件，解析并应用
		whereClause := strings.TrimPrefix(sql, "SELECT * FROM `borrow_records`")
		if strings.HasPrefix(whereClause, " WHERE") {
			baseQuery = baseQuery.Where(strings.TrimPrefix(whereClause, " WHERE"), args...)
		}
	}

	rows, err := baseQuery.Select(`
		borrower_name,
		COUNT(*) as borrow_count,
		SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) as active_count,
		SUM(CASE WHEN status = 'borrowed' AND expected_return_date < datetime('now') THEN 1 ELSE 0 END) as overdue_count
	`).
		Group("borrower_name").
		Order("borrow_count DESC").
		Limit(20).
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat BorrowerStats
		rows.Scan(&stat.BorrowerName, &stat.BorrowCount, &stat.ActiveCount, &stat.OverdueCount)

		if totalBorrows > 0 {
			stat.Percentage = float64(stat.BorrowCount) / float64(totalBorrows) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getBorrowsByAssetCategory 获取按资产分类统计的借用数据
func getBorrowsByAssetCategory(query *gorm.DB) []BorrowCategoryStats {
	stats := make([]BorrowCategoryStats, 0)

	// 先获取总借用数
	var totalBorrows int64
	query.Count(&totalBorrows)

	// 获取原始查询的SQL和参数，用于构建统计查询
	sql := query.Statement.SQL.String()
	var args []interface{}
	if query.Statement.Vars != nil {
		args = query.Statement.Vars
	}

	// 构建统计查询，确保继承WHERE条件
	baseQuery := global.DB.Model(&models.BorrowRecord{})
	if sql != "" && len(args) > 0 {
		// 如果有WHERE条件，解析并应用
		whereClause := strings.TrimPrefix(sql, "SELECT * FROM `borrow_records`")
		if strings.HasPrefix(whereClause, " WHERE") {
			baseQuery = baseQuery.Where(strings.TrimPrefix(whereClause, " WHERE"), args...)
		}
	}

	rows, err := baseQuery.Select(`
		c.id as category_id,
		c.name as category_name,
		COUNT(br.id) as borrow_count,
		SUM(CASE WHEN br.status = 'borrowed' THEN 1 ELSE 0 END) as active_count,
		SUM(CASE WHEN br.status = 'borrowed' AND br.expected_return_date < datetime('now') THEN 1 ELSE 0 END) as overdue_count
	`).
		Table("borrow_records br").
		Joins("JOIN assets a ON a.id = br.asset_id").
		Joins("JOIN categories c ON c.id = a.category_id").
		Group("c.id, c.name").
		Order("borrow_count DESC").
		Rows()

	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var stat BorrowCategoryStats
		rows.Scan(&stat.CategoryID, &stat.CategoryName, &stat.BorrowCount, &stat.ActiveCount, &stat.OverdueCount)

		if totalBorrows > 0 {
			stat.Percentage = float64(stat.BorrowCount) / float64(totalBorrows) * 100
		}

		stats = append(stats, stat)
	}

	return stats
}

// getBorrowsByDuration 获取按借用时长统计的数据
func getBorrowsByDuration(query *gorm.DB) []BorrowDurationStats {
	var stats []BorrowDurationStats

	now := time.Now()

	// 短期借用 (1-7天)
	var shortCount int64
	query.Where("julianday(?) - julianday(borrow_date) BETWEEN 1 AND 7", now).Count(&shortCount)

	// 中期借用 (8-30天)
	var mediumCount int64
	query.Where("julianday(?) - julianday(borrow_date) BETWEEN 8 AND 30", now).Count(&mediumCount)

	// 长期借用 (31-90天)
	var longCount int64
	query.Where("julianday(?) - julianday(borrow_date) BETWEEN 31 AND 90", now).Count(&longCount)

	// 超长期借用 (90天以上)
	var veryLongCount int64
	query.Where("julianday(?) - julianday(borrow_date) > 90", now).Count(&veryLongCount)

	var totalBorrows int64
	query.Count(&totalBorrows)

	// 构建统计结果
	durations := []struct {
		range_ string
		count  int64
	}{
		{"1-7天", shortCount},
		{"8-30天", mediumCount},
		{"31-90天", longCount},
		{"90天以上", veryLongCount},
	}

	for _, duration := range durations {
		stat := BorrowDurationStats{
			DurationRange: duration.range_,
			BorrowCount:   duration.count,
		}
		if totalBorrows > 0 {
			stat.Percentage = float64(duration.count) / float64(totalBorrows) * 100
		}
		stats = append(stats, stat)
	}

	return stats
}

// getBorrowTrends 获取借用趋势分析
func getBorrowTrends(query *gorm.DB) BorrowTrends {
	return BorrowTrends{
		WeeklyTrend:   getBorrowWeeklyTrend(query),
		DailyTrend:    getBorrowDailyTrend(query),
		HourlyPattern: getBorrowHourlyPattern(query),
	}
}

// getBorrowWeeklyTrend 获取周度借用趋势
func getBorrowWeeklyTrend(_ *gorm.DB) []WeeklyBorrowStats {
	var stats []WeeklyBorrowStats

	// 获取最近8周的数据
	for i := 7; i >= 0; i-- {
		weekStart := time.Now().AddDate(0, 0, -i*7)
		weekEnd := weekStart.AddDate(0, 0, 6)

		var borrowCount, returnCount int64

		global.DB.Model(&models.BorrowRecord{}).
			Where("borrow_date >= ? AND borrow_date <= ?", weekStart, weekEnd).
			Count(&borrowCount)

		global.DB.Model(&models.BorrowRecord{}).
			Where("actual_return_date >= ? AND actual_return_date <= ?", weekStart, weekEnd).
			Count(&returnCount)

		stats = append(stats, WeeklyBorrowStats{
			Week:        weekStart.Format("2006-01-02"),
			BorrowCount: borrowCount,
			ReturnCount: returnCount,
			NetBorrows:  borrowCount - returnCount,
		})
	}

	return stats
}

// getBorrowDailyTrend 获取日度借用趋势
func getBorrowDailyTrend(_ *gorm.DB) []DailyBorrowStats {
	var stats []DailyBorrowStats

	// 获取最近30天的数据
	for i := 29; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i)
		dateStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
		dateEnd := dateStart.Add(24*time.Hour - time.Second)

		var borrowCount, returnCount int64

		global.DB.Model(&models.BorrowRecord{}).
			Where("borrow_date >= ? AND borrow_date <= ?", dateStart, dateEnd).
			Count(&borrowCount)

		global.DB.Model(&models.BorrowRecord{}).
			Where("actual_return_date >= ? AND actual_return_date <= ?", dateStart, dateEnd).
			Count(&returnCount)

		stats = append(stats, DailyBorrowStats{
			Date:        dateStart.Format("2006-01-02"),
			BorrowCount: borrowCount,
			ReturnCount: returnCount,
			NetBorrows:  borrowCount - returnCount,
		})
	}

	return stats
}

// getBorrowHourlyPattern 获取小时借用模式
func getBorrowHourlyPattern(_ *gorm.DB) []HourlyBorrowStats {
	var stats []HourlyBorrowStats

	// 获取最近30天的小时模式
	for hour := 0; hour < 24; hour++ {
		var borrowCount, returnCount int64

		global.DB.Model(&models.BorrowRecord{}).
			Where("strftime('%H', borrow_date) = ? AND borrow_date >= date('now', '-30 days')",
				fmt.Sprintf("%02d", hour)).
			Count(&borrowCount)

		global.DB.Model(&models.BorrowRecord{}).
			Where("strftime('%H', actual_return_date) = ? AND actual_return_date >= date('now', '-30 days')",
				fmt.Sprintf("%02d", hour)).
			Count(&returnCount)

		stats = append(stats, HourlyBorrowStats{
			Hour:        hour,
			BorrowCount: borrowCount,
			ReturnCount: returnCount,
		})
	}

	return stats
}
