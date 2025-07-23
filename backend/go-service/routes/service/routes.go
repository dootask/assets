package service

import (
	"context"
	"dootask-ai/go-service/global"
	"dootask-ai/go-service/pkg/utils"
	"dootask-ai/go-service/routes/api/agents"
	"dootask-ai/go-service/routes/api/conversations"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
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
	responseData, err := h.parseResponse(response)
	if err != nil {
		fmt.Println("解析响应数据失败:", err)
		return
	}

	messageData, err := h.parseMessage(responseData.Msg)
	if err != nil {
		fmt.Println("解析消息数据失败:", err)
		return
	}

	fmt.Printf("messageData: %+v\n", messageData)

	// 创建对话
	var conversation conversations.Conversation
	dialogId := strconv.Itoa(responseData.DialogID)
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

	// 创建 DooTask 客户端
	client := utils.NewDooTaskClient(req.Token)
	global.DooTaskClient = &client

	// TODO:延迟2秒
	time.Sleep(time.Second * 2)

	contents := map[string]string{
		"replace": "替换消息",
		"append":  "追加消息",
		"done":    "完成消息",
	}

	// 流式消息
	c.Stream(func(w io.Writer) bool {
		// 追加消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, "append", contents["append"])

		// 替换消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, "replace", contents["replace"])

		// 完成消息
		fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, "done", contents["done"])

		message := conversations.Message{}
		global.DB.Where("send_id = ?", req.SendId).First(&message)
		if message.ID > 0 {
			global.DB.Model(&message).Update("content", contents["replace"])
		}

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

// 解析响应数据
func (h *Handler) parseResponse(response map[string]any) (*Response, error) {
	responseJson, err := json.Marshal(response)
	if err != nil {
		fmt.Println("解析响应数据失败:", err)
		return nil, err
	}

	var responseData Response
	if err := json.Unmarshal(responseJson, &responseData); err != nil {
		fmt.Println("解析响应数据失败:", err)
		return nil, err
	}

	return &responseData, nil
}

// 解析消息数据
func (h *Handler) parseMessage(message map[string]any) (*Message, error) {
	messageJson, err := json.Marshal(message)
	if err != nil {
		fmt.Println("解析消息数据失败:", err)
		return nil, err
	}

	var messageData Message
	if err := json.Unmarshal(messageJson, &messageData); err != nil {
		fmt.Println("解析消息数据失败:", err)
		return nil, err
	}

	return &messageData, nil
}
