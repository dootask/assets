package reports

import (
	"fmt"
	"strconv"
	"strings"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"gorm.io/gorm"
)

// generateCustomAssetReport 生成自定义资产报表
func generateCustomAssetReport(req CustomReportRequest) ([]map[string]interface{}, map[string]interface{}, int64) {
	var data []map[string]interface{}
	var summary map[string]interface{}
	var totalCount int64

	// 构建基础查询
	query := global.DB.Table("assets a").
		Select(buildAssetSelectFields(req.Metrics)).
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id")

	// 应用过滤条件
	query = applyAssetFilters(query, req.Filters)

	// 应用日期范围
	if req.DateRange.StartDate != nil {
		query = query.Where("a.created_at >= ?", *req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("a.created_at <= ?", *req.DateRange.EndDate)
	}

	// 应用分组
	if len(req.GroupBy) > 0 {
		groupFields := make([]string, len(req.GroupBy))
		for i, field := range req.GroupBy {
			groupFields[i] = mapAssetGroupField(field)
		}
		query = query.Group(strings.Join(groupFields, ", "))
	}

	// 应用排序
	if req.SortBy != "" {
		sortField := mapAssetSortField(req.SortBy)
		sortOrder := "ASC"
		if req.SortOrder == "desc" {
			sortOrder = "DESC"
		}
		query = query.Order(fmt.Sprintf("%s %s", sortField, sortOrder))
	}

	// 获取总数
	query.Count(&totalCount)

	// 应用限制
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}

	// 执行查询
	rows, err := query.Rows()
	if err != nil {
		return data, summary, totalCount
	}
	defer rows.Close()

	// 获取列信息
	columns, _ := rows.Columns()
	values := make([]interface{}, len(columns))
	valuePtrs := make([]interface{}, len(columns))

	for rows.Next() {
		for i := range columns {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)

		record := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				record[col] = string(b)
			} else {
				record[col] = val
			}
		}
		data = append(data, record)
	}

	// 生成汇总信息
	summary = generateAssetSummary(req)

	return data, summary, totalCount
}

// generateCustomBorrowReport 生成自定义借用报表
func generateCustomBorrowReport(req CustomReportRequest) ([]map[string]interface{}, map[string]interface{}, int64) {
	var data []map[string]interface{}
	var summary map[string]interface{}
	var totalCount int64

	// 构建基础查询
	query := global.DB.Table("borrow_records br").
		Select(buildBorrowSelectFields(req.Metrics)).
		Joins("JOIN assets a ON a.id = br.asset_id").
		Joins("JOIN users u ON u.id = br.borrower_id").
		Joins("LEFT JOIN departments d ON d.id = br.department_id")

	// 应用过滤条件
	query = applyBorrowFilters(query, req.Filters)

	// 应用日期范围
	if req.DateRange.StartDate != nil {
		query = query.Where("br.borrow_date >= ?", *req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("br.borrow_date <= ?", *req.DateRange.EndDate)
	}

	// 应用分组
	if len(req.GroupBy) > 0 {
		groupFields := make([]string, len(req.GroupBy))
		for i, field := range req.GroupBy {
			groupFields[i] = mapBorrowGroupField(field)
		}
		query = query.Group(strings.Join(groupFields, ", "))
	}

	// 应用排序
	if req.SortBy != "" {
		sortField := mapBorrowSortField(req.SortBy)
		sortOrder := "ASC"
		if req.SortOrder == "desc" {
			sortOrder = "DESC"
		}
		query = query.Order(fmt.Sprintf("%s %s", sortField, sortOrder))
	}

	// 获取总数
	query.Count(&totalCount)

	// 应用限制
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}

	// 执行查询
	rows, err := query.Rows()
	if err != nil {
		return data, summary, totalCount
	}
	defer rows.Close()

	// 获取列信息
	columns, _ := rows.Columns()
	values := make([]interface{}, len(columns))
	valuePtrs := make([]interface{}, len(columns))

	for rows.Next() {
		for i := range columns {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)

		record := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				record[col] = string(b)
			} else {
				record[col] = val
			}
		}
		data = append(data, record)
	}

	// 生成汇总信息
	summary = generateBorrowSummary(req)

	return data, summary, totalCount
}

