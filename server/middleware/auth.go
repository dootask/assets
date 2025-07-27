package middleware

import (
	"github.com/gin-gonic/gin"
)

// AuthMiddleware 简化的认证中间件（资产管理系统暂不需要复杂认证）
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 标记为已认证
		c.Set("is_authenticated", true)
		c.Next()
	}
}

// UserRoleMiddleware 用户权限中间件（简化版本）
func UserRoleMiddleware(role ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 资产管理系统暂时不需要复杂的权限控制
		c.Next()
	}
}
