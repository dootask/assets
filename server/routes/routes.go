package routes

import (
	"asset-management-system/server/middleware"
	"asset-management-system/server/routes/api/assets"
	"asset-management-system/server/routes/api/borrow"
	"asset-management-system/server/routes/api/categories"
	"asset-management-system/server/routes/api/dashboard"
	"asset-management-system/server/routes/api/departments"
	"asset-management-system/server/routes/api/test"
	"asset-management-system/server/routes/api/upload"
	"asset-management-system/server/routes/health"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	// 静态文件服务
	r.Static("/uploads", "./uploads")
	r.Static("/static", "./static")

	// 注册路由（不需要认证）
	root := r.Group("/")
	health.RegisterRoutes(root)

	// 注册API路由（需要认证）
	api := r.Group("/api")
	api.Use(middleware.UserRoleMiddleware())
	{
		// 注册测试路由
		test.RegisterRoutes(api)

		// 导入仪表板路由
		dashboard.RegisterRoutes(api)

		// 文件上传路由
		upload.RegisterRoutes(api)

		// 资产管理路由
		assets.RegisterRoutes(api)

		// 分类管理路由
		categories.RegisterRoutes(api)

		// 部门管理路由
		departments.RegisterRoutes(api)

		// 借用管理路由
		borrow.RegisterRoutes(api)
	}
}
