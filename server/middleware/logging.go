package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

// LoggingMiddleware 操作日志中间件
func LoggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// 记录操作日志到数据库
		go func() {
			if global.DB != nil && param.StatusCode < 500 {
				logOperation(param)
			}
		}()

		// 返回控制台日志格式
		return fmt.Sprintf("[%s] %s %s %d %s %s\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
			param.ClientIP,
		)
	})
}

// logOperation 记录操作到数据库
func logOperation(param gin.LogFormatterParams) {
	// 只记录API操作
	if !strings.HasPrefix(param.Path, "/api/") {
		return
	}

	// 解析操作类型
	operation := getOperationType(param.Method)
	if operation == "" {
		return
	}

	// 创建操作日志
	log := models.OperationLog{
		Table:     extractTableName(param.Path),
		RecordID:  extractRecordID(param.Path),
		Operation: operation,
		Operator:  extractOperator(param.Keys),
		IPAddress: param.ClientIP,
		UserAgent: extractUserAgent(param.Keys),
	}

	// 保存到数据库
	global.DB.Create(&log)
}

// getOperationType 根据HTTP方法获取操作类型
func getOperationType(method string) models.OperationType {
	switch method {
	case "POST":
		return models.OperationTypeCreate
	case "PUT", "PATCH":
		return models.OperationTypeUpdate
	case "DELETE":
		return models.OperationTypeDelete
	default:
		return ""
	}
}

// extractTableName 从路径中提取表名
func extractTableName(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 2 {
		switch parts[1] {
		case "assets":
			return "assets"
		case "categories":
			return "categories"
		case "departments":
			return "departments"
		case "borrow-records":
			return "borrow_records"
		case "inventory-tasks":
			return "inventory_tasks"
		case "inventory-records":
			return "inventory_records"
		}
	}
	return "unknown"
}

// extractRecordID 从路径中提取记录ID
func extractRecordID(path string) uint {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 3 {
		if id, err := strconv.ParseUint(parts[2], 10, 32); err == nil {
			return uint(id)
		}
	}
	return 0
}

// extractOperator 从上下文中提取操作者
func extractOperator(keys map[string]interface{}) string {
	if operator, exists := keys["operator"]; exists {
		if str, ok := operator.(string); ok {
			return str
		}
	}
	return "system"
}

// extractUserAgent 从上下文中提取User-Agent
func extractUserAgent(keys map[string]interface{}) string {
	if userAgent, exists := keys["user_agent"]; exists {
		if str, ok := userAgent.(string); ok {
			return str
		}
	}
	return ""
}

// RequestResponseLoggingMiddleware 请求响应日志中间件
func RequestResponseLoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 只对API请求记录详细日志
		if !strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.Next()
			return
		}

		// 记录请求体
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// 创建响应写入器
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:          &bytes.Buffer{},
		}
		c.Writer = writer

		// 记录开始时间
		start := time.Now()

		// 处理请求
		c.Next()

		// 记录结束时间
		duration := time.Since(start)

		// 异步记录详细日志
		go func() {
			logDetailedOperation(c, requestBody, writer.body.Bytes(), duration)
		}()
	}
}

// responseWriter 响应写入器
type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// logDetailedOperation 记录详细操作日志
func logDetailedOperation(c *gin.Context, requestBody, responseBody []byte, duration time.Duration) {
	if global.DB == nil {
		return
	}

	// 解析请求和响应数据
	var oldData, newData datatypes.JSON

	if len(requestBody) > 0 {
		var reqData interface{}
		if err := json.Unmarshal(requestBody, &reqData); err == nil {
			if jsonData, err := json.Marshal(reqData); err == nil {
				newData = datatypes.JSON(jsonData)
			}
		}
	}

	// 创建详细操作日志
	log := models.OperationLog{
		Table:     extractTableName(c.Request.URL.Path),
		RecordID:  extractRecordID(c.Request.URL.Path),
		Operation: getOperationType(c.Request.Method),
		OldData:   oldData,
		NewData:   newData,
		Operator:  c.GetString("operator"),
		IPAddress: c.ClientIP(),
		UserAgent: c.GetHeader("User-Agent"),
	}

	// 保存到数据库
	global.DB.Create(&log)
}