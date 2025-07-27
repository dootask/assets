package borrow

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册借用管理路由
func RegisterRoutes(r *gin.RouterGroup) {
	borrow := r.Group("/borrow")
	{
		borrow.GET("", GetBorrowRecords)              // 获取借用记录列表
		borrow.POST("", CreateBorrowRecord)           // 创建借用记录
		borrow.GET("/stats", GetBorrowStats)          // 获取借用统计信息
		borrow.GET("/available-assets", GetAvailableAssets) // 获取可借用资产列表
		borrow.PUT("/update-overdue", UpdateOverdueStatus)  // 更新超期状态
		borrow.GET("/:id", GetBorrowRecord)           // 获取借用记录详情
		borrow.PUT("/:id", UpdateBorrowRecord)        // 更新借用记录
		borrow.DELETE("/:id", DeleteBorrowRecord)     // 删除借用记录
		borrow.PUT("/:id/return", ReturnAsset)        // 归还资产
	}
}