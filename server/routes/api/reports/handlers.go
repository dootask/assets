package reports

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetAssetReports 获取资产统计报表
func GetAssetReports(c *gin.Context) {
	// 获取查询参数
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	categoryID := c.Query("category_id")
	departmentID := c.Query("department_id")
	status := c.Query("status")
	valueRange := c.Query("value_range")
	warrantyStatus := c.Query("warranty_status")
	includeSubCategories := c.DefaultQuery("include_sub_categories", "false")

	// 构建查询条件
	query := global.DB.Model(&models.Asset{})

	// 时间范围筛选
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

	// 分类筛选
	if categoryID != "" {
		if includeSubCategories == "true" {
			// 包含子分类的筛选
			query = query.Where("category_id IN (SELECT id FROM categories WHERE id = ? OR parent_id = ?)", categoryID, categoryID)
		} else {
			query = query.Where("category_id = ?", categoryID)
		}
	}

	// 部门筛选
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}

	// 状态筛选
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 价值范围筛选
	if valueRange != "" {
		switch valueRange {
		case "high":
			query = query.Where("purchase_price > ?", 10000)
		case "medium":
			query = query.Where("purchase_price BETWEEN ? AND ?", 1000, 10000)
		case "low":
			query = query.Where("purchase_price > 0 AND purchase_price < ?", 1000)
		case "no_value":
			query = query.Where("purchase_price IS NULL OR purchase_price = 0")
		}
	}

	// 保修状态筛选
	if warrantyStatus != "" {
		now := time.Now()
		switch warrantyStatus {
		case "in_warranty":
			query = query.Where(`
				purchase_date IS NOT NULL 
				AND warranty_period IS NOT NULL 
				AND datetime(purchase_date, '+' || warranty_period || ' months') > ?
			`, now)
		case "expired":
			query = query.Where(`
				purchase_date IS NOT NULL 
				AND warranty_period IS NOT NULL 
				AND datetime(purchase_date, '+' || warranty_period || ' months') <= ?
			`, now)
		case "no_warranty":
			query = query.Where("purchase_date IS NULL OR warranty_period IS NULL")
		}
	}

	// 获取资产汇总数据
	summary := getAssetSummary(query)

	// 创建基础查询构建函数
	buildBaseQuery := func() *gorm.DB {
		baseQuery := global.DB.Model(&models.Asset{})

		// 时间范围筛选
		if startDate != "" {
			if start, err := time.Parse("2006-01-02", startDate); err == nil {
				baseQuery = baseQuery.Where("created_at >= ?", start)
			}
		}
		if endDate != "" {
			if end, err := time.Parse("2006-01-02", endDate); err == nil {
				baseQuery = baseQuery.Where("created_at <= ?", end.Add(24*time.Hour))
			}
		}

		// 分类筛选
		if categoryID != "" {
			if includeSubCategories == "true" {
				baseQuery = baseQuery.Where("category_id IN (SELECT id FROM categories WHERE id = ? OR parent_id = ?)", categoryID, categoryID)
			} else {
				baseQuery = baseQuery.Where("category_id = ?", categoryID)
			}
		}

		// 部门筛选
		if departmentID != "" {
			baseQuery = baseQuery.Where("department_id = ?", departmentID)
		}

		// 状态筛选
		if status != "" {
			baseQuery = baseQuery.Where("status = ?", status)
		}

		// 价值范围筛选
		if valueRange != "" {
			switch valueRange {
			case "high":
				baseQuery = baseQuery.Where("purchase_price > ?", 10000)
			case "medium":
				baseQuery = baseQuery.Where("purchase_price BETWEEN ? AND ?", 1000, 10000)
			case "low":
				baseQuery = baseQuery.Where("purchase_price > 0 AND purchase_price < ?", 1000)
			case "no_value":
				baseQuery = baseQuery.Where("purchase_price IS NULL OR purchase_price = 0")
			}
		}

		// 保修状态筛选
		if warrantyStatus != "" {
			now := time.Now()
			switch warrantyStatus {
			case "in_warranty":
				baseQuery = baseQuery.Where(`
					purchase_date IS NOT NULL 
					AND warranty_period IS NOT NULL 
					AND datetime(purchase_date, '+' || warranty_period || ' months') > ?
				`, now)
			case "expired":
				baseQuery = baseQuery.Where(`
					purchase_date IS NOT NULL 
					AND warranty_period IS NOT NULL 
					AND datetime(purchase_date, '+' || warranty_period || ' months') <= ?
				`, now)
			case "no_warranty":
				baseQuery = baseQuery.Where("purchase_date IS NULL OR warranty_period IS NULL")
			}
		}

		return baseQuery
	}

	// 获取分类统计
	byCategory := getAssetsByCategory(buildBaseQuery())

	// 获取部门统计
	byDepartment := getAssetsByDepartment(buildBaseQuery())

	// 获取状态统计
	byStatus := getAssetsByStatus(buildBaseQuery())

	// 获取采购年份统计
	byPurchaseYear := getAssetsByPurchaseYear(buildBaseQuery())

	// 获取价值分析
	valueAnalysis := getAssetValueAnalysis(buildBaseQuery())

	// 获取保修状态
	warrantyStatusData := getAssetWarrantyStatus(buildBaseQuery())

	// 获取新增统计维度
	byLocation := getAssetsByLocation(buildBaseQuery())
	bySupplier := getAssetsBySupplier(buildBaseQuery())
	byPurchaseMonth := getAssetsByPurchaseMonth(buildBaseQuery())
	utilizationRate := getAssetUtilizationRate(buildBaseQuery())

	reportData := AssetReportData{
		Summary:         summary,
		ByCategory:      byCategory,
		ByDepartment:    byDepartment,
		ByStatus:        byStatus,
		ByPurchaseYear:  byPurchaseYear,
		ValueAnalysis:   valueAnalysis,
		WarrantyStatus:  warrantyStatusData,
		ByLocation:      byLocation,
		BySupplier:      bySupplier,
		ByPurchaseMonth: byPurchaseMonth,
		UtilizationRate: utilizationRate,
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "获取资产报表成功",
		"data":    reportData,
	})
}

