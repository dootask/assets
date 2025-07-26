package service

import (
	"dootask-ai/go-service/routes/api/conversations"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	dootask "github.com/dootask/tools/server/go"

	"gorm.io/gorm"
)

// MessageHandler 消息处理器
type MessageHandler struct {
	db     *gorm.DB
	client *dootask.Client
}

// NewMessageHandler 创建消息处理器
func NewMessageHandler(db *gorm.DB, client *dootask.Client) *MessageHandler {
	return &MessageHandler{
		db:     db,
		client: client,
	}
}

// sendSSEResponse 发送SSE响应
func (h *MessageHandler) sendSSEResponse(w io.Writer, req WebhookRequest, event string, content string) {
	fmt.Fprintf(w, "id: %d\nevent: %s\ndata: {\"content\": \"%s\"}\n\n", req.SendId, event, content)
}

// sendDooTaskMessage 发送DooTask消息
func (h *MessageHandler) sendDooTaskMessage(req WebhookRequest, text string) {
	h.client.SendMessage(dootask.SendMessageRequest{
		DialogID:   int(req.DialogId),
		UpdateID:   int(req.SendId),
		UpdateMark: "no",
		Text:       text,
		TextType:   "md",
		Silence:    true,
	})
}

// handleTokenMessage 处理token类型消息
func (h *MessageHandler) handleTokenMessage(v StreamLineData, req WebhookRequest, w io.Writer) {
	if content, ok := v.Content.(string); ok {
		// 去掉换行末尾\n
		content = strings.TrimSuffix(content, "\n")
		h.sendSSEResponse(w, req, "append", content)
	} else {
		logError("Token消息内容类型错误", nil, "type:", v.Type, "content:", fmt.Sprintf("%v", v.Content))
	}
}

// handleMessageMessage 处理message类型消息
func (h *MessageHandler) handleMessageMessage(v StreamLineData, req WebhookRequest) {
	content, ok := v.Content.(map[string]any)
	if !ok {
		logError("Message消息内容类型错误", nil, "type:", v.Type, "content:", fmt.Sprintf("%v", v.Content))
		return
	}

	contentJson, err := json.Marshal(content)
	if err != nil {
		logError("Message消息JSON序列化失败", err, "type:", v.Type)
		return
	}

	var StreamMessageData StreamMessageData
	if err := json.Unmarshal(contentJson, &StreamMessageData); err != nil {
		logError("Message消息JSON反序列化失败", err, "type:", v.Type)
		return
	}

	h.updateMessage(req, StreamMessageData.Content)
	h.sendDooTaskMessage(req, StreamMessageData.Content)
}

// parseErrorContent 解析错误内容
func (h *MessageHandler) parseErrorContent(content string) (*StreamErrorData, error) {
	// 使用正则表达式匹配 "Error code: XXX - " 格式，支持任意错误码
	// 先尝试匹配标准格式
	if strings.Contains(content, "Error code:") {
		// 查找 "Error code: " 后面的第一个 " - " 分隔符
		errorCodePrefix := "Error code:"
		startIndex := strings.Index(content, errorCodePrefix)
		if startIndex != -1 {
			// 找到 " - " 分隔符的位置
			dashIndex := strings.Index(content[startIndex:], " - ")
			if dashIndex != -1 {
				// 截取 " - " 后面的内容
				content = content[startIndex+dashIndex+3:]
			}
		}
	}

	// 替换Python风格的引号和None值
	content = strings.ReplaceAll(content, "'", "\"")
	content = strings.ReplaceAll(content, "None", "null")

	var StreamErrorData StreamErrorData
	if err := json.Unmarshal([]byte(content), &StreamErrorData); err != nil {
		return nil, err
	}
	return &StreamErrorData, nil
}

// handleErrorMessage 处理error类型消息
func (h *MessageHandler) handleErrorMessage(v StreamLineData, req WebhookRequest, w io.Writer) {
	if content, ok := v.Content.(string); ok {
		StreamErrorData, err := h.parseErrorContent(content)
		if err != nil {
			logError("错误消息解析失败", err, "type:", v.Type)
			return
		}

		h.sendSSEResponse(w, req, "done", StreamErrorData.Error.Message)
		h.updateMessage(req, StreamErrorData.Error.Message)
		h.sendDooTaskMessage(req, StreamErrorData.Error.Message)
	} else {
		logError("Error消息内容类型错误", nil, "type:", v.Type, "content:", fmt.Sprintf("%v", v.Content))
	}
}

// handleDone 处理结束消息
func (h *MessageHandler) handleDone(req WebhookRequest, w io.Writer) {
	fmt.Println("---------------结束-----------------")
	h.sendSSEResponse(w, req, "done", "")
}

// handleMessage 根据消息类型分发处理
func (h *MessageHandler) handleMessage(v StreamLineData, req WebhookRequest, w io.Writer) {
	switch v.Type {
	case "token":
		h.handleTokenMessage(v, req, w)
	case "message":
		h.handleMessageMessage(v, req)
	case "error":
		h.handleErrorMessage(v, req, w)
	default:
		logError("未知消息类型", nil, "type:", v.Type, "send_id:", fmt.Sprintf("%d", req.SendId))
	}
}

// updateMessage 更新消息
func (h *MessageHandler) updateMessage(req WebhookRequest, content string) {
	message := conversations.Message{}
	h.db.Where("send_id = ?", req.SendId).First(&message)
	if message.ID > 0 {
		h.db.Model(&message).Update("content", content)
	}
}

// logError 统一错误日志格式
func logError(message string, err error, fields ...string) {
	if err != nil {
		fmt.Printf("[ERROR] %s: %v | %s\n", message, err, strings.Join(fields, " | "))
	} else {
		fmt.Printf("[ERROR] %s | %s\n", message, strings.Join(fields, " | "))
	}
}
