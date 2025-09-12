package inventory

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册盘点管理相关路由
func RegisterRoutes(router *gin.RouterGroup) {
	inventory := router.Group("/inventory")
	{
		// 盘点任务管理
		inventory.GET("/tasks", GetInventoryTasks)          // 获取盘点任务列表
		inventory.POST("/tasks", CreateInventoryTask)       // 创建盘点任务
		inventory.GET("/tasks/:id", GetInventoryTask)       // 获取盘点任务详情
		inventory.PUT("/tasks/:id", UpdateInventoryTask)    // 更新盘点任务
		inventory.DELETE("/tasks/:id", DeleteInventoryTask) // 删除盘点任务

		// 盘点记录管理
		inventory.GET("/records", GetInventoryRecords)                // 获取盘点记录列表
		inventory.POST("/records", CreateInventoryRecord)             // 创建盘点记录
		inventory.POST("/records/batch", BatchCreateInventoryRecords) // 批量创建盘点记录

		// 盘点报告
		inventory.GET("/tasks/:id/report", GetInventoryReport) // 获取盘点报告
	}
}