// generateCustomInventoryReport 生成自定义盘点报表
func generateCustomInventoryReport(req CustomReportRequest) ([]map[string]interface{}, map[string]interface{}, int64) {
	var data []map[string]interface{}
	var summary map[string]interface{}
	var totalCount int64

	// 构建基础查询
	query := global.DB.Table("inventory_records ir").
		Select(buildInventorySelectFields(req.Metrics)).
		Joins("JOIN inventory_tasks it ON it.id = ir.task_id").
		Joins("JOIN assets a ON a.id = ir.asset_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id")

	// 应用过滤条件
	query = applyInventoryFilters(query, req.Filters)

	// 应用日期范围
	if req.DateRange.StartDate != nil {
		query = query.Where("ir.checked_at >= ?", *req.DateRange.StartDate)
	}
	if req.DateRange.EndDate != nil {
		query = query.Where("ir.checked_at <= ?", *req.DateRange.EndDate)
	}

	// 应用分组
	if len(req.GroupBy) > 0 {
		groupFields := make([]string, len(req.GroupBy))
		for i, field := range req.GroupBy {
			groupFields[i] = mapInventoryGroupField(field)
		}
		query = query.Group(strings.Join(groupFields, ", "))
	}

	// 应用排序
	if req.SortBy != "" {
		sortField := mapInventorySortField(req.SortBy)
		sortOrder := "ASC"
		if req.SortOrder == "desc" {
			sortOrder = "DESC"
		}
		query = query.Order(fmt.Sprintf("%s %s", sortField, sortOrder))
	}

	// 获取总数
	query.Count(&totalCount)

	// 应用限制
	if req.Limit > 0 {
		query = query.Limit(req.Limit)
	}

	// 执行查询
	rows, err := query.Rows()
	if err != nil {
		return data, summary, totalCount
	}
	defer rows.Close()

	// 获取列信息
	columns, _ := rows.Columns()
	values := make([]interface{}, len(columns))
	valuePtrs := make([]interface{}, len(columns))

	for rows.Next() {
		for i := range columns {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)

		record := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				record[col] = string(b)
			} else {
				record[col] = val
			}
		}
		data = append(data, record)
	}

	// 生成汇总信息
	summary = generateInventorySummary(req)

	return data, summary, totalCount
}

// buildAssetSelectFields 构建资产查询字段
func buildAssetSelectFields(metrics []string) string {
	if len(metrics) == 0 {
		return "a.id, a.asset_no, a.name, a.purchase_price, a.purchase_date, a.status, c.name as category_name, d.name as department_name"
	}

	var fields []string
	for _, metric := range metrics {
		switch metric {
		case "asset_no":
			fields = append(fields, "a.asset_no")
		case "name":
			fields = append(fields, "a.name")
		case "category_name":
			fields = append(fields, "c.name as category_name")
		case "department_name":
			fields = append(fields, "d.name as department_name")
		case "purchase_price":
			fields = append(fields, "a.purchase_price")
		case "purchase_date":
			fields = append(fields, "a.purchase_date")
		case "status":
			fields = append(fields, "a.status")
		case "brand":
			fields = append(fields, "a.brand")
		case "model":
			fields = append(fields, "a.model")
		case "location":
			fields = append(fields, "a.location")
		}
	}

	if len(fields) == 0 {
		return "a.id"
	}

	return strings.Join(fields, ", ")
}

// buildBorrowSelectFields 构建借用查询字段
func buildBorrowSelectFields(metrics []string) string {
	if len(metrics) == 0 {
		return "br.id, a.asset_no, a.name as asset_name, u.name as borrower_name, br.borrow_date, br.expected_return_date, br.actual_return_date, br.status, d.name as department_name"
	}

	var fields []string
	for _, metric := range metrics {
		switch metric {
		case "asset_no":
			fields = append(fields, "a.asset_no")
		case "asset_name":
			fields = append(fields, "a.name as asset_name")
		case "borrower_name":
			fields = append(fields, "u.name as borrower_name")
		case "department_name":
			fields = append(fields, "d.name as department_name")
		case "borrow_date":
			fields = append(fields, "br.borrow_date")
		case "expected_return_date":
			fields = append(fields, "br.expected_return_date")
		case "actual_return_date":
			fields = append(fields, "br.actual_return_date")
		case "status":
			fields = append(fields, "br.status")
		case "purpose":
			fields = append(fields, "br.purpose")
		}
	}

	if len(fields) == 0 {
		return "br.id"
	}

	return strings.Join(fields, ", ")
}

