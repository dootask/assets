package webhook

import (
	"dootask-ai/go-service/global"
	"dootask-ai/go-service/pkg/utils"
	"dootask-ai/go-service/routes/api/agents"
	"net/http"

	dootask "github.com/dootask/tools/server/go"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// Handler 机器人webhook处理器
type Handler struct {
}

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup) {
	handler := &Handler{}
	r.POST("/webhook/agent", handler.Webhook)
}

// Webhook 机器人webhook
func (h *Handler) Webhook(c *gin.Context) {
	var req WebhookRequest
	if err := c.ShouldBindWith(&req, binding.FormPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "VALIDATION_001",
			"message": "请求数据格式错误",
			"data":    err.Error(),
		})
		return
	}

	// 设置 DooTask 客户端
	client := utils.NewDooTaskClient(req.Token, "http://192.168.0.211:2222") // TODO: 上线后不需要添加server参数
	global.DooTaskClient = &client

	// 检查智能体是否存在
	var agent agents.Agent
	if err := global.DB.Where("bot_id = ?", req.BotUid).First(&agent).Error; err != nil {
		global.DooTaskClient.Client.SendMessage(dootask.SendMessageRequest{
			DialogID: int(req.DialogId),
			Text:     "智能体不存在",
			Silence:  true,
		})
		return
	}

	// 检查智能体是否启用
	if !agent.IsActive {
		global.DooTaskClient.Client.SendMessage(dootask.SendMessageRequest{
			DialogID: int(req.DialogId),
			Text:     "智能体未启用",
			Silence:  true,
		})
		return
	}

	global.DooTaskClient.Client.SendMessage(dootask.SendMessageRequest{
		DialogID: int(req.DialogId),
		Text:     "你好，我是智能体：" + agent.Name + "，很高兴认识你",
		Silence:  true,
	})
}
