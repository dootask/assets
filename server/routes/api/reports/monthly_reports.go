package reports

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"

	"github.com/gin-gonic/gin"
)

// MonthlyReportRequest 月度报告请求
type MonthlyReportRequest struct {
	Month string `json:"month" validate:"required"` // 格式：2024-01
}

// GenerateMonthlyReport 生成月度报告
func GenerateMonthlyReport(c *gin.Context) {
	var req MonthlyReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 解析月份
	monthTime, err := time.Parse("2006-01", req.Month)
	if err != nil {
		utils.ValidationError(c, "月份格式错误")
		return
	}

	// 生成文本报告
	reportContent, err := generateMonthlyReportText(monthTime)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("生成报告失败: %v", err))
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("monthly_report_%s_%s.txt", req.Month, timestamp)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 创建文件
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	file, err := os.Create(filepath)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建报告文件失败: %v", err))
		return
	}
	defer file.Close()

	// 写入报告内容
	if _, err := file.WriteString(reportContent); err != nil {
		utils.InternalError(c, fmt.Errorf("写入报告内容失败: %v", err))
		return
	}

	// 获取文件大小并记录报表生成
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		parameters := map[string]interface{}{
			"month": req.Month,
		}
		// 异步记录报表生成
		go func() {
			recordReportGeneration(fmt.Sprintf("月度报告_%s", req.Month), models.ReportRecordTypeCustom, models.ReportRecordFormat("txt"), filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     fmt.Sprintf("月度报告_%s.txt", req.Month),
		"message":      "月度报告已生成",
	}

	utils.Success(c, response)
}

// ExportAssetInventory 导出资产清单
func ExportAssetInventory(c *gin.Context) {
	// 查询资产数据
	var assets []models.Asset
	query := global.DB.Preload("Category").Preload("Department").Find(&assets)
	if query.Error != nil {
		utils.InternalError(c, fmt.Errorf("查询资产数据失败: %v", query.Error))
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("asset_inventory_%s_%s.csv", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 创建CSV文件
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	file, err := os.Create(filepath)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建CSV文件失败: %v", err))
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)

	// 写入表头
	headers := []string{
		"资产编号", "资产名称", "分类", "部门", "品牌", "型号",
		"采购价格", "采购日期", "状态", "存放位置", "保修期至",
		"创建时间",
	}
	writer.Write(headers)

	// 写入数据行
	for _, asset := range assets {
		var record []string

		// 资产编号
		record = append(record, asset.AssetNo)

		// 资产名称
		record = append(record, asset.Name)

		// 分类
		categoryName := ""
		if asset.CategoryID > 0 {
			var category models.Category
			if err := global.DB.First(&category, asset.CategoryID).Error; err == nil {
				categoryName = category.Name
			}
		}
		record = append(record, categoryName)

		// 部门
		departmentName := ""
		if asset.DepartmentID != nil && *asset.DepartmentID > 0 {
			var department models.Department
			if err := global.DB.First(&department, *asset.DepartmentID).Error; err == nil {
				departmentName = department.Name
			}
		}
		record = append(record, departmentName)

		// 品牌
		record = append(record, asset.Brand)

		// 型号
		record = append(record, asset.Model)

		// 采购价格
		priceStr := ""
		if asset.PurchasePrice != nil {
			priceStr = strconv.FormatFloat(*asset.PurchasePrice, 'f', 2, 64)
		}
		record = append(record, priceStr)

		// 采购日期
		dateStr := ""
		if asset.PurchaseDate != nil {
			dateStr = asset.PurchaseDate.Format("2006-01-02")
		}
		record = append(record, dateStr)

		// 状态
		statusStr := ""
		switch asset.Status {
		case models.AssetStatusAvailable:
			statusStr = "可用"
		case models.AssetStatusBorrowed:
			statusStr = "借用中"
		case models.AssetStatusMaintenance:
			statusStr = "维护中"
		case models.AssetStatusScrapped:
			statusStr = "已报废"
		default:
			statusStr = string(asset.Status)
		}
		record = append(record, statusStr)

		// 存放位置
		record = append(record, asset.Location)

		// 保修期至
		warrantyStr := ""
		if asset.PurchaseDate != nil && asset.WarrantyPeriod != nil {
			warrantyEnd := asset.PurchaseDate.AddDate(0, int(*asset.WarrantyPeriod), 0)
			warrantyStr = warrantyEnd.Format("2006-01-02")
		}
		record = append(record, warrantyStr)

		// 创建时间
		record = append(record, asset.CreatedAt.Format("2006-01-02 15:04:05"))

		writer.Write(record)
	}

	writer.Flush()

	// 获取文件大小并记录报表生成
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("资产清单", models.ReportRecordTypeAsset, models.ReportRecordFormatCSV, filename, &fileSize, "系统用户", nil)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     "资产清单.csv",
		"message":      "资产清单已生成",
	}

	utils.Success(c, response)
}

