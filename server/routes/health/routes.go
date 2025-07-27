package health

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// Handler 健康检查处理器
type Handler struct {
}

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup) {
	handler := &Handler{}
	r.GET("/health", handler.HealthCheck)
}

// HealthCheck 健康检查
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":       "healthy",
			"service":      "asset-management-server",
			"timestamp":    time.Now().Format(time.RFC3339),
			"app_name":     os.Getenv("APP_NAME"),
			"app_version":  os.Getenv("APP_VERSION"),
			"log_level":    os.Getenv("LOG_LEVEL"),
			"enable_debug": os.Getenv("ENABLE_DEBUG"),
			"message":      "服务运行正常",
		},
	})
}
