package logs

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

// GetOperationLogs 获取操作日志列表
func GetOperationLogs(c *gin.Context) {
	var req utils.PaginationRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认分页参数
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 200 {
		req.PageSize = 200
	}

	// 解析筛选条件
	var filters OperationLogFilters
	if err := req.ParseFiltersFromQuery(c, &filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认排序
	req.SetDefaultSort("created_at", true)

	// 验证排序字段
	allowedSortFields := []string{"id", "table_name", "record_id", "operation", "operator", "ip_address", "created_at"}
	for _, sort := range req.Sorts {
		if !utils.ValidateSortField(sort.Key, allowedSortFields) {
			utils.ValidationError(c, fmt.Sprintf("不支持的排序字段: %s", sort.Key))
			return
		}
	}

	// 构建查询
	query := global.DB.Model(&models.OperationLog{})

	// 应用筛选条件
	query = applyOperationLogFilters(query, filters)

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 应用分页和排序
	var logs []models.OperationLog
	if err := query.
		Order(req.GetOrderBy()).
		Offset(req.GetOffset()).
		Limit(req.PageSize).
		Find(&logs).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 转换为响应格式
	logResponses := make([]OperationLogResponse, len(logs))
	for i, log := range logs {
		logResponses[i] = OperationLogResponse{
			OperationLog: log,
			TableLabel:   getTableLabel(log.Table),
			OperationLabel: getOperationLabel(log.Operation),
		}
	}

	// 返回分页响应
	response := utils.NewPaginationResponse(req.Page, req.PageSize, total, logResponses)
	utils.Success(c, response)
}

// GetOperationLog 获取操作日志详情
func GetOperationLog(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		utils.ValidationError(c, "日志ID不能为空")
		return
	}

	var log models.OperationLog
	if err := global.DB.First(&log, id).Error; err != nil {
		utils.Error(c, utils.NOT_FOUND, nil)
		return
	}

	response := OperationLogResponse{
		OperationLog:   log,
		TableLabel:     getTableLabel(log.Table),
		OperationLabel: getOperationLabel(log.Operation),
	}

	utils.Success(c, response)
}

// GetOperationLogStats 获取操作日志统计
func GetOperationLogStats(c *gin.Context) {
	var stats OperationLogStats

	// 总日志数
	if err := global.DB.Model(&models.OperationLog{}).Count(&stats.TotalLogs).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 今日日志数
	if err := global.DB.Model(&models.OperationLog{}).
		Where("DATE(created_at) = CURRENT_DATE").
		Count(&stats.TodayLogs).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 按操作类型统计
	var operationStats []struct {
		Operation string `json:"operation"`
		Count     int64  `json:"count"`
	}
	if err := global.DB.Model(&models.OperationLog{}).
		Select("operation, COUNT(*) as count").
		Group("operation").
		Find(&operationStats).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	stats.OperationStats = make(map[string]int64)
	for _, stat := range operationStats {
		stats.OperationStats[stat.Operation] = stat.Count
	}

	// 按表统计
	var tableStats []struct {
		Table string `json:"table_name"`
		Count int64  `json:"count"`
	}
	if err := global.DB.Model(&models.OperationLog{}).
		Select("table_name, COUNT(*) as count").
		Group("table_name").
		Find(&tableStats).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	stats.TableStats = make(map[string]int64)
	for _, stat := range tableStats {
		stats.TableStats[stat.Table] = stat.Count
	}

	// 活跃操作者
	var operatorStats []struct {
		Operator string `json:"operator"`
		Count    int64  `json:"count"`
	}
	if err := global.DB.Model(&models.OperationLog{}).
		Select("operator, COUNT(*) as count").
		Where("operator != ''").
		Group("operator").
		Order("count DESC").
		Limit(10).
		Find(&operatorStats).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	stats.TopOperators = make([]OperatorStat, len(operatorStats))
	for i, stat := range operatorStats {
		stats.TopOperators[i] = OperatorStat{
			Operator: stat.Operator,
			Count:    stat.Count,
		}
	}

	utils.Success(c, stats)
}

// applyOperationLogFilters 应用操作日志筛选条件
func applyOperationLogFilters(query *gorm.DB, filters OperationLogFilters) *gorm.DB {
	if filters.Table != nil && *filters.Table != "" {
		query = query.Where("table_name = ?", *filters.Table)
	}
	if filters.Operation != nil && *filters.Operation != "" {
		query = query.Where("operation = ?", *filters.Operation)
	}
	if filters.Operator != nil && *filters.Operator != "" {
		query = query.Where("operator LIKE ?", "%"+*filters.Operator+"%")
	}
	if filters.RecordID != nil {
		query = query.Where("record_id = ?", *filters.RecordID)
	}
	if filters.IPAddress != nil && *filters.IPAddress != "" {
		query = query.Where("ip_address LIKE ?", "%"+*filters.IPAddress+"%")
	}
	if filters.StartDate != nil {
		query = query.Where("created_at >= ?", *filters.StartDate)
	}
	if filters.EndDate != nil {
		query = query.Where("created_at <= ?", *filters.EndDate)
	}

	return query
}

// getTableLabel 获取表名标签
func getTableLabel(tableName string) string {
	labels := map[string]string{
		"assets":          "资产",
		"categories":      "分类",
		"departments":     "部门",
		"borrow_records":  "借用记录",
		"inventory_tasks": "盘点任务",
	}
	if label, ok := labels[tableName]; ok {
		return label
	}
	return tableName
}

// getOperationLabel 获取操作类型标签
func getOperationLabel(operation models.OperationType) string {
	labels := map[models.OperationType]string{
		models.OperationTypeCreate: "创建",
		models.OperationTypeUpdate: "更新",
		models.OperationTypeDelete: "删除",
	}
	if label, ok := labels[operation]; ok {
		return label
	}
	return string(operation)
}