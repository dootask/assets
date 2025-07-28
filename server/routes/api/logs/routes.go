package logs

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册操作日志相关路由
func RegisterRoutes(r *gin.RouterGroup) {
	logs := r.Group("/logs")
	{
		logs.GET("", GetOperationLogs)        // 获取操作日志列表
		logs.GET("/:id", GetOperationLog)     // 获取操作日志详情
		logs.GET("/stats", GetOperationLogStats) // 获取操作日志统计
	}
}