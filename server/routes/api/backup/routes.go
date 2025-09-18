package backup

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册备份相关路由
func RegisterRoutes(r *gin.RouterGroup) {
	backup := r.Group("/backup")
	{
		backup.POST("/create", CreateBackup)              // 创建备份
		backup.POST("/restore", RestoreBackup)            // 恢复备份
		backup.GET("", GetBackups)                        // 获取备份列表
		backup.GET("/:filename/download", DownloadBackup) // 下载备份文件
		backup.DELETE("/:filename", DeleteBackup)         // 删除备份
		backup.GET("/:filename/info", GetBackupInfo)      // 获取备份信息
	}
}
