package middleware

import (
	"dootask-ai/go-service/pkg/utils"
	"net/http"
	"slices"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 对接口进行鉴权
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 标记为已认证
		if c.GetBool("is_authenticated") {
			c.Next()
			return
		}
		c.Set("is_authenticated", true)

		// 从请求头获取token
		authToken := c.GetHeader("Authorization")
		if after, ok := strings.CutPrefix(authToken, "Bearer "); ok {
			authToken = after
		}
		server := "http://nginx"

		// 开发环境（生产时请注释或删除）
		authToken = "YIG8ANC8q2ROQF91r8Pe6-53rIG3oCxcqQN-mMdZpQKe7mKwNqIHenDNqbDDdyQIdo9w2KdveEpF1NaH-5Nfmv0dBr9TkjJ7srTrjvFfg1R9dzzVs7zL6JaAliRz8d5z"
		server = "http://127.0.0.1:2222"

		// 创建DooTask客户端
		client := utils.NewDooTaskClient(authToken, server)
		user, err := client.Client.GetUserInfo()
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		// 将用户信息存储在context中
		c.Set("user_id", user.UserID)
		c.Set("user_email", user.Email)
		c.Set("user_nickname", user.Nickname)
		c.Set("user_is_admin", slices.Contains(user.Identity, "admin"))

		c.Next()
	}
}

// AdminRoleMiddleware 管理员权限中间件
func AdminRoleMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 先执行认证中间件
		AuthMiddleware()(c)

		userIsAdmin, exists := c.Get("user_is_admin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户未登录"})
			c.Abort()
			return
		}

		if userIsAdmin.(bool) {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
		c.Abort()
	}
}
