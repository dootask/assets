package service

import (
	"bufio"
	"context"
	"dootask-ai/go-service/global"
	"dootask-ai/go-service/pkg/utils"
	"dootask-ai/go-service/routes/api/agents"
	aimodels "dootask-ai/go-service/routes/api/ai-models"
	"dootask-ai/go-service/routes/api/conversations"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	dootask "github.com/dootask/tools/server/go"
	"gorm.io/gorm"

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

	// 获取消息 map 转 json
	webhookResponse, err := h.parseWebhookResponse(response)
	if err != nil {
		fmt.Println("解析响应数据失败:", err)
		return
	}

	// 创建对话
	var conversation conversations.Conversation
	dialogId := strconv.Itoa(webhookResponse.DialogID)
	userID := strconv.Itoa(int(agent.UserID))
	if err := global.DB.Where("dootask_chat_id = ? AND dootask_user_id = ?", dialogId, userID).First(&conversation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			conversation = conversations.Conversation{
				AgentID:       agent.ID,
				DootaskChatID: dialogId,
				DootaskUserID: userID,
				IsActive:      true,
			}
			if err := global.DB.Create(&conversation).Error; err != nil {
				fmt.Println("创建对话失败:", err)
				return
			}
		} else {
			fmt.Println("查询对话失败:", err)
			return
		}
	}

	// 创建消息
	message := conversations.Message{
		ConversationID: conversation.ID,
		SendID:         req.SendId,
		Role:           "user",
	}
	if err := global.DB.Create(&message).Error; err != nil {
		fmt.Println("创建消息失败:", err)
		return
	}
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
	fmt.Println("cache", cache)

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
	if aiModel.IsEnabled == nil || !*aiModel.IsEnabled {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", "AI模型未启用")
		return
	}

	// 请求AI
	resp, err := h.requestAI(aiModel, agent, req)
	if err != nil {
		c.String(http.StatusOK, "id: %d\nevent: %s\ndata: {\"error\": \"%s\"}\n\n", 0, "done", err.Error())
		return
	}

	defer resp.Body.Close()

	// 创建 DooTask 客户端
	client := utils.NewDooTaskClient(req.Token)
	global.DooTaskClient = &client

	// 创建消息处理器
	handler := NewMessageHandler(global.DB, global.DooTaskClient.Client)

	// TODO: 延迟2秒
	time.Sleep(time.Second * 2)

	// 流式消息
	c.Stream(func(w io.Writer) bool {
		reader := bufio.NewReader(resp.Body)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				if err.Error() == "EOF" {
					break
				}
				logError("读取数据失败", err)
				break
			}

			if after, ok := strings.CutPrefix(line, "data:"); ok {
				line = strings.TrimSpace(after)
			}

			if line == "[DONE]" {
				handler.handleDone(req, w)
				break
			}

			var v StreamLineData
			if err := json.Unmarshal([]byte(line), &v); err != nil {
				if len(line) > 1 {
					logError("JSON解析失败", err, "line:", line)
				}
				continue
			}

			handler.handleMessage(v, req, w)
		}
		// 返回 false 结束流
		return false
	})
}

// 解析响应数据
func (h *Handler) parseWebhookResponse(response map[string]any) (*WebhookResponse, error) {
	responseJson, err := json.Marshal(response)
	if err != nil {
		fmt.Println("解析响应数据失败:", err)
		return nil, err
	}

	var webhookResponse WebhookResponse
	if err := json.Unmarshal(responseJson, &webhookResponse); err != nil {
		fmt.Println("解析响应数据失败:", err)
		return nil, err
	}

	return &webhookResponse, nil
}

// 请求AI
func (h *Handler) requestAI(aiModel aimodels.AIModel, agent agents.Agent, req WebhookRequest) (*http.Response, error) {
	baseURL := utils.GetEnvWithDefault("AI_BASE_URL", "")
	proxyURL := utils.GetEnvWithDefault("AI_PROXY_URL", "")
	requestTimeout, _ := strconv.Atoi(utils.GetEnvWithDefault("AI_REQUEST_TIMEOUT", "60"))

	if baseURL == "" {
		return nil, errors.New("AI_BASE_URL 未配置")
	}

	httpClient := utils.NewHTTPClient(
		baseURL,
		utils.WithTimeout(time.Duration(requestTimeout)*time.Second),
	)

	agentConfig := map[string]any{
		"api_key":     aiModel.ApiKey,
		"api_version": "",
		"base_url":    aiModel.BaseURL,
		"credentials": "",
		"proxy_url":   proxyURL,
		"spicy_level": 0,
		"temperature": aiModel.Temperature,
	}

	// 发送POST请求获取流式响应
	data := map[string]any{
		"message":       req.Text,
		"provider":      aiModel.Provider,
		"model":         aiModel.ModelName,
		"thread_id":     strconv.Itoa(int(req.SessionId)),
		"user_id":       strconv.Itoa(int(agent.UserID)),
		"agent_config":  agentConfig,
		"stream_tokens": true,
	}

	resp, err := httpClient.Stream(context.Background(), "/stream", nil, nil, http.MethodPost, data, "application/json")
	if err != nil {
		return nil, errors.New("请求AI失败")
	}

	return resp, nil
}
