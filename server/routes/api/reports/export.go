package reports

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

// exportAssetReportsToExcel 导出资产报表到Excel
func exportAssetReportsToExcel(c *gin.Context, parameters map[string]interface{}) {
	// 获取报表数据（复用GetAssetReports的逻辑）
	// 这里简化处理，实际应该重构共同逻辑

	f := excelize.NewFile()
	defer f.Close()

	// 创建工作表
	sheetName := "资产统计报表"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置表头
	headers := []string{"资产编号", "资产名称", "分类", "部门", "状态", "采购价格", "采购日期", "位置"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

	// 获取数据并填充
	// 这里应该调用实际的数据获取逻辑
	// 为了演示，我们创建一些示例数据
	sampleData := [][]interface{}{
		{"A001", "笔记本电脑", "电子设备", "IT部", "可用", 5000.00, "2023-01-15", "办公室A"},
		{"A002", "打印机", "办公设备", "行政部", "借用中", 2000.00, "2023-02-20", "办公室B"},
	}

	for i, row := range sampleData {
		for j, value := range row {
			cell := fmt.Sprintf("%c%d", 'A'+j, i+2)
			f.SetCellValue(sheetName, cell, value)
		}
	}

	// 设置活动工作表
	f.SetActiveSheet(index)

	// 设置响应头
	filename := fmt.Sprintf("资产统计报表_%s.xlsx", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// 输出文件
	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "导出文件失败",
			"data":    err.Error(),
		})
		return
	}

	// 记录报表生成
	fileSize := int64(1024 * 1024) // 示例文件大小，实际应该获取真实大小
	go recordReportGeneration(filename, models.ReportRecordTypeAsset, filename, &fileSize, "系统用户", parameters)
}

// exportAssetReportsToCSV 导出资产报表到CSV
func exportAssetReportsToCSV(c *gin.Context, parameters map[string]interface{}) {
	// 设置响应头
	filename := fmt.Sprintf("资产统计报表_%s.csv", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// 创建CSV写入器
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// 写入表头
	headers := []string{"资产编号", "资产名称", "分类", "部门", "状态", "采购价格", "采购日期", "位置"}
	if err := writer.Write(headers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "写入CSV表头失败",
			"data":    err.Error(),
		})
		return
	}

	// 写入数据
	// 这里应该调用实际的数据获取逻辑
	sampleData := [][]string{
		{"A001", "笔记本电脑", "电子设备", "IT部", "可用", "5000.00", "2023-01-15", "办公室A"},
		{"A002", "打印机", "办公设备", "行政部", "借用中", "2000.00", "2023-02-20", "办公室B"},
	}

	for _, row := range sampleData {
		if err := writer.Write(row); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "EXPORT_ERROR",
				"message": "写入CSV数据失败",
				"data":    err.Error(),
			})
			return
		}
	}

	// 记录报表生成
	fileSize := int64(512 * 1024) // 示例文件大小，实际应该获取真实大小
	go recordReportGeneration(filename, models.ReportRecordTypeAsset, filename, &fileSize, "系统用户", parameters)
}

// exportBorrowReportsToExcel 导出借用报表到Excel
func exportBorrowReportsToExcel(c *gin.Context, parameters map[string]interface{}) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "借用统计报表"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置表头
	headers := []string{"借用编号", "资产编号", "资产名称", "借用人", "借用日期", "预计归还日期", "实际归还日期", "状态"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

	// 示例数据
	sampleData := [][]interface{}{
		{1, "A001", "笔记本电脑", "张三", "2023-01-15", "2023-01-22", "2023-01-20", "已归还"},
		{2, "A002", "打印机", "李四", "2023-02-20", "2023-02-27", nil, "借用中"},
	}

	for i, row := range sampleData {
		for j, value := range row {
			cell := fmt.Sprintf("%c%d", 'A'+j, i+2)
			f.SetCellValue(sheetName, cell, value)
		}
	}

	f.SetActiveSheet(index)

	filename := fmt.Sprintf("借用统计报表_%s.xlsx", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "导出文件失败",
			"data":    err.Error(),
		})
		return
	}

	// 记录报表生成
	fileSize := int64(1024 * 1024) // 示例文件大小，实际应该获取真实大小
	go recordReportGeneration(filename, models.ReportRecordTypeBorrow, filename, &fileSize, "系统用户", parameters)
}

