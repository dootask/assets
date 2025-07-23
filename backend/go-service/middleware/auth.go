package middleware

import (
	"dootask-ai/go-service/pkg/utils"
	"errors"
	"net/http"
	"slices"
	"strings"

	dootask "github.com/dootask/tools/server/go"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware 对接口进行鉴权
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 标记为已认证（防止重复认证）
		if c.GetBool("is_authenticated") {
			return
		}
		c.Set("is_authenticated", true)

		// 设置用户信息为空
		c.Set("user_id", 0)
		c.Set("user_info", nil)
		c.Set("user_error", "not_authenticated")

		// 从请求头获取token
		authToken := c.GetHeader("Authorization")
		if after, ok := strings.CutPrefix(authToken, "Bearer "); ok {
			authToken = after
		}

		// 如果token为空，则设置用户信息为空
		if authToken == "" {
			c.Set("user_error", "token is empty")
			c.Next()
			return
		}

		// 从请求头获取server
		server := "http://nginx"
		if serverHeader := c.GetHeader("Server"); strings.HasPrefix(serverHeader, "http") {
			server = serverHeader
		}

		// 创建DooTask客户端
		client := utils.NewDooTaskClient(authToken, server)
		user, err := client.Client.GetUserInfo()
		if err != nil {
			c.Set("user_error", err.Error())
			c.Next()
			return
		}

		// 将用户信息存储在context中
		c.Set("user_id", user.UserID)
		c.Set("user_info", user)
		c.Set("user_error", nil)

		c.Next()
	}
}

// UserRoleMiddleware 用户权限中间件
func UserRoleMiddleware(role ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		AuthMiddleware()(c)

		// 获取用户信息
		user, err := GetUserInfo(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		// 判断用户是否具有指定角色
		if len(role) > 0 {
			userHasRole := slices.Contains(user.Identity, role[0])
			if !userHasRole {
				c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// GetUserInfo 获取用户信息
func GetUserInfo(c *gin.Context) (*dootask.UserInfo, error) {
	userError, exists := c.Get("user_error")
	if exists && userError != nil {
		return nil, errors.New(userError.(string))
	}
	userInfo, exists := c.Get("user_info")
	if !exists {
		return nil, errors.New("user info not found")
	}
	user, ok := userInfo.(*dootask.UserInfo)
	if !ok {
		return nil, errors.New("user info type error")
	}
	if user.UserID == 0 {
		return nil, errors.New("user id is 0")
	}
	return user, nil
}