// generateMonthlyReportText 生成月度报告文本
func generateMonthlyReportText(month time.Time) (string, error) {
	var report bytes.Buffer

	// 标题
	report.WriteString(fmt.Sprintf("资产管理系统月度报告 - %s\n", month.Format("2006年01月")))
	report.WriteString("========================================\n\n")

	// 报告日期
	report.WriteString(fmt.Sprintf("生成日期: %s\n\n", time.Now().Format("2006-01-02 15:04:05")))

	// 获取月度统计数据
	monthStart := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0).Add(-time.Second)

	// 资产概览
	report.WriteString("一、资产概览\n")
	report.WriteString("----------------------------------------\n")

	// 总资产数
	var totalAssets int64
	global.DB.Model(&models.Asset{}).Count(&totalAssets)
	report.WriteString(fmt.Sprintf("总资产数: %d\n", totalAssets))

	// 各状态资产统计
	var availableAssets, borrowedAssets, maintenanceAssets, scrappedAssets int64
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusAvailable).Count(&availableAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusBorrowed).Count(&borrowedAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusMaintenance).Count(&maintenanceAssets)
	global.DB.Model(&models.Asset{}).Where("status = ?", models.AssetStatusScrapped).Count(&scrappedAssets)

	report.WriteString(fmt.Sprintf("可用资产: %d\n", availableAssets))
	report.WriteString(fmt.Sprintf("借用中资产: %d\n", borrowedAssets))
	report.WriteString(fmt.Sprintf("维护中资产: %d\n", maintenanceAssets))
	report.WriteString(fmt.Sprintf("已报废资产: %d\n\n", scrappedAssets))

	// 借用统计
	report.WriteString("二、借用统计\n")
	report.WriteString("----------------------------------------\n")

	// 月度借用统计
	var monthlyBorrows, monthlyReturns int64
	global.DB.Model(&models.BorrowRecord{}).
		Where("borrow_date BETWEEN ? AND ?", monthStart, monthEnd).
		Count(&monthlyBorrows)
	global.DB.Model(&models.BorrowRecord{}).
		Where("actual_return_date BETWEEN ? AND ?", monthStart, monthEnd).
		Count(&monthlyReturns)

	report.WriteString(fmt.Sprintf("本月借用次数: %d\n", monthlyBorrows))
	report.WriteString(fmt.Sprintf("本月归还次数: %d\n", monthlyReturns))

	// 超期借用
	var overdueCount int64
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, time.Now()).
		Count(&overdueCount)
	report.WriteString(fmt.Sprintf("当前超期借用: %d\n\n", overdueCount))

	// 盘点统计
	report.WriteString("三、盘点统计\n")
	report.WriteString("----------------------------------------\n")

	// 月度盘点任务统计
	var monthlyTasks int64
	global.DB.Model(&models.InventoryTask{}).
		Where("created_at BETWEEN ? AND ?", monthStart, monthEnd).
		Count(&monthlyTasks)
	report.WriteString(fmt.Sprintf("本月盘点任务: %d\n", monthlyTasks))

	// 盘点准确率
	var normalRecords, totalRecords int64
	global.DB.Model(&models.InventoryRecord{}).
		Joins("JOIN inventory_tasks ON inventory_tasks.id = inventory_records.task_id").
		Where("inventory_tasks.created_at BETWEEN ? AND ?", monthStart, monthEnd).
		Count(&totalRecords)
	global.DB.Model(&models.InventoryRecord{}).
		Joins("JOIN inventory_tasks ON inventory_tasks.id = inventory_records.task_id").
		Where("inventory_tasks.created_at BETWEEN ? AND ? AND inventory_records.result = ?",
			monthStart, monthEnd, models.InventoryResultNormal).
		Count(&normalRecords)

	var accuracyRate float64
	if totalRecords > 0 {
		accuracyRate = float64(normalRecords) / float64(totalRecords) * 100
	}
	report.WriteString(fmt.Sprintf("盘点准确率: %.1f%%\n\n", accuracyRate))

	// 总结与建议
	report.WriteString("四、总结与建议\n")
	report.WriteString("----------------------------------------\n")

	// 根据数据生成建议
	suggestions := generateMonthlySuggestions(overdueCount, accuracyRate, maintenanceAssets)
	for _, suggestion := range suggestions {
		report.WriteString(fmt.Sprintf("%s\n", suggestion))
	}

	return report.String(), nil
}

// generateMonthlySuggestions 生成月度建议
func generateMonthlySuggestions(overdueCount int64, accuracyRate float64, maintenanceAssets int64) []string {
	var suggestions []string

	if overdueCount > 0 {
		suggestions = append(suggestions, fmt.Sprintf("• 当前有%d个超期借用，建议加强催还管理", overdueCount))
	}

	if accuracyRate < 95.0 {
		suggestions = append(suggestions, "• 盘点准确率偏低，建议加强盘点培训和流程规范")
	}

	if maintenanceAssets > 0 {
		suggestions = append(suggestions, fmt.Sprintf("• 有%d个资产在维护中，建议关注维护进度", maintenanceAssets))
	}

	if len(suggestions) == 0 {
		suggestions = append(suggestions, "• 本月各项指标正常，继续保持良好的管理水平")
	}

	return suggestions
}