// GetBorrowReports 获取借用统计报表
func GetBorrowReports(c *gin.Context) {
	// 获取查询参数
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	departmentID := c.Query("department_id")
	status := c.Query("status")
	borrowerName := c.Query("borrower_name")
	assetCategoryID := c.Query("asset_category_id")
	overdueOnly := c.DefaultQuery("overdue_only", "false")
	borrowDuration := c.Query("borrow_duration")

	// 构建查询条件
	query := global.DB.Model(&models.BorrowRecord{})

	// 时间范围筛选
	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("borrow_date >= ?", start)
		}
	}

	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("borrow_date <= ?", end.Add(24*time.Hour))
		}
	}

	// 部门筛选
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}

	// 状态筛选
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 借用人筛选
	if borrowerName != "" {
		query = query.Where("borrower_name LIKE ?", "%"+borrowerName+"%")
	}

	// 资产分类筛选
	if assetCategoryID != "" {
		query = query.Joins("JOIN assets a ON a.id = borrow_records.asset_id").
			Where("a.category_id = ?", assetCategoryID)
	}

	// 超期筛选
	if overdueOnly == "true" {
		now := time.Now()
		query = query.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, now)
	}

	// 借用时长筛选
	if borrowDuration != "" {
		now := time.Now()
		switch borrowDuration {
		case "short":
			query = query.Where("julianday(?) - julianday(borrow_date) <= 7", now)
		case "medium":
			query = query.Where("julianday(?) - julianday(borrow_date) BETWEEN 8 AND 30", now)
		case "long":
			query = query.Where("julianday(?) - julianday(borrow_date) > 30", now)
		}
	}

	// 获取借用汇总数据
	summary := getBorrowSummary(query)

	// 获取部门借用统计
	byDepartment := getBorrowsByDepartment(query)

	// 获取资产借用统计
	byAsset := getBorrowsByAsset(query)

	// 获取超期分析
	overdueAnalysis := getBorrowOverdueAnalysis(query)

	// 获取月度趋势
	monthlyTrend := getBorrowMonthlyTrend(query)

	// 获取热门资产
	popularAssets := getBorrowPopularAssets(query)

	// 获取新增统计维度
	byBorrower := getBorrowsByBorrower(query)
	byAssetCategory := getBorrowsByAssetCategory(query)
	byBorrowDuration := getBorrowsByDuration(query)
	borrowTrends := getBorrowTrends(query)

	reportData := BorrowReportData{
		Summary:          summary,
		ByDepartment:     byDepartment,
		ByAsset:          byAsset,
		OverdueAnalysis:  overdueAnalysis,
		MonthlyTrend:     monthlyTrend,
		PopularAssets:    popularAssets,
		ByBorrower:       byBorrower,
		ByAssetCategory:  byAssetCategory,
		ByBorrowDuration: byBorrowDuration,
		BorrowTrends:     borrowTrends,
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "获取借用报表成功",
		"data":    reportData,
	})
}