// exportBorrowReportsToCSV 导出借用报表到CSV
func exportBorrowReportsToCSV(c *gin.Context, parameters map[string]interface{}) {
	filename := fmt.Sprintf("借用统计报表_%s.csv", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	headers := []string{"借用编号", "资产编号", "资产名称", "借用人", "借用日期", "预计归还日期", "实际归还日期", "状态"}
	writer.Write(headers)

	sampleData := [][]string{
		{"1", "A001", "笔记本电脑", "张三", "2023-01-15", "2023-01-22", "2023-01-20", "已归还"},
		{"2", "A002", "打印机", "李四", "2023-02-20", "2023-02-27", "", "借用中"},
	}

	for _, row := range sampleData {
		writer.Write(row)
	}

	// 记录报表生成
	fileSize := int64(512 * 1024) // 示例文件大小，实际应该获取真实大小
	go recordReportGeneration(filename, models.ReportRecordTypeBorrow, filename, &fileSize, "系统用户", parameters)
}

// exportInventoryReportsToExcel 导出盘点报表到Excel
func exportInventoryReportsToExcel(c *gin.Context, parameters map[string]interface{}) {
	f := excelize.NewFile()
	defer f.Close()

	// 获取查询参数
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	taskType := c.Query("task_type")
	status := c.Query("status")
	categoryID := c.Query("category_id")
	departmentID := c.Query("department_id")

	// 构建查询条件
	query := global.DB.Model(&models.InventoryTask{})

	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", start)
		}
	}

	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at <= ?", end.Add(24*time.Hour))
		}
	}

	if taskType != "" {
		query = query.Where("task_type = ?", taskType)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取盘点任务数据
	var tasks []models.InventoryTask
	if err := query.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点任务失败",
			"data":    err.Error(),
		})
		return
	}

	// 创建多个工作表
	// 1. 盘点任务概览
	overviewSheet := "盘点任务概览"
	overviewIndex, err := f.NewSheet(overviewSheet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置概览表头
	overviewHeaders := []string{"任务ID", "任务名称", "任务类型", "状态", "开始日期", "结束日期", "总资产数", "已检查数", "正常数", "盘盈数", "盘亏数", "损坏数", "准确率"}
	for i, header := range overviewHeaders {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(overviewSheet, cell, header)
	}

	// 设置概览表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(overviewSheet, "A1", fmt.Sprintf("%c1", 'A'+len(overviewHeaders)-1), headerStyle)

	// 填充概览数据
	rowIndex := 2
	for _, task := range tasks {
		// 获取该任务的盘点记录统计
		var stats struct {
			TotalAssets   int64
			CheckedAssets int64
			NormalCount   int64
			SurplusCount  int64
			DeficitCount  int64
			DamagedCount  int64
		}

		global.DB.Model(&models.InventoryRecord{}).
			Where("task_id = ?", task.ID).
			Select(`
				COUNT(DISTINCT asset_id) as total_assets,
				COUNT(*) as checked_assets,
				SUM(CASE WHEN result = 'normal' THEN 1 ELSE 0 END) as normal_count,
				SUM(CASE WHEN result = 'surplus' THEN 1 ELSE 0 END) as surplus_count,
				SUM(CASE WHEN result = 'deficit' THEN 1 ELSE 0 END) as deficit_count,
				SUM(CASE WHEN result = 'damaged' THEN 1 ELSE 0 END) as damaged_count
			`).
			Scan(&stats)

		// 计算准确率
		accuracyRate := 0.0
		if stats.CheckedAssets > 0 {
			accuracyRate = float64(stats.NormalCount) / float64(stats.CheckedAssets) * 100
		}

		// 任务类型显示
		taskTypeDisplay := task.TaskType
		switch task.TaskType {
		case "full":
			taskTypeDisplay = "全盘"
		case "department":
			taskTypeDisplay = "按部门盘点"
		case "category":
			taskTypeDisplay = "按分类盘点"
		case "spot":
			taskTypeDisplay = "抽查"
		}

		// 状态显示
		statusDisplay := task.Status
		switch task.Status {
		case "pending":
			statusDisplay = "待开始"
		case "in_progress":
			statusDisplay = "进行中"
		case "completed":
			statusDisplay = "已完成"
		}

		// 填充数据
		data := []interface{}{
			task.ID,
			task.TaskName,
			taskTypeDisplay,
			statusDisplay,
			task.StartDate,
			task.EndDate,
			stats.TotalAssets,
			stats.CheckedAssets,
			stats.NormalCount,
			stats.SurplusCount,
			stats.DeficitCount,
			stats.DamagedCount,
			fmt.Sprintf("%.2f%%", accuracyRate),
		}

		for j, value := range data {
			cell := fmt.Sprintf("%c%d", 'A'+j, rowIndex)
			f.SetCellValue(overviewSheet, cell, value)
		}
		rowIndex++
	}

	// 2. 详细盘点记录
	detailSheet := "详细盘点记录"
	_, err = f.NewSheet(detailSheet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置详细记录表头
	detailHeaders := []string{"任务名称", "资产编号", "资产名称", "分类", "部门", "预期状态", "实际状态", "盘点结果", "盘点人", "盘点时间", "备注"}
	for i, header := range detailHeaders {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(detailSheet, cell, header)
	}

	// 设置详细记录表头样式
	f.SetCellStyle(detailSheet, "A1", fmt.Sprintf("%c1", 'A'+len(detailHeaders)-1), headerStyle)

	// 获取详细盘点记录
	var records []struct {
		TaskName       string    `json:"task_name"`
		AssetNo        string    `json:"asset_no"`
		AssetName      string    `json:"asset_name"`
		CategoryName   string    `json:"category_name"`
		DepartmentName string    `json:"department_name"`
		ExpectedStatus string    `json:"expected_status"`
		ActualStatus   string    `json:"actual_status"`
		Result         string    `json:"result"`
		CheckerName    string    `json:"checker_name"`
		CheckedAt      time.Time `json:"checked_at"`
		Notes          string    `json:"notes"`
	}

	// 构建查询
	recordQuery := global.DB.Table("inventory_records ir").
		Select(`
			it.task_name,
			a.asset_no,
			a.name as asset_name,
			c.name as category_name,
			d.name as department_name,
			a.status as expected_status,
			ir.actual_status,
			ir.result,
			ir.checker_name,
			ir.checked_at,
			ir.notes
		`).
		Joins("JOIN inventory_tasks it ON it.id = ir.task_id").
		Joins("JOIN assets a ON a.id = ir.asset_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id")

	// 应用筛选条件
	if len(tasks) > 0 {
		var taskIDs []uint
		for _, task := range tasks {
			taskIDs = append(taskIDs, task.ID)
		}
		recordQuery = recordQuery.Where("ir.task_id IN ?", taskIDs)
	}

	if categoryID != "" {
		recordQuery = recordQuery.Where("a.category_id = ?", categoryID)
	}

	if departmentID != "" {
		recordQuery = recordQuery.Where("a.department_id = ?", departmentID)
	}

	recordQuery = recordQuery.Order("ir.checked_at DESC")

	if err := recordQuery.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点记录失败",
			"data":    err.Error(),
		})
		return
	}

	// 填充详细记录数据
	rowIndex = 2
	for _, record := range records {
		// 状态显示转换
		expectedStatusDisplay := record.ExpectedStatus
		actualStatusDisplay := record.ActualStatus
		resultDisplay := record.Result

		switch record.ExpectedStatus {
		case "available":
			expectedStatusDisplay = "可用"
		case "borrowed":
			expectedStatusDisplay = "借用中"
		case "maintenance":
			expectedStatusDisplay = "维护中"
		case "scrapped":
			expectedStatusDisplay = "已报废"
		}

		switch record.ActualStatus {
		case "available":
			actualStatusDisplay = "可用"
		case "borrowed":
			actualStatusDisplay = "借用中"
		case "maintenance":
			actualStatusDisplay = "维护中"
		case "scrapped":
			actualStatusDisplay = "已报废"
		}

		switch record.Result {
		case "normal":
			resultDisplay = "正常"
		case "surplus":
			resultDisplay = "盘盈"
		case "deficit":
			resultDisplay = "盘亏"
		case "damaged":
			resultDisplay = "损坏"
		}

		data := []interface{}{
			record.TaskName,
			record.AssetNo,
			record.AssetName,
			record.CategoryName,
			record.DepartmentName,
			expectedStatusDisplay,
			actualStatusDisplay,
			resultDisplay,
			record.CheckerName,
			record.CheckedAt.Format("2006-01-02 15:04:05"),
			record.Notes,
		}

		for j, value := range data {
			cell := fmt.Sprintf("%c%d", 'A'+j, rowIndex)
			f.SetCellValue(detailSheet, cell, value)
		}
		rowIndex++
	}

	// 设置活动工作表为概览
	f.SetActiveSheet(overviewIndex)

	filename := fmt.Sprintf("盘点统计报表_%s.xlsx", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "导出文件失败",
			"data":    err.Error(),
		})
		return
	}

	// 记录报表生成
	fileSize := int64(1024 * 1024) // 示例文件大小，实际应该获取真实大小
	go recordReportGeneration(filename, models.ReportRecordTypeInventory, filename, &fileSize, "系统用户", parameters)
}

