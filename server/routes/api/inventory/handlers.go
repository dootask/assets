package inventory

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

// GetInventoryTasks 获取盘点任务列表
func GetInventoryTasks(c *gin.Context) {
	var query InventoryTaskListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认分页参数
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 10
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	// 构建查询
	db := global.DB.Model(&models.InventoryTask{})

	// 状态筛选
	if query.Status != "" {
		db = db.Where("status = ?", query.Status)
	}

	// 任务类型筛选
	if query.TaskType != "" {
		db = db.Where("task_type = ?", query.TaskType)
	}

	// 关键词搜索
	if query.Keyword != "" {
		db = db.Where("task_name LIKE ? OR notes LIKE ?", "%"+query.Keyword+"%", "%"+query.Keyword+"%")
	}

	// 获取总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		utils.InternalError(c, "获取盘点任务总数失败")
		return
	}

	// 分页查询
	var tasks []models.InventoryTask
	offset := (query.Page - 1) * query.PageSize
	if err := db.Preload("Records").
		Order("created_at DESC").
		Offset(offset).
		Limit(query.PageSize).
		Find(&tasks).Error; err != nil {
		utils.InternalError(c, "获取盘点任务列表失败")
		return
	}

	// 构建响应数据，包含统计信息
	var taskResponses []InventoryTaskResponse
	for _, task := range tasks {
		taskResponse := buildInventoryTaskResponse(&task)
		taskResponses = append(taskResponses, taskResponse)
	}

	utils.SuccessWithPagination(c, taskResponses, total, query.Page, query.PageSize)
}

// CreateInventoryTask 创建盘点任务
func CreateInventoryTask(c *gin.Context) {
	var req CreateInventoryTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 序列化范围过滤条件
	scopeFilterJSON, err := json.Marshal(req.ScopeFilter)
	if err != nil {
		utils.ValidationError(c, "范围过滤条件格式错误")
		return
	}

	// 创建盘点任务
	task := models.InventoryTask{
		TaskName:    req.TaskName,
		TaskType:    req.TaskType,
		ScopeFilter: scopeFilterJSON,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		CreatedBy:   req.CreatedBy,
		Notes:       req.Notes,
		Status:      models.InventoryTaskStatusPending,
	}

	if err := global.DB.Create(&task).Error; err != nil {
		utils.InternalError(c, "创建盘点任务失败")
		return
	}

	// 如果任务类型不是全盘，需要根据范围过滤条件生成盘点记录
	if err := generateInventoryRecords(&task); err != nil {
		utils.InternalError(c, "生成盘点记录失败")
		return
	}

	// 重新加载任务数据
	if err := global.DB.Preload("Records").First(&task, task.ID).Error; err != nil {
		utils.InternalError(c, "获取盘点任务详情失败")
		return
	}

	taskResponse := buildInventoryTaskResponse(&task)
	utils.Success(c, taskResponse)
}

// GetInventoryTask 获取盘点任务详情
func GetInventoryTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的任务ID")
		return
	}

	var task models.InventoryTask
	if err := global.DB.Preload("Records").
		Preload("Records.Asset").
		Preload("Records.Asset.Category").
		Preload("Records.Asset.Department").
		First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "盘点任务不存在")
			return
		}
		utils.InternalError(c, "获取盘点任务详情失败")
		return
	}

	taskResponse := buildInventoryTaskResponse(&task)
	utils.Success(c, taskResponse)
}

