package service

// WebhookRequest 机器人webhook请求
type WebhookRequest struct {
	Text       string         `json:"text" form:"text"`               // 消息文本
	ReplyText  string         `json:"reply_text" form:"reply_text"`   // 回复文本（引用的消息）
	Token      string         `json:"token" form:"token"`             // 机器人Token
	DialogId   int64          `json:"dialog_id" form:"dialog_id"`     // 对话ID
	DialogType string         `json:"dialog_type" form:"dialog_type"` // 对话类型
	MsgId      int64          `json:"msg_id" form:"msg_id"`           // 消息ID
	MsgUid     int64          `json:"msg_uid" form:"msg_uid"`         // 消息发送人ID
	MsgUser    WebhookMsgUser `json:"msg_user" form:"msg_user"`       // 消息发送人
	Mention    int64          `json:"mention" form:"mention"`         // 是否被@到
	BotUid     int64          `json:"bot_uid" form:"bot_uid"`         // 机器人ID
	Version    string         `json:"version" form:"version"`         // 系统版本
	Extras     map[string]any `json:"extras" form:"extras"`           // 扩展字段
}

// WebhookMsgUser 消息发送人
type WebhookMsgUser struct {
	Userid     int64  `json:"userid" form:"userid"`
	Email      string `json:"email" form:"email"`
	Nickname   string `json:"nickname" form:"nickname"`
	Profession string `json:"profession" form:"profession"`
	Lang       string `json:"lang" form:"lang"`
	Token      string `json:"token" form:"token"`
}

// Response 机器人响应
type Response struct {
	Bot        int            `json:"bot"`
	CreatedAt  string         `json:"created_at"`
	DialogID   int            `json:"dialog_id"`
	DialogType string         `json:"dialog_type"`
	ForwardID  int            `json:"forward_id"`
	ID         int            `json:"id"`
	Link       int            `json:"link"`
	UserID     int            `json:"userid"`
	Msg        map[string]any `json:"msg"`
}

// Message 机器人消息
type Message struct {
	Text string `json:"text"`
	Type string `json:"type"`
}
