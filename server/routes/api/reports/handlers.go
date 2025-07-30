package reports

import (
	"net/http"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"github.com/gin-gonic/gin"
)

// GetAssetReports 获取资产统计报表
func GetAssetReports(c *gin.Context) {
	// 获取查询参数
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	categoryID := c.Query("category_id")
	departmentID := c.Query("department_id")

	// 构建查询条件
	query := global.DB.Model(&models.Asset{})

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

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}

	// 获取资产汇总数据
	summary := getAssetSummary(query)

	// 获取分类统计
	byCategory := getAssetsByCategory(query)

	// 获取部门统计
	byDepartment := getAssetsByDepartment(query)

	// 获取状态统计
	byStatus := getAssetsByStatus(query)

	// 获取采购年份统计
	byPurchaseYear := getAssetsByPurchaseYear(query)

	// 获取价值分析
	valueAnalysis := getAssetValueAnalysis(query)

	// 获取保修状态
	warrantyStatus := getAssetWarrantyStatus(query)

	reportData := AssetReportData{
		Summary:        summary,
		ByCategory:     byCategory,
		ByDepartment:   byDepartment,
		ByStatus:       byStatus,
		ByPurchaseYear: byPurchaseYear,
		ValueAnalysis:  valueAnalysis,
		WarrantyStatus: warrantyStatus,
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

	// 构建查询条件
	query := global.DB.Model(&models.BorrowRecord{})

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

	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
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

	reportData := BorrowReportData{
		Summary:         summary,
		ByDepartment:    byDepartment,
		ByAsset:         byAsset,
		OverdueAnalysis: overdueAnalysis,
		MonthlyTrend:    monthlyTrend,
		PopularAssets:   popularAssets,
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
	taskAnalysis := getInventoryTaskAnalysis(query)

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

// ExportAssetReports 导出资产报表
func ExportAssetReports(c *gin.Context) {
	format := c.DefaultQuery("format", "excel")

	// 获取报表数据（复用GetAssetReports的逻辑）
	// 这里简化处理，实际应该重构共同逻辑

	switch format {
	case "excel":
		exportAssetReportsToExcel(c)
	case "csv":
		exportAssetReportsToCSV(c)
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

	switch format {
	case "excel":
		exportBorrowReportsToExcel(c)
	case "csv":
		exportBorrowReportsToCSV(c)
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

	switch format {
	case "excel":
		exportInventoryReportsToExcel(c)
	case "csv":
		exportInventoryReportsToCSV(c)
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
		exportCustomReportsToExcel(c, req.CustomReportRequest)
	case "csv":
		exportCustomReportsToCSV(c, req.CustomReportRequest)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_FORMAT",
			"message": "不支持的导出格式",
		})
	}
}