// GetInventoryReports 获取盘点统计报表
func GetInventoryReports(c *gin.Context) {
	// 获取查询参数
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	taskType := c.Query("task_type")
	status := c.Query("status")

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

	// 获取盘点汇总数据
	summary := getInventorySummary(query)

	// 获取任务分析
	taskAnalysis := getInventoryTaskAnalysis(startDate, endDate, taskType, status)

	// 获取结果分析
	resultAnalysis := getInventoryResultAnalysis()

	// 获取部门分析
	departmentAnalysis := getInventoryDepartmentAnalysis()

	// 获取分类分析
	categoryAnalysis := getInventoryCategoryAnalysis()

	// 获取趋势分析
	trendAnalysis := getInventoryTrendAnalysis()

	reportData := InventoryReportData{
		Summary:            summary,
		TaskAnalysis:       taskAnalysis,
		ResultAnalysis:     resultAnalysis,
		DepartmentAnalysis: departmentAnalysis,
		CategoryAnalysis:   categoryAnalysis,
		TrendAnalysis:      trendAnalysis,
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "获取盘点报表成功",
		"data":    reportData,
	})
}

// GetDashboardReports 获取仪表板报表数据
func GetDashboardReports(c *gin.Context) {
	// 获取资产概览
	assetOverview := getDashboardAssetOverview()

	// 获取借用概览
	borrowOverview := getDashboardBorrowOverview()

	// 获取盘点概览
	inventoryOverview := getDashboardInventoryOverview()

	// 获取最近活动
	recentActivity := getDashboardRecentActivity()

	// 获取系统警报
	alerts := getDashboardAlerts()

	reportData := DashboardReportData{
		AssetSummary:     assetOverview,
		BorrowSummary:    borrowOverview,
		InventorySummary: inventoryOverview,
		RecentActivities: recentActivity,
		Alerts:           alerts,
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "获取仪表板报表成功",
		"data":    reportData,
	})
}

// GetCustomReports 获取自定义报表
func GetCustomReports(c *gin.Context) {
	var req CustomReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "VALIDATION_ERROR",
			"message": "请求参数错误",
			"data":    err.Error(),
		})
		return
	}

	// 根据报表类型生成自定义报表
	var data []map[string]interface{}
	var columns []CustomReportColumn
	var totalCount int64

	switch req.ReportType {
	case "asset":
		data, columns, totalCount = generateCustomAssetReport(req)
	case "borrow":
		data, columns, totalCount = generateCustomBorrowReport(req)
	case "inventory":
		data, columns, totalCount = generateCustomInventoryReport(req)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REPORT_TYPE",
			"message": "不支持的报表类型",
		})
		return
	}

	response := CustomReportResponse{
		Columns: columns,
		Data:    data,
		Total:   totalCount,
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "获取自定义报表成功",
		"data":    response,
	})
}

// GetRecentReports 获取最近生成的报表
func GetRecentReports(c *gin.Context) {
	// 获取查询参数
	limit := c.DefaultQuery("limit", "10")
	limitInt := 10

	if l, err := strconv.Atoi(limit); err == nil && l > 0 && l <= 50 {
		limitInt = l
	}

	// 查询最近生成的报表记录
	var reports []models.ReportRecord
	query := global.DB.Model(&models.ReportRecord{}).
		Where("expires_at IS NULL OR expires_at > ?", time.Now()).
		Order("created_at DESC").
		Limit(limitInt)

	if err := query.Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询报表记录失败",
			"data":    err.Error(),
		})
		return
	}

	// 格式化返回数据
	recentReports := make([]map[string]interface{}, 0, len(reports))
	for _, report := range reports {
		reportData := map[string]interface{}{
			"id":           report.ID,
			"name":         report.ReportName,
			"type":         getReportTypeDisplayName(report.ReportType),
			"date":         report.CreatedAt.Format("2006-01-02 15:04:05"),
			"size":         report.GetFileSizeDisplay(),
			"download_url": report.GetDownloadURL(c.GetString("base_url")),
			"generated_by": report.GeneratedBy,
			"file_format":  report.FileFormat,
		}
		recentReports = append(recentReports, reportData)
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "获取最近报表成功",
		"data":    recentReports,
	})
}