// buildInventorySelectFields 构建盘点查询字段
func buildInventorySelectFields(metrics []string) string {
	if len(metrics) == 0 {
		return "ir.id, it.task_name, a.asset_no, a.name as asset_name, ir.result, ir.checked_at, ir.checked_by, c.name as category_name, d.name as department_name"
	}

	var fields []string
	for _, metric := range metrics {
		switch metric {
		case "task_name":
			fields = append(fields, "it.task_name")
		case "asset_no":
			fields = append(fields, "a.asset_no")
		case "asset_name":
			fields = append(fields, "a.name as asset_name")
		case "category_name":
			fields = append(fields, "c.name as category_name")
		case "department_name":
			fields = append(fields, "d.name as department_name")
		case "result":
			fields = append(fields, "ir.result")
		case "checked_at":
			fields = append(fields, "ir.checked_at")
		case "checked_by":
			fields = append(fields, "ir.checked_by")
		case "notes":
			fields = append(fields, "ir.notes")
		}
	}

	if len(fields) == 0 {
		return "ir.id"
	}

	return strings.Join(fields, ", ")
}

// applyAssetFilters 应用资产过滤条件
func applyAssetFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	for key, value := range filters {
		if value == nil || value == "" {
			continue
		}

		switch key {
		case "category_id":
			if categoryID, err := strconv.Atoi(fmt.Sprintf("%v", value)); err == nil {
				query = query.Where("a.category_id = ?", categoryID)
			}
		case "department_id":
			if departmentID, err := strconv.Atoi(fmt.Sprintf("%v", value)); err == nil {
				query = query.Where("a.department_id = ?", departmentID)
			}
		case "status":
			query = query.Where("a.status = ?", value)
		case "brand":
			query = query.Where("a.brand LIKE ?", "%"+fmt.Sprintf("%v", value)+"%")
		case "name":
			query = query.Where("a.name LIKE ?", "%"+fmt.Sprintf("%v", value)+"%")
		}
	}
	return query
}

// applyBorrowFilters 应用借用过滤条件
func applyBorrowFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	for key, value := range filters {
		if value == nil || value == "" {
			continue
		}

		switch key {
		case "department_id":
			if departmentID, err := strconv.Atoi(fmt.Sprintf("%v", value)); err == nil {
				query = query.Where("br.department_id = ?", departmentID)
			}
		case "status":
			query = query.Where("br.status = ?", value)
		case "borrower_name":
			query = query.Where("u.name LIKE ?", "%"+fmt.Sprintf("%v", value)+"%")
		}
	}
	return query
}

// applyInventoryFilters 应用盘点过滤条件
func applyInventoryFilters(query *gorm.DB, filters map[string]interface{}) *gorm.DB {
	for key, value := range filters {
		if value == nil || value == "" {
			continue
		}

		switch key {
		case "task_id":
			if taskID, err := strconv.Atoi(fmt.Sprintf("%v", value)); err == nil {
				query = query.Where("ir.task_id = ?", taskID)
			}
		case "result":
			query = query.Where("ir.result = ?", value)
		case "category_id":
			if categoryID, err := strconv.Atoi(fmt.Sprintf("%v", value)); err == nil {
				query = query.Where("a.category_id = ?", categoryID)
			}
		case "department_id":
			if departmentID, err := strconv.Atoi(fmt.Sprintf("%v", value)); err == nil {
				query = query.Where("a.department_id = ?", departmentID)
			}
		}
	}
	return query
}

// 字段映射函数
func mapAssetGroupField(field string) string {
	fieldMap := map[string]string{
		"category_name":   "c.name",
		"department_name": "d.name",
		"status":          "a.status",
		"brand":           "a.brand",
	}
	if mapped, ok := fieldMap[field]; ok {
		return mapped
	}
	return "a." + field
}

