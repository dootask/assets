package categories

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册分类管理路由
func RegisterRoutes(r *gin.RouterGroup) {
	categories := r.Group("/categories")
	{
		categories.GET("", GetCategories)           // 获取分类树
		categories.POST("", CreateCategory)         // 创建分类
		categories.GET("/:id", GetCategory)         // 获取分类详情
		categories.PUT("/:id", UpdateCategory)      // 更新分类
		categories.DELETE("/:id", DeleteCategory)   // 删除分类
		categories.GET("/:id/assets", GetCategoryAssets) // 获取分类下的资产
	}
}