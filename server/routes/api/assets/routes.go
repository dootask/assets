package assets

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册资产相关路由
func RegisterRoutes(r *gin.RouterGroup) {
	assets := r.Group("/assets")
	{
		assets.GET("", GetAssets)                            // 获取资产列表
		assets.POST("", CreateAsset)                         // 创建资产
		assets.POST("/import", ImportAssets)                 // 批量导入资产
		assets.GET("/export", ExportAssets)                  // 导出资产
		assets.GET("/check-asset-no/:assetNo", CheckAssetNo) // 检查资产编号是否存在
		assets.PUT("/batch", BatchUpdateAssets)              // 批量更新资产
		assets.DELETE("/batch", BatchDeleteAssets)           // 批量删除资产
		assets.GET("/:id", GetAsset)                         // 获取资产详情
		assets.PUT("/:id", UpdateAsset)                      // 更新资产
		assets.DELETE("/:id", DeleteAsset)                   // 删除资产
	}
}
