package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse 统一API响应格式
type APIResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// 响应码常量
const (
	// 通用响应码
	SUCCESS           = "SUCCESS"
	INTERNAL_ERROR    = "INTERNAL_ERROR"
	VALIDATION_ERROR  = "VALIDATION_ERROR"
	NOT_FOUND         = "NOT_FOUND"
	UNAUTHORIZED      = "UNAUTHORIZED"
	FORBIDDEN         = "FORBIDDEN"
	BAD_REQUEST       = "BAD_REQUEST"
	
	// 资产相关响应码
	ASSET_NOT_FOUND   = "ASSET_001"
	ASSET_NO_EXISTS   = "ASSET_002"
	ASSET_IN_USE      = "ASSET_003"
	ASSET_NOT_AVAILABLE = "ASSET_004"
	
	// 分类相关响应码
	CATEGORY_NOT_FOUND = "CATEGORY_001"
	CATEGORY_HAS_ASSETS = "CATEGORY_002"
	CATEGORY_HAS_CHILDREN = "CATEGORY_003"
	CATEGORY_CODE_EXISTS = "CATEGORY_004"
	
	// 部门相关响应码
	DEPARTMENT_NOT_FOUND = "DEPARTMENT_001"
	DEPARTMENT_HAS_ASSETS = "DEPARTMENT_002"
	DEPARTMENT_CODE_EXISTS = "DEPARTMENT_003"
	
	// 借用相关响应码
	BORROW_NOT_FOUND = "BORROW_001"
	ALREADY_RETURNED = "BORROW_002"
	ASSET_ALREADY_BORROWED = "BORROW_003"
	
	// 盘点相关响应码
	INVENTORY_TASK_NOT_FOUND = "INVENTORY_001"
	INVENTORY_TASK_COMPLETED = "INVENTORY_002"
	
	// 文件上传相关响应码
	FILE_TOO_LARGE = "FILE_001"
	FILE_TYPE_NOT_ALLOWED = "FILE_002"
	FILE_UPLOAD_FAILED = "FILE_003"
)

// 响应消息映射
var responseMessages = map[string]string{
	SUCCESS:           "操作成功",
	INTERNAL_ERROR:    "内部服务器错误",
	VALIDATION_ERROR:  "数据验证失败",
	NOT_FOUND:         "资源不存在",
	UNAUTHORIZED:      "未授权访问",
	FORBIDDEN:         "禁止访问",
	BAD_REQUEST:       "请求参数错误",
	
	ASSET_NOT_FOUND:   "资产不存在",
	ASSET_NO_EXISTS:   "资产编号已存在",
	ASSET_IN_USE:      "资产正在使用中",
	ASSET_NOT_AVAILABLE: "资产不可用",
	
	CATEGORY_NOT_FOUND: "分类不存在",
	CATEGORY_HAS_ASSETS: "分类下存在资产，无法删除",
	CATEGORY_HAS_CHILDREN: "分类下存在子分类，无法删除",
	CATEGORY_CODE_EXISTS: "分类编码已存在",
	
	DEPARTMENT_NOT_FOUND: "部门不存在",
	DEPARTMENT_HAS_ASSETS: "部门下存在资产，无法删除",
	DEPARTMENT_CODE_EXISTS: "部门编码已存在",
	
	BORROW_NOT_FOUND: "借用记录不存在",
	ALREADY_RETURNED: "资产已归还",
	ASSET_ALREADY_BORROWED: "资产已被借用",
	
	INVENTORY_TASK_NOT_FOUND: "盘点任务不存在",
	INVENTORY_TASK_COMPLETED: "盘点任务已完成",
	
	FILE_TOO_LARGE: "文件大小超出限制",
	FILE_TYPE_NOT_ALLOWED: "文件类型不允许",
	FILE_UPLOAD_FAILED: "文件上传失败",
}

// GetMessage 获取响应码对应的消息
func GetMessage(code string) string {
	if message, exists := responseMessages[code]; exists {
		return message
	}
	return "未知错误"
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Code:    SUCCESS,
		Message: GetMessage(SUCCESS),
		Data:    data,
	})
}

// Error 错误响应
func Error(c *gin.Context, code string, data interface{}) {
	statusCode := getHTTPStatusCode(code)
	c.JSON(statusCode, APIResponse{
		Code:    code,
		Message: GetMessage(code),
		Data:    data,
	})
}

// ErrorWithMessage 带自定义消息的错误响应
func ErrorWithMessage(c *gin.Context, code string, message string, data interface{}) {
	statusCode := getHTTPStatusCode(code)
	c.JSON(statusCode, APIResponse{
		Code:    code,
		Message: message,
		Data:    data,
	})
}

// ValidationError 验证错误响应
func ValidationError(c *gin.Context, errors interface{}) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Code:    VALIDATION_ERROR,
		Message: GetMessage(VALIDATION_ERROR),
		Data:    errors,
	})
}

// InternalError 内部错误响应
func InternalError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, APIResponse{
		Code:    INTERNAL_ERROR,
		Message: GetMessage(INTERNAL_ERROR),
		Data:    gin.H{"error": err.Error()},
	})
}

// NotFound 资源不存在响应
func NotFound(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Code:    NOT_FOUND,
		Message: resource + "不存在",
		Data:    nil,
	})
}

// getHTTPStatusCode 根据响应码获取HTTP状态码
func getHTTPStatusCode(code string) int {
	switch code {
	case SUCCESS:
		return http.StatusOK
	case VALIDATION_ERROR, BAD_REQUEST:
		return http.StatusBadRequest
	case UNAUTHORIZED:
		return http.StatusUnauthorized
	case FORBIDDEN:
		return http.StatusForbidden
	case NOT_FOUND, ASSET_NOT_FOUND, CATEGORY_NOT_FOUND, DEPARTMENT_NOT_FOUND, BORROW_NOT_FOUND, INVENTORY_TASK_NOT_FOUND:
		return http.StatusNotFound
	case ASSET_NO_EXISTS, ASSET_IN_USE, CATEGORY_HAS_ASSETS, CATEGORY_HAS_CHILDREN, CATEGORY_CODE_EXISTS, DEPARTMENT_HAS_ASSETS, DEPARTMENT_CODE_EXISTS, ALREADY_RETURNED, ASSET_ALREADY_BORROWED, INVENTORY_TASK_COMPLETED:
		return http.StatusConflict
	case INTERNAL_ERROR:
		return http.StatusInternalServerError
	default:
		return http.StatusInternalServerError
	}
}