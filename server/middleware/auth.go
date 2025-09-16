package middleware

import (
	"errors"
	"net/http"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"

	dootask "github.com/dootask/tools/server/go"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware 简化的认证中间件（支持微前端环境）
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查微前端环境传递的用户信息
		microAppUserID := c.GetHeader("X-MicroApp-User-ID")
		microAppUserToken := c.GetHeader("X-MicroApp-User-Token")

		// 创建客户端
		client := dootask.NewClient(
			microAppUserToken,
			dootask.WithTimeout(30*time.Second),
		)

		// 获取用户信息
		user, err := client.GetUserInfo()
		if err != nil {
			c.Set("is_authenticated", false)
			c.AbortWithError(http.StatusForbidden, errors.New("权限不足"))
			return
		}
		dootaskUserID := strconv.FormatUint(uint64(user.UserID), 10)
		// 检查用户ID是否匹配
		if dootaskUserID != microAppUserID {
			c.Set("is_authenticated", false)
			c.AbortWithError(http.StatusForbidden, errors.New("权限不足"))
			return
		}

		authorizedUsers := os.Getenv("AUTHORIZED_USERS")
		authorizedUsersList := strings.Split(authorizedUsers, ",")
		if slices.Contains(authorizedUsersList, dootaskUserID) {
			c.Set("is_authenticated", true)
		} else {
			c.Set("is_authenticated", false)
			c.AbortWithError(http.StatusForbidden, errors.New("权限不足"))
			return
		}

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
