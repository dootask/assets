package reports

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册报表路由
func RegisterRoutes(router *gin.RouterGroup) {
	// 报表路由
	reportsGroup := router.Group("/reports")
	{
		// 资产统计报表
		reportsGroup.GET("/assets", GetAssetReports)
		reportsGroup.GET("/assets/export", ExportAssetReports)

		// 借用统计报表
		reportsGroup.GET("/borrow", GetBorrowReports)
		reportsGroup.GET("/borrow/export", ExportBorrowReports)

		// 盘点统计报表
		reportsGroup.GET("/inventory", GetInventoryReports)
		reportsGroup.GET("/inventory/export", ExportInventoryReports)

		// 仪表板数据（综合报表）
		reportsGroup.GET("/dashboard", GetDashboardReports)

		// 自定义报表查询
		reportsGroup.POST("/custom", GetCustomReports)
		reportsGroup.POST("/custom/export", ExportCustomReports)

		// 新增功能
		reportsGroup.POST("/monthly", GenerateMonthlyReport)
		reportsGroup.GET("/asset-inventory/export", ExportAssetInventory)

		// 最近生成的报表
		reportsGroup.GET("/recent", GetRecentReports)
	}
}