// exportInventoryReportsToCSV 导出盘点报表到CSV
func exportInventoryReportsToCSV(c *gin.Context, parameters map[string]interface{}) {
	// 获取查询参数
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	taskType := c.Query("task_type")
	status := c.Query("status")
	categoryID := c.Query("category_id")
	departmentID := c.Query("department_id")

	// 构建查询条件
	query := global.DB.Model(&models.InventoryTask{})

	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", start)
		}
	}

	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at <= ?", end.Add(24*time.Hour))
		}
	}

	if taskType != "" {
		query = query.Where("task_type = ?", taskType)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取盘点任务数据
	var tasks []models.InventoryTask
	if err := query.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点任务失败",
			"data":    err.Error(),
		})
		return
	}

	filename := fmt.Sprintf("盘点统计报表_%s.csv", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// 写入表头
	headers := []string{"任务名称", "资产编号", "资产名称", "分类", "部门", "预期状态", "实际状态", "盘点结果", "盘点人", "盘点时间", "备注"}
	if err := writer.Write(headers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "写入CSV表头失败",
			"data":    err.Error(),
		})
		return
	}

	// 获取详细盘点记录
	var records []struct {
		TaskName       string    `json:"task_name"`
		AssetNo        string    `json:"asset_no"`
		AssetName      string    `json:"asset_name"`
		CategoryName   string    `json:"category_name"`
		DepartmentName string    `json:"department_name"`
		ExpectedStatus string    `json:"expected_status"`
		ActualStatus   string    `json:"actual_status"`
		Result         string    `json:"result"`
		CheckerName    string    `json:"checker_name"`
		CheckedAt      time.Time `json:"checked_at"`
		Notes          string    `json:"notes"`
	}

	// 构建查询
	recordQuery := global.DB.Table("inventory_records ir").
		Select(`
			it.task_name,
			a.asset_no,
			a.name as asset_name,
			c.name as category_name,
			d.name as department_name,
			a.status as expected_status,
			ir.actual_status,
			ir.result,
			ir.checker_name,
			ir.checked_at,
			ir.notes
		`).
		Joins("JOIN inventory_tasks it ON it.id = ir.task_id").
		Joins("JOIN assets a ON a.id = ir.asset_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id")

	// 应用筛选条件
	if len(tasks) > 0 {
		var taskIDs []uint
		for _, task := range tasks {
			taskIDs = append(taskIDs, task.ID)
		}
		recordQuery = recordQuery.Where("ir.task_id IN ?", taskIDs)
	}

	if categoryID != "" {
		recordQuery = recordQuery.Where("a.category_id = ?", categoryID)
	}

	if departmentID != "" {
		recordQuery = recordQuery.Where("a.department_id = ?", departmentID)
	}

	recordQuery = recordQuery.Order("ir.checked_at DESC")

	if err := recordQuery.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点记录失败",
			"data":    err.Error(),
		})
		return
	}

	// 写入数据
	for _, record := range records {
		// 状态显示转换
		expectedStatusDisplay := record.ExpectedStatus
		actualStatusDisplay := record.ActualStatus
		resultDisplay := record.Result

		switch record.ExpectedStatus {
		case "available":
			expectedStatusDisplay = "可用"
		case "borrowed":
			expectedStatusDisplay = "借用中"
		case "maintenance":
			expectedStatusDisplay = "维护中"
		case "scrapped":
			expectedStatusDisplay = "已报废"
		}

		switch record.ActualStatus {
		case "available":
			actualStatusDisplay = "可用"
		case "borrowed":
			actualStatusDisplay = "借用中"
		case "maintenance":
			actualStatusDisplay = "维护中"
		case "scrapped":
			actualStatusDisplay = "已报废"
		}

		switch record.Result {
		case "normal":
			resultDisplay = "正常"
		case "surplus":
			resultDisplay = "盘盈"
		case "deficit":
			resultDisplay = "盘亏"
		case "damaged":
			resultDisplay = "损坏"
		}

		row := []string{
			record.TaskName,
			record.AssetNo,
			record.AssetName,
			record.CategoryName,
			record.DepartmentName,
			expectedStatusDisplay,
			actualStatusDisplay,
			resultDisplay,
			record.CheckerName,
			record.CheckedAt.Format("2006-01-02 15:04:05"),
			record.Notes,
		}

		if err := writer.Write(row); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "EXPORT_ERROR",
				"message": "写入CSV数据失败",
				"data":    err.Error(),
			})
			return
		}
	}

	// 记录报表生成
	fileSize := int64(512 * 1024) // 示例文件大小，实际应该获取真实大小
	go recordReportGeneration(filename, models.ReportRecordTypeInventory, filename, &fileSize, "系统用户", parameters)
}

