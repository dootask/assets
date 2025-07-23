package routes

import (
	"dootask-ai/go-service/middleware"
	"dootask-ai/go-service/routes/api/agents"
	aimodels "dootask-ai/go-service/routes/api/ai-models"
	"dootask-ai/go-service/routes/api/conversations"
	"dootask-ai/go-service/routes/api/dashboard"
	knowledgebases "dootask-ai/go-service/routes/api/knowledge-bases"
	mcptools "dootask-ai/go-service/routes/api/mcp-tools"
	"dootask-ai/go-service/routes/api/test"
	"dootask-ai/go-service/routes/health"
	"dootask-ai/go-service/routes/webhook"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	// 注册路由（不需要认证）
	root := r.Group("/")
	health.RegisterRoutes(root)
	webhook.RegisterRoutes(root)

	// 注册API路由（需要认证）
	api := r.Group("/api")
	api.Use(middleware.UserRoleMiddleware())
	{
		// 注册测试路由
		test.RegisterRoutes(api)

		// 导入AI模型管理路由
		aimodels.RegisterRoutes(api)

		// 导入智能体管理路由
		agents.RegisterRoutes(api)

		// 导入知识库管理路由
		knowledgebases.RegisterRoutes(api)

		// 导入MCP工具管理路由
		mcptools.RegisterRoutes(api)

		// 导入对话管理路由
		conversations.RegisterRoutes(api)

		// 导入仪表板路由
		dashboard.RegisterRoutes(api)
	}
}