func mapAssetSortField(field string) string {
	fieldMap := map[string]string{
		"category_name":   "c.name",
		"department_name": "d.name",
		"purchase_price":  "a.purchase_price",
		"purchase_date":   "a.purchase_date",
	}
	if mapped, ok := fieldMap[field]; ok {
		return mapped
	}
	return "a." + field
}

func mapBorrowGroupField(field string) string {
	fieldMap := map[string]string{
		"department_name": "d.name",
		"borrower_name":   "u.name",
		"status":          "br.status",
	}
	if mapped, ok := fieldMap[field]; ok {
		return mapped
	}
	return "br." + field
}

func mapBorrowSortField(field string) string {
	fieldMap := map[string]string{
		"asset_name":      "a.name",
		"borrower_name":   "u.name",
		"department_name": "d.name",
		"borrow_date":     "br.borrow_date",
	}
	if mapped, ok := fieldMap[field]; ok {
		return mapped
	}
	return "br." + field
}

func mapInventoryGroupField(field string) string {
	fieldMap := map[string]string{
		"task_name":       "it.task_name",
		"category_name":   "c.name",
		"department_name": "d.name",
		"result":          "ir.result",
	}
	if mapped, ok := fieldMap[field]; ok {
		return mapped
	}
	return "ir." + field
}

func mapInventorySortField(field string) string {
	fieldMap := map[string]string{
		"task_name":       "it.task_name",
		"asset_name":      "a.name",
		"category_name":   "c.name",
		"department_name": "d.name",
		"checked_at":      "ir.checked_at",
	}
	if mapped, ok := fieldMap[field]; ok {
		return mapped
	}
	return "ir." + field
}

// 汇总信息生成函数
func generateAssetSummary(req CustomReportRequest) map[string]interface{} {
	summary := make(map[string]interface{})

	var totalAssets, totalValue int64
	var avgValue float64

	query := global.DB.Model(&models.Asset{})
	query = applyAssetFilters(query, req.Filters)

	query.Count(&totalAssets)

	// 安全地获取总价值
	row1 := query.Select("SUM(purchase_price)").Row()
	if row1 != nil {
		var totalValuePtr *float64
		err := row1.Scan(&totalValuePtr)
		if err == nil && totalValuePtr != nil {
			totalValue = int64(*totalValuePtr)
		}
	}

	// 安全地获取平均价值
	row2 := query.Select("AVG(purchase_price)").Row()
	if row2 != nil {
		var avgValuePtr *float64
		err := row2.Scan(&avgValuePtr)
		if err == nil && avgValuePtr != nil {
			avgValue = *avgValuePtr
		}
	}

	summary["total_assets"] = totalAssets
	summary["total_value"] = totalValue
	summary["average_value"] = avgValue

	return summary
}

func generateBorrowSummary(req CustomReportRequest) map[string]interface{} {
	summary := make(map[string]interface{})

	var totalBorrows, activeBorrows, returnedBorrows int64

	query := global.DB.Model(&models.BorrowRecord{})
	query = applyBorrowFilters(query, req.Filters)

	query.Count(&totalBorrows)
	query.Where("status = ?", models.BorrowStatusBorrowed).Count(&activeBorrows)
	query.Where("status = ?", models.BorrowStatusReturned).Count(&returnedBorrows)

	summary["total_borrows"] = totalBorrows
	summary["active_borrows"] = activeBorrows
	summary["returned_borrows"] = returnedBorrows

	return summary
}

func generateInventorySummary(req CustomReportRequest) map[string]interface{} {
	summary := make(map[string]interface{})

	var totalRecords, normalCount int64

	query := global.DB.Model(&models.InventoryRecord{})
	query = applyInventoryFilters(query, req.Filters)

	query.Count(&totalRecords)
	query.Where("result = ?", models.InventoryResultNormal).Count(&normalCount)

	var accuracyRate float64
	if totalRecords > 0 {
		accuracyRate = float64(normalCount) / float64(totalRecords) * 100
	}

	summary["total_records"] = totalRecords
	summary["normal_count"] = normalCount
	summary["accuracy_rate"] = accuracyRate

	return summary
}
