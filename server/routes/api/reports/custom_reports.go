package reports

import (
	"strings"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"gorm.io/gorm"
)

// generateCustomAssetReport 生成自定义资产报表
func generateCustomAssetReport(req CustomReportRequest) ([]map[string]interface{}, map[string]interface{}, int64) {
	query := global.DB.Model(&models.Asset{})
	
	// 应用日期范围过滤
	if req.DateRange.StartDate != nil {
		query = query.Where("created_at >= ?", req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("created_at <= ?", req.DateRange.EndDate)
	}
	
	// 应用其他过滤条件
	query = applyAssetFilters(query, req.Filters)
	
	// 构建选择字段
	selectFields := buildAssetSelectFields(req.Metrics, req.GroupBy)
	
	// 构建分组和排序
	if len(req.GroupBy) > 0 {
		query = query.Group(strings.Join(req.GroupBy, ", "))
	}
	
	if req.SortBy != "" {
		order := req.SortBy
		if req.SortOrder == "desc" {
			order += " DESC"
		}
		query = query.Order(order)
	}
	
	// 应用限制
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}
	
	// 执行查询
	var data []map[string]interface{}
	rows, err := query.Select(selectFields).Rows()
	if err != nil {
		return data, nil, 0
	}
	defer rows.Close()
	
	// 获取列名
	columns, _ := rows.Columns()
	
	// 读取数据
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		
		rows.Scan(valuePtrs...)
		
		row := make(map[string]interface{})
		for i, col := range columns {
			row[col] = values[i]
		}
		data = append(data, row)
	}
	
	// 生成汇总信息
	summary := generateAssetReportSummary(req)
	
	return data, summary, int64(len(data))
}

// generateCustomBorrowReport 生成自定义借用报表
func generateCustomBorrowReport(req CustomReportRequest) ([]map[string]interface{}, map[string]interface{}, int64) {
	query := global.DB.Model(&models.BorrowRecord{})
	
	// 应用日期范围过滤
	if req.DateRange.StartDate != nil {
		query = query.Where("borrow_date >= ?", req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("borrow_date <= ?", req.DateRange.EndDate)
	}
	
	// 应用其他过滤条件
	query = applyBorrowFilters(query, req.Filters)
	
	// 构建选择字段
	selectFields := buildBorrowSelectFields(req.Metrics, req.GroupBy)
	
	// 构建分组和排序
	if len(req.GroupBy) > 0 {
		query = query.Group(strings.Join(req.GroupBy, ", "))
	}
	
	if req.SortBy != "" {
		order := req.SortBy
		if req.SortOrder == "desc" {
			order += " DESC"
		}
		query = query.Order(order)
	}
	
	// 应用限制
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}
	
	// 执行查询
	var data []map[string]interface{}
	rows, err := query.Select(selectFields).Rows()
	if err != nil {
		return data, nil, 0
	}
	defer rows.Close()
	
	// 获取列名
	columns, _ := rows.Columns()
	
	// 读取数据
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		
		rows.Scan(valuePtrs...)
		
		row := make(map[string]interface{})
		for i, col := range columns {
			row[col] = values[i]
		}
		data = append(data, row)
	}
	
	// 生成汇总信息
	summary := generateBorrowReportSummary(req)
	
	return data, summary, int64(len(data))
}

// generateCustomInventoryReport 生成自定义盘点报表
func generateCustomInventoryReport(req CustomReportRequest) ([]map[string]interface{}, map[string]interface{}, int64) {
	query := global.DB.Model(&models.InventoryRecord{})
	
	// 应用日期范围过滤
	if req.DateRange.StartDate != nil {
		query = query.Where("created_at >= ?", req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("created_at <= ?", req.DateRange.EndDate)
	}
	
	// 应用其他过滤条件
	query = applyInventoryFilters(query, req.Filters)
	
	// 构建选择字段
	selectFields := buildInventorySelectFields(req.Metrics, req.GroupBy)
	
	// 构建分组和排序
	if len(req.GroupBy) > 0 {
		query = query.Group(strings.Join(req.GroupBy, ", "))
	}
	
	if req.SortBy != "" {
		order := req.SortBy
		if req.SortOrder == "desc" {
			order += " DESC"
		}
		query = query.Order(order)
	}
	
	// 应用限制
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}
	
	// 执行查询
	var data []map[string]interface{}
	rows, err := query.Select(selectFields).Rows()
	if err != nil {
		return data, nil, 0
	}
	defer rows.Close()
	
	// 获取列名
	columns, _ := rows.Columns()
	
	// 读取数据
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}
		
		rows.Scan(valuePtrs...)
		
		row := make(map[string]interface{})
		for i, col := range columns {
			row[col] = values[i]
		}
		data = append(data, row)
	}
	
	// 生成汇总信息
	summary := generateInventoryReportSummary(req)
	
	return data, summary, int64(len(data))
}

// applyAssetFilters 应用资产过滤条件
func applyAssetFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	for key, value := range filters {
		switch key {
		case "category_id":
			if categoryID, ok := value.(float64); ok {
				query = query.Where("category_id = ?", uint(categoryID))
			}
		case "department_id":
			if departmentID, ok := value.(float64); ok {
				query = query.Where("department_id = ?", uint(departmentID))
			}
		case "status":
			if status, ok := value.(string); ok {
				query = query.Where("status = ?", status)
			}
		case "location":
			if location, ok := value.(string); ok {
				query = query.Where("location LIKE ?", "%"+location+"%")
			}
		}
	}
	return query
}