// UpdateInventoryTask 更新盘点任务
func UpdateInventoryTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的任务ID")
		return
	}

	var req UpdateInventoryTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 查找任务
	var task models.InventoryTask
	if err := global.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "盘点任务不存在")
			return
		}
		utils.InternalError(c, "获取盘点任务失败")
		return
	}

	// 更新任务信息
	updates := make(map[string]interface{})
	if req.TaskName != "" {
		updates["task_name"] = req.TaskName
	}
	if req.Status != "" {
		updates["status"] = req.Status
		// 如果状态更新为进行中，设置开始时间
		if req.Status == models.InventoryTaskStatusInProgress && task.StartDate == nil {
			now := time.Now()
			updates["start_date"] = &now
		}
		// 如果状态更新为已完成，设置结束时间
		if req.Status == models.InventoryTaskStatusCompleted {
			now := time.Now()
			updates["end_date"] = &now
		}
	}
	if req.StartDate != nil {
		updates["start_date"] = req.StartDate
	}
	if req.EndDate != nil {
		updates["end_date"] = req.EndDate
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}

	if err := global.DB.Model(&task).Updates(updates).Error; err != nil {
		utils.InternalError(c, "更新盘点任务失败")
		return
	}

	// 重新加载任务数据
	if err := global.DB.Preload("Records").First(&task, task.ID).Error; err != nil {
		utils.InternalError(c, "获取盘点任务详情失败")
		return
	}

	taskResponse := buildInventoryTaskResponse(&task)
	utils.Success(c, taskResponse)
}

// DeleteInventoryTask 删除盘点任务
func DeleteInventoryTask(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的任务ID")
		return
	}

	// 查找任务
	var task models.InventoryTask
	if err := global.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "盘点任务不存在")
			return
		}
		utils.InternalError(c, "获取盘点任务失败")
		return
	}

	// 检查任务状态，只有待开始的任务才能删除
	if task.Status != models.InventoryTaskStatusPending {
		utils.ValidationError(c, "只有待开始的盘点任务才能删除")
		return
	}

	// 开始事务
	tx := global.DB.Begin()

	// 删除相关的盘点记录
	if err := tx.Where("task_id = ?", id).Delete(&models.InventoryRecord{}).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "删除盘点记录失败")
		return
	}

	// 删除盘点任务
	if err := tx.Delete(&task).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "删除盘点任务失败")
		return
	}

	tx.Commit()
	utils.Success(c, gin.H{"message": "盘点任务删除成功"})
}

// GetInventoryRecords 获取盘点记录列表
func GetInventoryRecords(c *gin.Context) {
	var query InventoryRecordListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认分页参数
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 20
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	// 构建查询
	db := global.DB.Model(&models.InventoryRecord{}).
		Preload("Asset").
		Preload("Asset.Category").
		Preload("Asset.Department").
		Preload("Task")

	// 任务ID筛选
	if query.TaskID > 0 {
		db = db.Where("task_id = ?", query.TaskID)
	}

	// 盘点结果筛选
	if query.Result != "" {
		db = db.Where("result = ?", query.Result)
	}

	// 关键词搜索
	if query.Keyword != "" {
		db = db.Joins("LEFT JOIN assets ON inventory_records.asset_id = assets.id").
			Where("assets.asset_no LIKE ? OR assets.name LIKE ? OR inventory_records.notes LIKE ?",
				"%"+query.Keyword+"%", "%"+query.Keyword+"%", "%"+query.Keyword+"%")
	}

	// 获取总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		utils.InternalError(c, "获取盘点记录总数失败")
		return
	}

	// 分页查询
	var records []models.InventoryRecord
	offset := (query.Page - 1) * query.PageSize
	if err := db.Order("created_at DESC").
		Offset(offset).
		Limit(query.PageSize).
		Find(&records).Error; err != nil {
		utils.InternalError(c, "获取盘点记录列表失败")
		return
	}

	utils.SuccessWithPagination(c, records, total, query.Page, query.PageSize)
}

