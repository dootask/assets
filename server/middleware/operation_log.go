package middleware

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"bytes"
	"encoding/json"
	"io"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuditLogConfig 审计日志配置
type AuditLogConfig struct {
	// 需要记录日志的表名映射
	TableMapping map[string]string
	// 需要记录的操作类型
	Operations []string
	// 排除的路径
	ExcludePaths []string
}

// DefaultAuditLogConfig 默认配置
func DefaultAuditLogConfig() *AuditLogConfig {
	return &AuditLogConfig{
		TableMapping: map[string]string{
			"/api/assets":      "assets",
			"/api/categories":  "categories",
			"/api/departments": "departments",
			"/api/borrow":      "borrow_records",
			"/api/inventory":   "inventory_tasks",
		},
		Operations: []string{"POST", "PUT", "DELETE"},
		ExcludePaths: []string{
			"/api/assets/check-asset-no",
			"/api/assets/export",
			"/api/upload",
		},
	}
}

// AuditLogMiddleware 审计日志中间件
func AuditLogMiddleware(config *AuditLogConfig) gin.HandlerFunc {
	if config == nil {
		config = DefaultAuditLogConfig()
	}

	return func(c *gin.Context) {
		// 检查是否需要记录日志
		if !shouldLogAuditOperation(c, config) {
			c.Next()
			return
		}

		// 获取请求体
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// 记录请求前的数据（用于UPDATE和DELETE操作）
		var oldData interface{}
		if c.Request.Method == "PUT" || c.Request.Method == "DELETE" {
			oldData = getAuditOldData(c, config)
		}

		// 创建响应写入器来捕获响应
		auditWriter := &auditResponseWriter{
			ResponseWriter: c.Writer,
			body:          &bytes.Buffer{},
			statusCode:    200,
		}
		c.Writer = auditWriter

		// 继续处理请求
		c.Next()

		// 请求处理完成后记录日志
		go func() {
			logAuditOperation(c, config, requestBody, oldData, auditWriter)
		}()
	}
}

// shouldLogAuditOperation 判断是否需要记录操作日志
func shouldLogAuditOperation(c *gin.Context, config *AuditLogConfig) bool {
	// 检查HTTP方法
	methodMatch := false
	for _, method := range config.Operations {
		if c.Request.Method == method {
			methodMatch = true
			break
		}
	}
	if !methodMatch {
		return false
	}

	// 检查排除路径
	for _, excludePath := range config.ExcludePaths {
		if strings.Contains(c.Request.URL.Path, excludePath) {
			return false
		}
	}

	// 检查是否是需要记录的API路径
	for apiPath := range config.TableMapping {
		if strings.HasPrefix(c.Request.URL.Path, apiPath) {
			return true
		}
	}

	return false
}

// getAuditOldData 获取操作前的数据
func getAuditOldData(c *gin.Context, config *AuditLogConfig) interface{} {
	// 从URL中提取ID
	id := extractAuditIDFromPath(c.Request.URL.Path)
	if id == 0 {
		return nil
	}

	// 根据路径确定表名和模型
	var tableName string
	for apiPath, table := range config.TableMapping {
		if strings.HasPrefix(c.Request.URL.Path, apiPath) {
			tableName = table
			break
		}
	}

	if tableName == "" {
		return nil
	}

	// 根据表名查询数据
	switch tableName {
	case "assets":
		var asset models.Asset
		if err := global.DB.Preload("Category").Preload("Department").First(&asset, id).Error; err == nil {
			return asset
		}
	case "categories":
		var category models.Category
		if err := global.DB.First(&category, id).Error; err == nil {
			return category
		}
	case "departments":
		var department models.Department
		if err := global.DB.First(&department, id).Error; err == nil {
			return department
		}
	case "borrow_records":
		var borrowRecord models.BorrowRecord
		if err := global.DB.Preload("Asset").Preload("Department").First(&borrowRecord, id).Error; err == nil {
			return borrowRecord
		}
	case "inventory_tasks":
		var inventoryTask models.InventoryTask
		if err := global.DB.First(&inventoryTask, id).Error; err == nil {
			return inventoryTask
		}
	}

	return nil
}

