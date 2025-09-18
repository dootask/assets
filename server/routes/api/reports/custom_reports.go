package reports

import (
	"fmt"
	"strconv"
	"strings"

	"asset-management-system/server/global"

	"gorm.io/gorm"
)

// generateCustomAssetReport 生成自定义资产报表
func generateCustomAssetReport(req CustomReportRequest) ([]map[string]interface{}, []CustomReportColumn, int64) {
	var data []map[string]interface{}
	var columns []CustomReportColumn
	var totalCount int64

	// 构建基础查询，添加软删除过滤
	query := global.DB.Debug().Table("assets a").
		Select(buildAssetSelectFields(req.Metrics)).
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id").
		Where("a.deleted_at IS NULL").
		Where("c.deleted_at IS NULL").
		Where("(d.deleted_at IS NULL OR d.id IS NULL)")

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
		return data, columns, totalCount
	}
	defer rows.Close()

	// 获取列信息
	columnNames, _ := rows.Columns()
	values := make([]interface{}, len(columnNames))
	valuePtrs := make([]interface{}, len(columnNames))

	for rows.Next() {
		for i := range columnNames {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)

		record := make(map[string]interface{})
		for i, col := range columnNames {
			val := values[i]
			if b, ok := val.([]byte); ok {
				record[col] = string(b)
			} else {
				record[col] = val
			}
		}
		data = append(data, record)
	}

	// 生成列定义
	columns = generateAssetColumns(req.Metrics)

	return data, columns, totalCount
}

// generateCustomBorrowReport 生成自定义借用报表
func generateCustomBorrowReport(req CustomReportRequest) ([]map[string]interface{}, []CustomReportColumn, int64) {
	var data []map[string]interface{}
	var columns []CustomReportColumn
	var totalCount int64

	// 构建基础查询，添加软删除过滤
	query := global.DB.Table("borrow_records br").
		Select(buildBorrowSelectFields(req.Metrics)).
		Joins("JOIN assets a ON a.id = br.asset_id").
		Joins("LEFT JOIN departments d ON d.id = br.department_id").
		Where("br.deleted_at IS NULL").
		Where("a.deleted_at IS NULL").
		Where("(d.deleted_at IS NULL OR d.id IS NULL)")

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
		return data, columns, totalCount
	}
	defer rows.Close()

	// 获取列信息
	columnNames, _ := rows.Columns()
	values := make([]interface{}, len(columnNames))
	valuePtrs := make([]interface{}, len(columnNames))

	for rows.Next() {
		for i := range columnNames {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)

		record := make(map[string]interface{})
		for i, col := range columnNames {
			val := values[i]
			if b, ok := val.([]byte); ok {
				record[col] = string(b)
			} else {
				record[col] = val
			}
		}
		data = append(data, record)
	}

	// 生成列定义
	columns = generateBorrowColumns(req.Metrics)

	return data, columns, totalCount
}

// generateCustomInventoryReport 生成自定义盘点报表
func generateCustomInventoryReport(req CustomReportRequest) ([]map[string]interface{}, []CustomReportColumn, int64) {
	var data []map[string]interface{}
	var columns []CustomReportColumn
	var totalCount int64

	// 构建基础查询，添加软删除过滤
	query := global.DB.Table("inventory_records ir").
		Select(buildInventorySelectFields(req.Metrics)).
		Joins("JOIN inventory_tasks it ON it.id = ir.task_id").
		Joins("JOIN assets a ON a.id = ir.asset_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id").
		Where("ir.deleted_at IS NULL").
		Where("it.deleted_at IS NULL").
		Where("a.deleted_at IS NULL").
		Where("c.deleted_at IS NULL").
		Where("(d.deleted_at IS NULL OR d.id IS NULL)")

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
		return data, columns, totalCount
	}
	defer rows.Close()

	// 获取列信息
	columnNames, _ := rows.Columns()
	values := make([]interface{}, len(columnNames))
	valuePtrs := make([]interface{}, len(columnNames))

	for rows.Next() {
		for i := range columnNames {
			valuePtrs[i] = &values[i]
		}
		rows.Scan(valuePtrs...)

		record := make(map[string]interface{})
		for i, col := range columnNames {
			val := values[i]
			if b, ok := val.([]byte); ok {
				record[col] = string(b)
			} else {
				record[col] = val
			}
		}
		data = append(data, record)
	}

	// 生成列定义
	columns = generateInventoryColumns(req.Metrics)

	return data, columns, totalCount
}

// buildAssetSelectFields 构建资产查询字段
func buildAssetSelectFields(metrics []string) string {
	if len(metrics) == 0 {
		return "a.id, a.asset_no, a.name, a.purchase_price, a.purchase_date, a.status, c.name as category_name, d.name as department_name"
	}

	var fields []string
	// 总是包含id字段
	fields = append(fields, "a.id")

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

	return strings.Join(fields, ", ")
}