// exportCustomReportsToExcel 导出自定义报表到Excel
func exportCustomReportsToExcel(c *gin.Context, req CustomReportRequest) {
	// 获取自定义报表数据
	var data []map[string]interface{}

	switch req.ReportType {
	case "asset":
		data, _, _ = generateCustomAssetReport(req)
	case "borrow":
		data, _, _ = generateCustomBorrowReport(req)
	case "inventory":
		data, _, _ = generateCustomInventoryReport(req)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REPORT_TYPE",
			"message": "不支持的报表类型",
		})
		return
	}

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "自定义报表"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 如果有数据，设置表头和数据
	if len(data) > 0 {
		// 获取列名作为表头
		var headers []string
		for key := range data[0] {
			headers = append(headers, key)
		}

		// 设置表头
		for i, header := range headers {
			cell := fmt.Sprintf("%c1", 'A'+i)
			f.SetCellValue(sheetName, cell, header)
		}

		// 设置表头样式
		headerStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
		})
		f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

		// 填充数据
		for i, row := range data {
			for j, header := range headers {
				cell := fmt.Sprintf("%c%d", 'A'+j, i+2)
				value := row[header]
				f.SetCellValue(sheetName, cell, value)
			}
		}
	}

	f.SetActiveSheet(index)

	filename := fmt.Sprintf("自定义报表_%s_%s.xlsx", req.ReportType, time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "导出文件失败",
			"data":    err.Error(),
		})
		return
	}

	// 记录报表生成
	fileSize := int64(1024 * 1024) // 示例文件大小，实际应该获取真实大小
	parameters := map[string]interface{}{
		"report_type": req.ReportType,
		"filters":     req.Filters,
		"group_by":    req.GroupBy,
		"metrics":     req.Metrics,
		"sort_by":     req.SortBy,
		"sort_order":  req.SortOrder,
		"limit":       req.Limit,
	}
	go recordReportGeneration(filename, models.ReportRecordTypeCustom, filename, &fileSize, "系统用户", parameters)
}