// extractAuditIDFromPath 从路径中提取ID
func extractAuditIDFromPath(path string) uint {
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if id, err := strconv.ParseUint(part, 10, 32); err == nil {
			// 确保这是一个有效的ID（不是其他数字参数）
			if i > 0 && (parts[i-1] == "assets" || parts[i-1] == "categories" || 
				parts[i-1] == "departments" || parts[i-1] == "borrow" || 
				parts[i-1] == "inventory") {
				return uint(id)
			}
		}
	}
	return 0
}

// logAuditOperation 记录操作日志
func logAuditOperation(c *gin.Context, config *AuditLogConfig, requestBody []byte, oldData interface{}, auditWriter *auditResponseWriter) {
	// 只记录成功的操作（2xx状态码）
	if auditWriter.statusCode < 200 || auditWriter.statusCode >= 300 {
		return
	}

	// 确定表名
	var tableName string
	for apiPath, table := range config.TableMapping {
		if strings.HasPrefix(c.Request.URL.Path, apiPath) {
			tableName = table
			break
		}
	}

	if tableName == "" {
		return
	}

	// 确定操作类型
	var operation models.OperationType
	switch c.Request.Method {
	case "POST":
		operation = models.OperationTypeCreate
	case "PUT":
		operation = models.OperationTypeUpdate
	case "DELETE":
		operation = models.OperationTypeDelete
	default:
		return
	}

	// 获取记录ID
	recordID := extractAuditIDFromPath(c.Request.URL.Path)
	if recordID == 0 && operation != models.OperationTypeCreate {
		return
	}

	// 对于CREATE操作，尝试从响应中获取ID
	if operation == models.OperationTypeCreate {
		recordID = extractAuditIDFromResponse(auditWriter.body.Bytes())
	}

	// 准备日志数据
	var oldDataJSON []byte
	var newDataJSON []byte

	if oldData != nil {
		oldDataJSON, _ = json.Marshal(oldData)
	}

	if operation == models.OperationTypeCreate || operation == models.OperationTypeUpdate {
		if len(requestBody) > 0 {
			newDataJSON = requestBody
		}
	}

	// 创建操作日志
	operationLog := models.OperationLog{
		Table:     tableName,
		RecordID:  recordID,
		Operation: operation,
		OldData:   oldDataJSON,
		NewData:   newDataJSON,
		Operator:  getAuditOperator(c),
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}

	// 保存到数据库
	if err := global.DB.Create(&operationLog).Error; err != nil {
		// 记录错误但不影响主要业务流程
		// 可以考虑使用日志系统记录这个错误
		_ = err
	}
}

// extractAuditIDFromResponse 从响应中提取ID
func extractAuditIDFromResponse(responseBody []byte) uint {
	var response map[string]interface{}
	if err := json.Unmarshal(responseBody, &response); err != nil {
		return 0
	}

	// 尝试从不同的响应结构中提取ID
	if data, ok := response["data"].(map[string]interface{}); ok {
		if id, ok := data["id"].(float64); ok {
			return uint(id)
		}
	}

	return 0
}

// getAuditOperator 获取操作者信息
func getAuditOperator(c *gin.Context) string {
	// 这里可以从JWT token或session中获取用户信息
	// 目前系统没有用户认证，返回默认值
	if operator := c.GetHeader("X-Operator"); operator != "" {
		return operator
	}
	return "system"
}

// auditResponseWriter 响应写入器，用于捕获响应内容
type auditResponseWriter struct {
	gin.ResponseWriter
	body       *bytes.Buffer
	statusCode int
}

func (w *auditResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *auditResponseWriter) WriteHeader(status int) {
	w.statusCode = status
	w.ResponseWriter.WriteHeader(status)
}