// CreateInventoryRecord 创建盘点记录
func CreateInventoryRecord(c *gin.Context) {
	var req CreateInventoryRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证任务是否存在且状态正确
	var task models.InventoryTask
	if err := global.DB.First(&task, req.TaskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "盘点任务不存在")
			return
		}
		utils.InternalError(c, "获取盘点任务失败")
		return
	}

	if task.Status != models.InventoryTaskStatusInProgress {
		utils.ValidationError(c, "只有进行中的盘点任务才能添加记录")
		return
	}

	// 验证资产是否存在
	var asset models.Asset
	if err := global.DB.First(&asset, req.AssetID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "资产不存在")
			return
		}
		utils.InternalError(c, "获取资产信息失败")
		return
	}

	// 检查是否已存在该资产的盘点记录
	var existingRecord models.InventoryRecord
	if err := global.DB.Where("task_id = ? AND asset_id = ?", req.TaskID, req.AssetID).First(&existingRecord).Error; err == nil {
		utils.ValidationError(c, "该资产已有盘点记录")
		return
	}

	// 创建盘点记录
	now := time.Now()
	record := models.InventoryRecord{
		TaskID:         req.TaskID,
		AssetID:        req.AssetID,
		ExpectedStatus: asset.Status,
		ActualStatus:   req.ActualStatus,
		Result:         req.Result,
		Notes:          req.Notes,
		CheckedAt:      &now,
		CheckedBy:      req.CheckedBy,
	}

	if err := global.DB.Create(&record).Error; err != nil {
		utils.InternalError(c, "创建盘点记录失败")
		return
	}

	// 重新加载记录数据
	if err := global.DB.Preload("Asset").
		Preload("Asset.Category").
		Preload("Asset.Department").
		Preload("Task").
		First(&record, record.ID).Error; err != nil {
		utils.InternalError(c, "获取盘点记录详情失败")
		return
	}

	utils.Success(c, record)
}

// BatchCreateInventoryRecords 批量创建盘点记录
func BatchCreateInventoryRecords(c *gin.Context) {
	var req BatchCreateInventoryRecordsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	if len(req.Records) == 0 {
		utils.ValidationError(c, "盘点记录不能为空")
		return
	}

	// 开始事务
	tx := global.DB.Begin()

	var createdRecords []models.InventoryRecord
	for _, recordReq := range req.Records {
		// 验证任务是否存在且状态正确
		var task models.InventoryTask
		if err := tx.First(&task, recordReq.TaskID).Error; err != nil {
			tx.Rollback()
			if err == gorm.ErrRecordNotFound {
				utils.NotFound(c, fmt.Sprintf("盘点任务 %d 不存在", recordReq.TaskID))
				return
			}
			utils.InternalError(c, "获取盘点任务失败")
			return
		}

		if task.Status != models.InventoryTaskStatusInProgress {
			tx.Rollback()
			utils.ValidationError(c, "只有进行中的盘点任务才能添加记录")
			return
		}

		// 验证资产是否存在
		var asset models.Asset
		if err := tx.First(&asset, recordReq.AssetID).Error; err != nil {
			tx.Rollback()
			if err == gorm.ErrRecordNotFound {
				utils.NotFound(c, fmt.Sprintf("资产 %d 不存在", recordReq.AssetID))
				return
			}
			utils.InternalError(c, "获取资产信息失败")
			return
		}

		// 检查是否已存在该资产的盘点记录
		var existingRecord models.InventoryRecord
		if err := tx.Where("task_id = ? AND asset_id = ?", recordReq.TaskID, recordReq.AssetID).First(&existingRecord).Error; err == nil {
			tx.Rollback()
			utils.ValidationError(c, fmt.Sprintf("资产 %s 已有盘点记录", asset.AssetNo))
			return
		}

		// 创建盘点记录
		now := time.Now()
		record := models.InventoryRecord{
			TaskID:         recordReq.TaskID,
			AssetID:        recordReq.AssetID,
			ExpectedStatus: asset.Status,
			ActualStatus:   recordReq.ActualStatus,
			Result:         recordReq.Result,
			Notes:          recordReq.Notes,
			CheckedAt:      &now,
			CheckedBy:      recordReq.CheckedBy,
		}

		if err := tx.Create(&record).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, "创建盘点记录失败")
			return
		}

		createdRecords = append(createdRecords, record)
	}

	tx.Commit()

	utils.Success(c, gin.H{
		"message": "批量创建盘点记录成功",
		"count":   len(createdRecords),
		"records": createdRecords,
	})
}