// buildBorrowSelectFields 构建借用查询字段
func buildBorrowSelectFields(metrics []string) string {
	if len(metrics) == 0 {
		return "br.id, a.asset_no, a.name as asset_name, br.borrower_name, br.borrow_date, br.expected_return_date, br.actual_return_date, br.status, d.name as department_name"
	}

	var fields []string
	// 总是包含id字段
	fields = append(fields, "br.id")

	for _, metric := range metrics {
		switch metric {
		case "asset_no":
			fields = append(fields, "a.asset_no")
		case "asset_name":
			fields = append(fields, "a.name as asset_name")
		case "borrower_name":
			fields = append(fields, "br.borrower_name")
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

// generateAssetColumns 生成资产报表列定义
func generateAssetColumns(metrics []string) []CustomReportColumn {
	var columns []CustomReportColumn

	if len(metrics) == 0 {
		// 默认列
		columns = []CustomReportColumn{
			{Key: "id", Label: "ID", Type: "number"},
			{Key: "asset_no", Label: "资产编号", Type: "string"},
			{Key: "name", Label: "资产名称", Type: "string"},
			{Key: "purchase_price", Label: "采购价格", Type: "number"},
			{Key: "purchase_date", Label: "采购日期", Type: "date"},
			{Key: "status", Label: "状态", Type: "string"},
			{Key: "category_name", Label: "分类", Type: "string"},
			{Key: "department_name", Label: "部门", Type: "string"},
		}
	} else {
		for _, metric := range metrics {
			switch metric {
			case "asset_no":
				columns = append(columns, CustomReportColumn{Key: "asset_no", Label: "资产编号", Type: "string"})
			case "name":
				columns = append(columns, CustomReportColumn{Key: "name", Label: "资产名称", Type: "string"})
			case "category_name":
				columns = append(columns, CustomReportColumn{Key: "category_name", Label: "分类", Type: "string"})
			case "department_name":
				columns = append(columns, CustomReportColumn{Key: "department_name", Label: "部门", Type: "string"})
			case "purchase_price":
				columns = append(columns, CustomReportColumn{Key: "purchase_price", Label: "采购价格", Type: "number"})
			case "purchase_date":
				columns = append(columns, CustomReportColumn{Key: "purchase_date", Label: "采购日期", Type: "date"})
			case "status":
				columns = append(columns, CustomReportColumn{Key: "status", Label: "状态", Type: "string"})
			}
		}
	}

	return columns
}

// generateBorrowColumns 生成借用报表列定义
func generateBorrowColumns(metrics []string) []CustomReportColumn {
	var columns []CustomReportColumn

	if len(metrics) == 0 {
		columns = []CustomReportColumn{
			{Key: "id", Label: "ID", Type: "number"},
			{Key: "asset_no", Label: "资产编号", Type: "string"},
			{Key: "asset_name", Label: "资产名称", Type: "string"},
			{Key: "borrower_name", Label: "借用人", Type: "string"},
			{Key: "borrow_date", Label: "借用日期", Type: "date"},
			{Key: "expected_return_date", Label: "预期归还日期", Type: "date"},
			{Key: "actual_return_date", Label: "实际归还日期", Type: "date"},
			{Key: "status", Label: "状态", Type: "string"},
		}
	} else {
		for _, metric := range metrics {
			switch metric {
			case "asset_no":
				columns = append(columns, CustomReportColumn{Key: "asset_no", Label: "资产编号", Type: "string"})
			case "asset_name":
				columns = append(columns, CustomReportColumn{Key: "asset_name", Label: "资产名称", Type: "string"})
			case "borrower_name":
				columns = append(columns, CustomReportColumn{Key: "borrower_name", Label: "借用人", Type: "string"})
			case "borrow_date":
				columns = append(columns, CustomReportColumn{Key: "borrow_date", Label: "借用日期", Type: "date"})
			case "expected_return_date":
				columns = append(columns, CustomReportColumn{Key: "expected_return_date", Label: "预期归还日期", Type: "date"})
			case "actual_return_date":
				columns = append(columns, CustomReportColumn{Key: "actual_return_date", Label: "实际归还日期", Type: "date"})
			case "status":
				columns = append(columns, CustomReportColumn{Key: "status", Label: "状态", Type: "string"})
			}
		}
	}

	return columns
}

// generateInventoryColumns 生成盘点报表列定义
func generateInventoryColumns(metrics []string) []CustomReportColumn {
	var columns []CustomReportColumn

	if len(metrics) == 0 {
		columns = []CustomReportColumn{
			{Key: "id", Label: "ID", Type: "number"},
			{Key: "task_name", Label: "盘点任务", Type: "string"},
			{Key: "asset_no", Label: "资产编号", Type: "string"},
			{Key: "asset_name", Label: "资产名称", Type: "string"},
			{Key: "category_name", Label: "分类", Type: "string"},
			{Key: "department_name", Label: "部门", Type: "string"},
			{Key: "result", Label: "盘点结果", Type: "string"},
			{Key: "check_date", Label: "盘点日期", Type: "date"},
		}
	} else {
		for _, metric := range metrics {
			switch metric {
			case "task_name":
				columns = append(columns, CustomReportColumn{Key: "task_name", Label: "盘点任务", Type: "string"})
			case "asset_no":
				columns = append(columns, CustomReportColumn{Key: "asset_no", Label: "资产编号", Type: "string"})
			case "asset_name":
				columns = append(columns, CustomReportColumn{Key: "asset_name", Label: "资产名称", Type: "string"})
			case "category_name":
				columns = append(columns, CustomReportColumn{Key: "category_name", Label: "分类", Type: "string"})
			case "department_name":
				columns = append(columns, CustomReportColumn{Key: "department_name", Label: "部门", Type: "string"})
			case "result":
				columns = append(columns, CustomReportColumn{Key: "result", Label: "盘点结果", Type: "string"})
			case "check_date":
				columns = append(columns, CustomReportColumn{Key: "check_date", Label: "盘点日期", Type: "date"})
			}
		}
	}

	return columns
}