// exportCustomReportsToCSV 导出自定义报表到CSV
func exportCustomReportsToCSV(c *gin.Context, req CustomReportRequest) {
	// 获取自定义报表数据
	var data []map[string]interface{}

	switch req.ReportType {
	case "asset":
		data, _, _ = generateCustomAssetReport(req)
	case "borrow":
		data, _, _ = generateCustomBorrowReport(req)
	case "inventory":
		data, _, _ = generateCustomInventoryReport(req)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REPORT_TYPE",
			"message": "不支持的报表类型",
		})
		return
	}

	filename := fmt.Sprintf("自定义报表_%s_%s.csv", req.ReportType, time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// 如果有数据，写入表头和数据
	if len(data) > 0 {
		// 获取列名作为表头
		var headers []string
		for key := range data[0] {
			headers = append(headers, key)
		}

		// 写入表头
		writer.Write(headers)

		// 写入数据
		for _, row := range data {
			var values []string
			for _, header := range headers {
				value := row[header]
				if value == nil {
					values = append(values, "")
				} else {
					values = append(values, fmt.Sprintf("%v", value))
				}
			}
			writer.Write(values)
		}
	}

	// 记录报表生成
	fileSize := int64(512 * 1024) // 示例文件大小，实际应该获取真实大小
	parameters := map[string]interface{}{
		"report_type": req.ReportType,
		"filters":     req.Filters,
		"group_by":    req.GroupBy,
		"metrics":     req.Metrics,
		"sort_by":     req.SortBy,
		"sort_order":  req.SortOrder,
		"limit":       req.Limit,
	}
	go recordReportGeneration(filename, models.ReportRecordTypeCustom, filename, &fileSize, "系统用户", parameters)
}