// GetInventoryReport 获取盘点报告
func GetInventoryReport(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的任务ID")
		return
	}

	// 获取盘点任务
	var task models.InventoryTask
	if err := global.DB.Preload("Records").
		Preload("Records.Asset").
		Preload("Records.Asset.Category").
		Preload("Records.Asset.Department").
		First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "盘点任务不存在")
			return
		}
		utils.InternalError(c, "获取盘点任务失败")
		return
	}

	// 构建报告数据
	report := InventoryReportResponse{
		Task:    &task,
		Summary: buildInventoryTaskResponse(&task),
		Records: task.Records,
	}

	// 生成分类统计
	categoryStats, err := generateCategoryStats(uint(id))
	if err != nil {
		utils.InternalError(c, "生成分类统计失败")
		return
	}
	report.CategoryStats = categoryStats

	// 生成部门统计
	departmentStats, err := generateDepartmentStats(uint(id))
	if err != nil {
		utils.InternalError(c, "生成部门统计失败")
		return
	}
	report.DepartmentStats = departmentStats

	utils.Success(c, report)
}

// buildInventoryTaskResponse 构建盘点任务响应数据
func buildInventoryTaskResponse(task *models.InventoryTask) InventoryTaskResponse {
	response := InventoryTaskResponse{
		InventoryTask: task,
	}

	// 统计盘点记录
	var totalAssets, checkedAssets, normalAssets, surplusAssets, deficitAssets, damagedAssets int64

	// 根据任务类型和范围过滤条件计算总资产数
	totalAssets = calculateTotalAssets(task)

	// 统计已盘点的资产
	for _, record := range task.Records {
		checkedAssets++
		switch record.Result {
		case models.InventoryResultNormal:
			normalAssets++
		case models.InventoryResultSurplus:
			surplusAssets++
		case models.InventoryResultDeficit:
			deficitAssets++
		case models.InventoryResultDamaged:
			damagedAssets++
		}
	}

	response.TotalAssets = totalAssets
	response.CheckedAssets = checkedAssets
	response.NormalAssets = normalAssets
	response.SurplusAssets = surplusAssets
	response.DeficitAssets = deficitAssets
	response.DamagedAssets = damagedAssets

	// 计算进度
	if totalAssets > 0 {
		response.Progress = float64(checkedAssets) / float64(totalAssets) * 100
	}

	return response
}

// calculateTotalAssets 计算盘点任务的总资产数
func calculateTotalAssets(task *models.InventoryTask) int64 {
	db := global.DB.Model(&models.Asset{})

	// 解析范围过滤条件
	var scopeFilter models.InventoryScopeFilter
	if len(task.ScopeFilter) > 0 {
		json.Unmarshal(task.ScopeFilter, &scopeFilter)
	}

	// 根据任务类型和范围过滤条件构建查询
	switch task.TaskType {
	case models.InventoryTaskTypeCategory:
		if len(scopeFilter.CategoryIDs) > 0 {
			db = db.Where("category_id IN ?", scopeFilter.CategoryIDs)
		}
	case models.InventoryTaskTypeDepartment:
		if len(scopeFilter.DepartmentIDs) > 0 {
			db = db.Where("department_id IN ?", scopeFilter.DepartmentIDs)
		}
	}

	// 状态过滤
	if len(scopeFilter.AssetStatuses) > 0 {
		db = db.Where("status IN ?", scopeFilter.AssetStatuses)
	}

	// 位置过滤
	if scopeFilter.LocationFilter != "" {
		db = db.Where("location LIKE ?", "%"+scopeFilter.LocationFilter+"%")
	}

	var count int64
	db.Count(&count)
	return count
}