// getReportTypeDisplayName 获取报表类型的显示名称
func getReportTypeDisplayName(reportType models.ReportRecordType) string {
	switch reportType {
	case models.ReportRecordTypeAsset:
		return "资产报表"
	case models.ReportRecordTypeBorrow:
		return "借用报表"
	case models.ReportRecordTypeInventory:
		return "盘点报表"
	case models.ReportRecordTypeCustom:
		return "自定义报表"
	default:
		return "未知报表"
	}
}

// recordReportGeneration 记录报表生成
func recordReportGeneration(reportName string, reportType models.ReportRecordType, fileFormat models.ReportRecordFormat, relativeFilePath string, fileSize *int64, generatedBy string, parameters interface{}) error {
	// 序列化参数为JSON字符串
	var paramsStr string
	if parameters != nil {
		if paramBytes, err := json.Marshal(parameters); err == nil {
			paramsStr = string(paramBytes)
		}
	}

	report := models.ReportRecord{
		ReportName:  reportName,
		ReportType:  reportType,
		FileFormat:  fileFormat,
		FilePath:    relativeFilePath, // 只保存相对路径
		FileSize:    fileSize,
		GeneratedBy: generatedBy,
		Parameters:  paramsStr,
	}

	return global.DB.Create(&report).Error
}

// ExportAssetReports 导出资产报表
func ExportAssetReports(c *gin.Context) {
	format := c.DefaultQuery("format", "excel")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// 获取查询参数用于记录
	parameters := map[string]interface{}{
		"format":     format,
		"start_date": startDate,
		"end_date":   endDate,
	}

	switch format {
	case "excel":
		exportAssetReportsToExcelFile(c, parameters)
	case "csv":
		exportAssetReportsToCSVFile(c, parameters)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_FORMAT",
			"message": "不支持的导出格式",
		})
	}
}

// ExportBorrowReports 导出借用报表
func ExportBorrowReports(c *gin.Context) {
	format := c.DefaultQuery("format", "excel")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// 获取查询参数用于记录
	parameters := map[string]interface{}{
		"format":     format,
		"start_date": startDate,
		"end_date":   endDate,
	}

	switch format {
	case "excel":
		exportBorrowReportsToExcelFile(c, parameters)
	case "csv":
		exportBorrowReportsToCSVFile(c, parameters)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_FORMAT",
			"message": "不支持的导出格式",
		})
	}
}

// ExportInventoryReports 导出盘点报表
func ExportInventoryReports(c *gin.Context) {
	format := c.DefaultQuery("format", "excel")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	taskType := c.Query("task_type")
	status := c.Query("status")
	categoryID := c.Query("category_id")
	departmentID := c.Query("department_id")

	// 获取查询参数用于记录
	parameters := map[string]interface{}{
		"format":        format,
		"start_date":    startDate,
		"end_date":      endDate,
		"task_type":     taskType,
		"status":        status,
		"category_id":   categoryID,
		"department_id": departmentID,
	}

	switch format {
	case "excel":
		exportInventoryReportsToExcelFile(c, parameters)
	case "csv":
		exportInventoryReportsToCSVFile(c, parameters)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_FORMAT",
			"message": "不支持的导出格式",
		})
	}
}

// ExportCustomReports 导出自定义报表
func ExportCustomReports(c *gin.Context) {
	var req struct {
		CustomReportRequest
		Format string `json:"format"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "VALIDATION_ERROR",
			"message": "请求参数错误",
			"data":    err.Error(),
		})
		return
	}

	switch req.Format {
	case "excel":
		exportCustomReportsToExcelFile(c, req.CustomReportRequest)
	case "csv":
		exportCustomReportsToCSVFile(c, req.CustomReportRequest)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_FORMAT",
			"message": "不支持的导出格式",
		})
	}
}

// DownloadReport 下载报表文件
func DownloadReport(c *gin.Context) {
	filename := c.Param("filename")

	// 验证文件名安全性 - 防止路径遍历攻击
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_FILENAME",
			"message": "无效的文件名",
		})
		return
	}

	// 构建文件路径
	filepath := fmt.Sprintf("./uploads/exports/%s", filename)

	// 检查文件是否存在
	if !utils.IsFileExists(filepath) {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    "FILE_NOT_FOUND",
			"message": "文件不存在或已过期",
		})
		return
	}

	// 根据文件扩展名设置Content-Type
	var contentType string
	if strings.HasSuffix(filename, ".xlsx") {
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	} else if strings.HasSuffix(filename, ".csv") {
		contentType = "text/csv"
	} else {
		contentType = "application/octet-stream"
	}

	// 设置响应头，使用实际文件名
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Cache-Control", "no-cache")

	// 读取并返回文件内容
	c.File(filepath)
}
