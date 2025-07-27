package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

// BaseMiddleware 基础中间件
func BaseMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 基础地址
		scheme := "http"
		if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		host := c.GetHeader("X-Forwarded-Host")
		if host == "" {
			host = c.Request.Host
		}
		c.Set("base_url", fmt.Sprintf("%s://%s", scheme, host))

		// 语言偏好
		lang := c.GetHeader("Language")
		if lang == "" {
			lang = c.GetString("Accept-Language")
		}
		if lang == "" {
			lang = "en-US"
		}
		c.Set("lang", lang)

		c.Next()
	}
}