// generateInventoryRecords 根据盘点任务生成初始盘点记录
func generateInventoryRecords(task *models.InventoryTask) error {
	// 解析范围过滤条件
	var scopeFilter models.InventoryScopeFilter
	if len(task.ScopeFilter) > 0 {
		if err := json.Unmarshal(task.ScopeFilter, &scopeFilter); err != nil {
			return err
		}
	}

	// 构建资产查询
	db := global.DB.Model(&models.Asset{})

	// 根据任务类型和范围过滤条件构建查询
	switch task.TaskType {
	case models.InventoryTaskTypeCategory:
		if len(scopeFilter.CategoryIDs) > 0 {
			db = db.Where("category_id IN ?", scopeFilter.CategoryIDs)
		}
	case models.InventoryTaskTypeDepartment:
		if len(scopeFilter.DepartmentIDs) > 0 {
			db = db.Where("department_id IN ?", scopeFilter.DepartmentIDs)
		}
	}

	// 状态过滤
	if len(scopeFilter.AssetStatuses) > 0 {
		db = db.Where("status IN ?", scopeFilter.AssetStatuses)
	}

	// 位置过滤
	if scopeFilter.LocationFilter != "" {
		db = db.Where("location LIKE ?", "%"+scopeFilter.LocationFilter+"%")
	}

	// 获取符合条件的资产
	var assets []models.Asset
	if err := db.Find(&assets).Error; err != nil {
		return err
	}

	// 为每个资产创建盘点记录
	var records []models.InventoryRecord
	for _, asset := range assets {
		record := models.InventoryRecord{
			TaskID:         task.ID,
			AssetID:        asset.ID,
			ExpectedStatus: asset.Status,
			Result:         models.InventoryResultNormal, // 默认为正常
		}
		records = append(records, record)
	}

	// 批量创建盘点记录
	if len(records) > 0 {
		if err := global.DB.CreateInBatches(records, 100).Error; err != nil {
			return err
		}
	}

	return nil
}

// generateCategoryStats 生成分类盘点统计
func generateCategoryStats(taskID uint) ([]CategoryInventoryStats, error) {
	var stats []CategoryInventoryStats

	query := `
		SELECT 
			c.id as category_id,
			c.name as category_name,
			COUNT(DISTINCT a.id) as total_assets,
			COUNT(DISTINCT ir.id) as checked_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'normal' THEN ir.id END) as normal_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'surplus' THEN ir.id END) as surplus_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'deficit' THEN ir.id END) as deficit_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'damaged' THEN ir.id END) as damaged_assets
		FROM categories c
		LEFT JOIN assets a ON c.id = a.category_id
		LEFT JOIN inventory_records ir ON a.id = ir.asset_id AND ir.task_id = ?
		WHERE a.id IS NOT NULL
		GROUP BY c.id, c.name
		ORDER BY c.name
	`

	if err := global.DB.Raw(query, taskID).Scan(&stats).Error; err != nil {
		return nil, err
	}

	return stats, nil
}

// generateDepartmentStats 生成部门盘点统计
func generateDepartmentStats(taskID uint) ([]DepartmentInventoryStats, error) {
	var stats []DepartmentInventoryStats

	query := `
		SELECT 
			d.id as department_id,
			d.name as department_name,
			COUNT(DISTINCT a.id) as total_assets,
			COUNT(DISTINCT ir.id) as checked_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'normal' THEN ir.id END) as normal_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'surplus' THEN ir.id END) as surplus_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'deficit' THEN ir.id END) as deficit_assets,
			COUNT(DISTINCT CASE WHEN ir.result = 'damaged' THEN ir.id END) as damaged_assets
		FROM departments d
		LEFT JOIN assets a ON d.id = a.department_id
		LEFT JOIN inventory_records ir ON a.id = ir.asset_id AND ir.task_id = ?
		WHERE a.id IS NOT NULL
		GROUP BY d.id, d.name
		ORDER BY d.name
	`

	if err := global.DB.Raw(query, taskID).Scan(&stats).Error; err != nil {
		return nil, err
	}

	return stats, nil
}