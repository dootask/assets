package logs

import (
	"asset-management-system/server/models"
	"time"
)

// OperationLogFilters 操作日志筛选条件
type OperationLogFilters struct {
	Table     *string                `json:"table" form:"table"`         // 表名
	Operation *models.OperationType  `json:"operation" form:"operation"` // 操作类型
	Operator  *string                `json:"operator" form:"operator"`   // 操作者
	RecordID  *uint                  `json:"record_id" form:"record_id"` // 记录ID
	IPAddress *string                `json:"ip_address" form:"ip_address"` // IP地址
	StartDate *time.Time             `json:"start_date" form:"start_date"` // 开始日期
	EndDate   *time.Time             `json:"end_date" form:"end_date"`     // 结束日期
}

// OperationLogResponse 操作日志响应
type OperationLogResponse struct {
	models.OperationLog
	TableLabel     string `json:"table_label"`     // 表名标签
	OperationLabel string `json:"operation_label"` // 操作类型标签
}

// OperationLogStats 操作日志统计
type OperationLogStats struct {
	TotalLogs      int64                `json:"total_logs"`      // 总日志数
	TodayLogs      int64                `json:"today_logs"`      // 今日日志数
	OperationStats map[string]int64     `json:"operation_stats"` // 按操作类型统计
	TableStats     map[string]int64     `json:"table_stats"`     // 按表统计
	TopOperators   []OperatorStat       `json:"top_operators"`   // 活跃操作者
}

// OperatorStat 操作者统计
type OperatorStat struct {
	Operator string `json:"operator"` // 操作者
	Count    int64  `json:"count"`    // 操作次数
}