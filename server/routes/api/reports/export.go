package reports

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

// exportAssetReportsToExcel 导出资产报表到Excel
func exportAssetReportsToExcel(c *gin.Context) {
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
}

// exportAssetReportsToCSV 导出资产报表到CSV
func exportAssetReportsToCSV(c *gin.Context) {
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
}

// exportBorrowReportsToExcel 导出借用报表到Excel
func exportBorrowReportsToExcel(c *gin.Context) {
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
}

// exportBorrowReportsToCSV 导出借用报表到CSV
func exportBorrowReportsToCSV(c *gin.Context) {
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
}

// exportInventoryReportsToExcel 导出盘点报表到Excel
func exportInventoryReportsToExcel(c *gin.Context) {
	f := excelize.NewFile()
	defer f.Close()
	
	sheetName := "盘点统计报表"
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
	headers := []string{"盘点任务", "资产编号", "资产名称", "预期状态", "实际状态", "盘点结果", "盘点人", "盘点时间"}
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
		{"2023年度全盘", "A001", "笔记本电脑", "可用", "可用", "正常", "王五", "2023-12-15"},
		{"2023年度全盘", "A002", "打印机", "可用", "损坏", "损坏", "王五", "2023-12-15"},
	}
	
	for i, row := range sampleData {
		for j, value := range row {
			cell := fmt.Sprintf("%c%d", 'A'+j, i+2)
			f.SetCellValue(sheetName, cell, value)
		}
	}
	
	f.SetActiveSheet(index)
	
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
}

// exportInventoryReportsToCSV 导出盘点报表到CSV
func exportInventoryReportsToCSV(c *gin.Context) {
	filename := fmt.Sprintf("盘点统计报表_%s.csv", time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()
	
	headers := []string{"盘点任务", "资产编号", "资产名称", "预期状态", "实际状态", "盘点结果", "盘点人", "盘点时间"}
	writer.Write(headers)
	
	sampleData := [][]string{
		{"2023年度全盘", "A001", "笔记本电脑", "可用", "可用", "正常", "王五", "2023-12-15"},
		{"2023年度全盘", "A002", "打印机", "可用", "损坏", "损坏", "王五", "2023-12-15"},
	}
	
	for _, row := range sampleData {
		writer.Write(row)
	}
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
}