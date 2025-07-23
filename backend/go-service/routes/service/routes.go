package service

import (
	"context"
	"dootask-ai/go-service/global"
	"dootask-ai/go-service/pkg/utils"
	"dootask-ai/go-service/routes/api/agents"
	"fmt"
	"io"
	"net/http"
	"time"

	dootask "github.com/dootask/tools/server/go"

	"github.com/duke-git/lancet/v2/convertor"
	"github.com/duke-git/lancet/v2/random"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// Handler 机器人webhook处理器
type Handler struct {
}

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup) {
	handler := &Handler{}
	serviceGroup := r.Group("/service")
	{
		serviceGroup.POST("/webhook", handler.Webhook)
		serviceGroup.GET("/stream/:streamId", handler.Stream)
	}
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
	client := utils.NewDooTaskClient(req.Token)
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

	// 创建一条消息
	var response map[string]any
	global.DooTaskClient.Client.SendMessage(dootask.SendMessageRequest{
		DialogID:   int(req.DialogId),
		Text:       "...",
		TextType:   "md",
		Silence:    true,
		ReplyID:    int(req.MsgId),
		ReplyCheck: "yes",
	}, &response)
	sendId, _ := convertor.ToInt(response["id"])

	// 生成随机流ID
	streamId := random.RandString(6)
	global.Redis.Set(context.Background(), fmt.Sprintf("stream:%s", streamId), sendId, time.Minute*10)

	// 通知 Stream 服务
	global.DooTaskClient.Client.SendStreamMessage(dootask.SendStreamMessageRequest{
		UserID:    int(req.MsgUid),
		StreamURL: fmt.Sprintf("%s/service/stream/%s", c.GetString("base_url"), streamId),
	})

	fmt.Println("sendId", sendId, "response", response)
}

// Stream 流式消息
func (h *Handler) Stream(c *gin.Context) {
	/* 流式消息的格式为：
	id: 消息ID
	event: replace|append|done
	data: {"content": "...", "error"?: "..."}
	*/

	// 设置响应头
	c.Header("Content-Type", "text/event-stream; charset=utf-8")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// 获取流ID
	streamId := c.Param("streamId")
	sendId, err := global.Redis.Get(context.Background(), fmt.Sprintf("stream:%s", streamId)).Int()

	// 流式消息
	c.Stream(func(w io.Writer) bool {
		// 消息不存在
		if err != nil {
			fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", sendId, "done", "流式消息不存在")
			return false
		}

		// 延迟3秒
		time.Sleep(time.Second * 3)

		// 追加消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", sendId, "append", "追加消息")

		// 替换消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", sendId, "replace", "替换消息")

		// 完成消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", sendId, "done", "完成消息")

		// 返回 false 结束流
		return false
	})
}
