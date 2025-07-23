package service

import (
	"context"
	"dootask-ai/go-service/global"
	"dootask-ai/go-service/pkg/utils"
	"dootask-ai/go-service/routes/api/agents"
	aimodels "dootask-ai/go-service/routes/api/ai-models"
	"encoding/json"
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

	// 群聊且没有@机器人，不处理
	if req.DialogType == "group" && req.Mention == 0 {
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
	req.SendId, _ = convertor.ToInt(response["id"])

	// 生成随机流ID
	req.StreamId = random.RandString(6)
	global.Redis.Set(context.Background(), fmt.Sprintf("stream:%s", req.StreamId), convertor.ToString(req), time.Minute*10)

	// 通知 Stream 服务
	global.DooTaskClient.Client.SendStreamMessage(dootask.SendStreamMessageRequest{
		UserID:    int(req.MsgUid),
		StreamURL: fmt.Sprintf("%s/service/stream/%s", c.GetString("base_url"), req.StreamId),
	})
}

// Stream 流式消息
func (h *Handler) Stream(c *gin.Context) {
	// 设置响应头
	c.Header("Content-Type", "text/event-stream; charset=utf-8")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// 获取流ID
	streamId := c.Param("streamId")
	cache, err := global.Redis.Get(context.Background(), fmt.Sprintf("stream:%s", streamId)).Result()

	// 判断流式消息是否存在
	if err != nil {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "流式消息不存在")
		return
	}

	// 反序列化流式消息
	var req WebhookRequest
	if err := json.Unmarshal([]byte(cache), &req); err != nil {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "流式消息错误")
		return
	}

	// 检查智能体是否存在
	var agent agents.Agent
	if err := global.DB.Where("bot_id = ?", req.BotUid).First(&agent).Error; err != nil {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "智能体不存在")
		return
	}

	// 检查智能体是否启用
	if !agent.IsActive {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "智能体未启用")
		return
	}

	// 检查AI模型是否存在
	var aiModel aimodels.AIModel
	if err := global.DB.Where("id = ?", agent.AIModelID).First(&aiModel).Error; err != nil {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "AI模型不存在")
		return
	}

	// 检查AI模型是否启用
	if !aiModel.IsEnabled {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "AI模型未启用")
		return
	}

	// TODO: 发起AI请求
	request := gin.H{
		// 模型参数
		"provider":    aiModel.Provider,
		"model":       aiModel.ModelName,
		"api_key":     aiModel.ApiKey,
		"base_url":    aiModel.BaseURL,
		"max_tokens":  aiModel.MaxTokens,
		"temperature": aiModel.Temperature,
		// 请求参数
		"prompt": agent.Prompt,
		"messages": []gin.H{
			{
				"role":    "user",
				"content": req.Text,
			},
		},
	}
	fmt.Println("request", request)

	// 创建 DooTask 客户端
	client := utils.NewDooTaskClient(req.Token)
	global.DooTaskClient = &client

	// TODO: 延迟2秒
	time.Sleep(time.Second * 2)

	// 流式消息
	c.Stream(func(w io.Writer) bool {
		// 追加消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, "append", "追加消息")

		// 替换消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, "replace", "替换消息")

		// 完成消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, "done", "完成消息")

		// 更新消息
		global.DooTaskClient.Client.SendMessage(dootask.SendMessageRequest{
			DialogID:   int(req.DialogId),
			UpdateID:   int(req.SendId),
			UpdateMark: "no",
			Text:       "更新消息",
			TextType:   "md",
			Silence:    true,
		})

		// 返回 false 结束流
		return false
	})
}
