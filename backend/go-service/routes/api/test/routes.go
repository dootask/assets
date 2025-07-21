package test

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler 健康检查处理器
type Handler struct {
}

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup) {
	handler := &Handler{}
	r.GET("/test", handler.Test)
}

// Test 测试
func (h *Handler) Test(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "测试成功",
		},
	})
}