// applyBorrowFilters 应用借用过滤条件
func applyBorrowFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	for key, value := range filters {
		switch key {
		case "department_id":
			if departmentID, ok := value.(float64); ok {
				query = query.Where("department_id = ?", uint(departmentID))
			}
		case "status":
			if status, ok := value.(string); ok {
				query = query.Where("status = ?", status)
			}
		case "borrower_name":
			if borrowerName, ok := value.(string); ok {
				query = query.Where("borrower_name LIKE ?", "%"+borrowerName+"%")
			}
		}
	}
	return query
}

// applyInventoryFilters 应用盘点过滤条件
func applyInventoryFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	for key, value := range filters {
		switch key {
		case "task_id":
			if taskID, ok := value.(float64); ok {
				query = query.Where("task_id = ?", uint(taskID))
			}
		case "result":
			if result, ok := value.(string); ok {
				query = query.Where("result = ?", result)
			}
		}
	}
	return query
}

// buildAssetSelectFields 构建资产查询字段
func buildAssetSelectFields(metrics []string, groupBy []string) string {
	var fields []string
	
	// 添加分组字段
	for _, field := range groupBy {
		fields = append(fields, field)
	}
	
	// 添加指标字段
	for _, metric := range metrics {
		switch metric {
		case "count":
			fields = append(fields, "COUNT(*) as count")
		case "total_value":
			fields = append(fields, "SUM(purchase_price) as total_value")
		case "avg_value":
			fields = append(fields, "AVG(purchase_price) as avg_value")
		default:
			fields = append(fields, metric)
		}
	}
	
	if len(fields) == 0 {
		return "*"
	}
	
	return strings.Join(fields, ", ")
}

// buildBorrowSelectFields 构建借用查询字段
func buildBorrowSelectFields(metrics []string, groupBy []string) string {
	var fields []string
	
	// 添加分组字段
	for _, field := range groupBy {
		fields = append(fields, field)
	}
	
	// 添加指标字段
	for _, metric := range metrics {
		switch metric {
		case "count":
			fields = append(fields, "COUNT(*) as count")
		case "avg_days":
			fields = append(fields, "AVG(julianday(COALESCE(actual_return_date, datetime('now'))) - julianday(borrow_date)) as avg_days")
		default:
			fields = append(fields, metric)
		}
	}
	
	if len(fields) == 0 {
		return "*"
	}
	
	return strings.Join(fields, ", ")
}

// buildInventorySelectFields 构建盘点查询字段
func buildInventorySelectFields(metrics []string, groupBy []string) string {
	var fields []string
	
	// 添加分组字段
	for _, field := range groupBy {
		fields = append(fields, field)
	}
	
	// 添加指标字段
	for _, metric := range metrics {
		switch metric {
		case "count":
			fields = append(fields, "COUNT(*) as count")
		case "accuracy_rate":
			fields = append(fields, "ROUND(SUM(CASE WHEN result = 'normal' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy_rate")
		default:
			fields = append(fields, metric)
		}
	}
	
	if len(fields) == 0 {
		return "*"
	}
	
	return strings.Join(fields, ", ")
}

// generateAssetReportSummary 生成资产报表汇总
func generateAssetReportSummary(req CustomReportRequest) map[string]interface{} {
	summary := make(map[string]interface{})
	
	query := global.DB.Model(&models.Asset{})
	
	// 应用相同的过滤条件
	if req.DateRange.StartDate != nil {
		query = query.Where("created_at >= ?", req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("created_at <= ?", req.DateRange.EndDate)
	}
	query = applyAssetFilters(query, req.Filters)
	
	// 计算汇总指标
	var totalCount int64
	var totalValue *float64
	
	query.Count(&totalCount)
	query.Select("SUM(purchase_price)").Row().Scan(&totalValue)
	
	summary["total_count"] = totalCount
	if totalValue != nil {
		summary["total_value"] = *totalValue
	} else {
		summary["total_value"] = 0
	}
	
	return summary
}

// generateBorrowReportSummary 生成借用报表汇总
func generateBorrowReportSummary(req CustomReportRequest) map[string]interface{} {
	summary := make(map[string]interface{})
	
	query := global.DB.Model(&models.BorrowRecord{})
	
	// 应用相同的过滤条件
	if req.DateRange.StartDate != nil {
		query = query.Where("borrow_date >= ?", req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("borrow_date <= ?", req.DateRange.EndDate)
	}
	query = applyBorrowFilters(query, req.Filters)
	
	// 计算汇总指标
	var totalCount, activeCount int64
	
	query.Count(&totalCount)
	query.Where("status = ?", models.BorrowStatusBorrowed).Count(&activeCount)
	
	summary["total_count"] = totalCount
	summary["active_count"] = activeCount
	
	return summary
}

// generateInventoryReportSummary 生成盘点报表汇总
func generateInventoryReportSummary(req CustomReportRequest) map[string]interface{} {
	summary := make(map[string]interface{})
	
	query := global.DB.Model(&models.InventoryRecord{})
	
	// 应用相同的过滤条件
	if req.DateRange.StartDate != nil {
		query = query.Where("created_at >= ?", req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("created_at <= ?", req.DateRange.EndDate)
	}
	query = applyInventoryFilters(query, req.Filters)
	
	// 计算汇总指标
	var totalCount, normalCount int64
	
	query.Count(&totalCount)
	query.Where("result = ?", models.InventoryResultNormal).Count(&normalCount)
	
	summary["total_count"] = totalCount
	summary["normal_count"] = normalCount
	
	if totalCount > 0 {
		summary["accuracy_rate"] = float64(normalCount) / float64(totalCount) * 100
	} else {
		summary["accuracy_rate"] = 0
	}
	
	return summary
}