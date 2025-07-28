package borrow

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"fmt"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

// GetBorrowRecords 获取借用记录列表
func GetBorrowRecords(c *gin.Context) {
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
		req.PageSize = 10
	}
	if req.PageSize > 200 {
		req.PageSize = 200
	}

	// 解析筛选条件
	var filters BorrowFilters
	if err := req.ParseFiltersFromQuery(c, &filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认排序
	req.SetDefaultSorts(map[string]bool{
		"created_at": true,
		"id":         true,
	})

	// 验证排序字段
	allowedSortFields := []string{"id", "asset_id", "borrower_name", "department_id", "borrow_date", "expected_return_date", "actual_return_date", "status", "created_at", "updated_at"}
	for _, sort := range req.Sorts {
		if !utils.ValidateSortField(sort.Key, allowedSortFields) {
			utils.ValidationError(c, fmt.Sprintf("不支持的排序字段: %s", sort.Key))
			return
		}
	}

	// 构建查询
	query := global.DB.Model(&models.BorrowRecord{}).
		Preload("Asset").
		Preload("Asset.Category").
		Preload("Department")

	// 应用筛选条件
	query = applyBorrowFilters(query, filters)

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取借用记录列表
	var borrowRecords []models.BorrowRecord
	if err := query.
		Order(req.GetOrderBy()).
		Offset(req.GetOffset()).
		Limit(req.PageSize).
		Find(&borrowRecords).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 转换为响应格式
	borrowResponses := make([]BorrowResponse, len(borrowRecords))
	for i, record := range borrowRecords {
		borrowResponses[i] = BorrowResponse{
			BorrowRecord: record,
			IsOverdue:    record.IsOverdue(),
			OverdueDays:  record.GetOverdueDays(),
			CanReturn:    record.Status == models.BorrowStatusBorrowed,
		}
	}

	// 返回分页响应
	response := utils.NewPaginationResponse(req.Page, req.PageSize, total, borrowResponses)
	utils.Success(c, response)
}

// GetBorrowRecord 获取借用记录详情
func GetBorrowRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的借用记录ID")
		return
	}

	var borrowRecord models.BorrowRecord
	if err := global.DB.
		Preload("Asset").
		Preload("Asset.Category").
		Preload("Department").
		First(&borrowRecord, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.BORROW_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	response := BorrowResponse{
		BorrowRecord: borrowRecord,
		IsOverdue:    borrowRecord.IsOverdue(),
		OverdueDays:  borrowRecord.GetOverdueDays(),
		CanReturn:    borrowRecord.Status == models.BorrowStatusBorrowed,
	}

	utils.Success(c, response)
}

// CreateBorrowRecord 创建借用记录
func CreateBorrowRecord(c *gin.Context) {
	var req CreateBorrowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证资产是否存在且可借用
	var asset models.Asset
	if err := global.DB.First(&asset, req.AssetID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.ASSET_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查资产状态
	if asset.Status != models.AssetStatusAvailable {
		utils.Error(c, utils.ASSET_NOT_AVAILABLE, nil)
		return
	}

	// 检查是否已有未归还的借用记录
	var existingBorrow models.BorrowRecord
	if err := global.DB.Where("asset_id = ? AND status = ?", req.AssetID, models.BorrowStatusBorrowed).First(&existingBorrow).Error; err == nil {
		utils.Error(c, utils.ASSET_ALREADY_BORROWED, nil)
		return
	} else if err != gorm.ErrRecordNotFound {
		utils.InternalError(c, err)
		return
	}

	// 验证部门是否存在（如果提供了部门ID）
	if req.DepartmentID != nil {
		var department models.Department
		if err := global.DB.First(&department, *req.DepartmentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
				return
			}
			utils.InternalError(c, err)
			return
		}
	}

	// 创建借用记录
	borrowRecord := models.BorrowRecord{
		AssetID:            req.AssetID,
		BorrowerName:       req.BorrowerName,
		BorrowerContact:    req.BorrowerContact,
		DepartmentID:       req.DepartmentID,
		BorrowDate:         req.BorrowDate,
		ExpectedReturnDate: req.ExpectedReturnDate,
		Purpose:            req.Purpose,
		Notes:              req.Notes,
		Status:             models.BorrowStatusBorrowed,
	}

	if err := global.DB.Create(&borrowRecord).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Asset").
		Preload("Asset.Category").
		Preload("Department").
		First(&borrowRecord, borrowRecord.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := BorrowResponse{
		BorrowRecord: borrowRecord,
		IsOverdue:    borrowRecord.IsOverdue(),
		OverdueDays:  borrowRecord.GetOverdueDays(),
		CanReturn:    borrowRecord.Status == models.BorrowStatusBorrowed,
	}

	utils.Success(c, response)
}

// UpdateBorrowRecord 更新借用记录
func UpdateBorrowRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的借用记录ID")
		return
	}

	var req UpdateBorrowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 查找借用记录
	var borrowRecord models.BorrowRecord
	if err := global.DB.First(&borrowRecord, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.BORROW_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查是否已归还
	if borrowRecord.Status == models.BorrowStatusReturned {
		utils.Error(c, utils.ALREADY_RETURNED, nil)
		return
	}

	// 验证部门是否存在
	if req.DepartmentID != nil {
		var department models.Department
		if err := global.DB.First(&department, *req.DepartmentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
				return
			}
			utils.InternalError(c, err)
			return
		}
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.BorrowerName != nil {
		updates["borrower_name"] = *req.BorrowerName
	}
	if req.BorrowerContact != nil {
		updates["borrower_contact"] = *req.BorrowerContact
	}
	if req.DepartmentID != nil {
		updates["department_id"] = *req.DepartmentID
	}
	if req.BorrowDate != nil {
		updates["borrow_date"] = *req.BorrowDate
	}
	if req.ExpectedReturnDate != nil {
		updates["expected_return_date"] = *req.ExpectedReturnDate
	}
	if req.Purpose != nil {
		updates["purpose"] = *req.Purpose
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	// 执行更新
	if err := global.DB.Model(&borrowRecord).Updates(updates).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Asset").
		Preload("Asset.Category").
		Preload("Department").
		First(&borrowRecord, borrowRecord.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := BorrowResponse{
		BorrowRecord: borrowRecord,
		IsOverdue:    borrowRecord.IsOverdue(),
		OverdueDays:  borrowRecord.GetOverdueDays(),
		CanReturn:    borrowRecord.Status == models.BorrowStatusBorrowed,
	}

	utils.Success(c, response)
}

// ReturnAsset 归还资产
func ReturnAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的借用记录ID")
		return
	}

	var req ReturnAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 查找借用记录
	var borrowRecord models.BorrowRecord
	if err := global.DB.First(&borrowRecord, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.BORROW_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查是否已归还
	if borrowRecord.Status == models.BorrowStatusReturned {
		utils.Error(c, utils.ALREADY_RETURNED, nil)
		return
	}

	// 设置归还时间
	returnDate := time.Now()
	if req.ActualReturnDate != nil {
		returnDate = *req.ActualReturnDate
	}

	// 更新借用记录
	updates := map[string]interface{}{
		"actual_return_date": returnDate,
		"status":             models.BorrowStatusReturned,
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 更新借用记录
	if err := tx.Model(&borrowRecord).Updates(updates).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, err)
		return
	}

	// 更新资产状态
	if err := tx.Model(&models.Asset{}).Where("id = ?", borrowRecord.AssetID).Update("status", models.AssetStatusAvailable).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, err)
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Asset").
		Preload("Asset.Category").
		Preload("Department").
		First(&borrowRecord, borrowRecord.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := BorrowResponse{
		BorrowRecord: borrowRecord,
		IsOverdue:    borrowRecord.IsOverdue(),
		OverdueDays:  borrowRecord.GetOverdueDays(),
		CanReturn:    borrowRecord.Status == models.BorrowStatusBorrowed,
	}

	utils.Success(c, response)
}

// DeleteBorrowRecord 删除借用记录
func DeleteBorrowRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的借用记录ID")
		return
	}

	// 查找借用记录
	var borrowRecord models.BorrowRecord
	if err := global.DB.First(&borrowRecord, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.BORROW_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查是否可以删除（只有已归还的记录才能删除）
	if borrowRecord.Status == models.BorrowStatusBorrowed {
		utils.ErrorWithMessage(c, utils.VALIDATION_ERROR, "借用中的记录不能删除", nil)
		return
	}

	// 删除借用记录
	if err := global.DB.Delete(&borrowRecord).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, gin.H{"message": "借用记录删除成功"})
}

// GetAvailableAssets 获取可借用资产列表
func GetAvailableAssets(c *gin.Context) {
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

	// 设置默认排序
	req.SetDefaultSorts(map[string]bool{
		"name": false,
		"id":   true,
	})

	// 构建查询 - 只查询可用状态的资产
	query := global.DB.Model(&models.Asset{}).
		Where("status = ?", models.AssetStatusAvailable).
		Preload("Category").
		Preload("Department")

	// 应用搜索条件
	search := c.Query("search")
	if search != "" {
		query = query.Where("name LIKE ? OR asset_no LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取资产列表
	var assets []models.Asset
	if err := query.
		Order(req.GetOrderBy()).
		Offset(req.GetOffset()).
		Limit(req.PageSize).
		Find(&assets).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取每个资产的借用统计
	assetResponses := make([]AvailableAssetResponse, len(assets))
	for i, asset := range assets {
		var lastBorrowDate *time.Time
		var borrowCount int64

		// 获取最后借用时间
		var lastBorrow models.BorrowRecord
		if err := global.DB.Where("asset_id = ?", asset.ID).
			Order("borrow_date DESC").
			First(&lastBorrow).Error; err == nil {
			lastBorrowDate = &lastBorrow.BorrowDate
		}

		// 获取借用次数
		global.DB.Model(&models.BorrowRecord{}).
			Where("asset_id = ?", asset.ID).
			Count(&borrowCount)

		assetResponses[i] = AvailableAssetResponse{
			Asset:          asset,
			LastBorrowDate: lastBorrowDate,
			BorrowCount:    borrowCount,
		}
	}

	// 返回分页响应
	response := utils.NewPaginationResponse(req.Page, req.PageSize, total, assetResponses)
	utils.Success(c, response)
}

// GetBorrowStats 获取借用统计信息
func GetBorrowStats(c *gin.Context) {
	var stats BorrowStatsResponse

	// 总借用数
	global.DB.Model(&models.BorrowRecord{}).Count(&stats.TotalBorrows)

	// 活跃借用数
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ?", models.BorrowStatusBorrowed).
		Count(&stats.ActiveBorrows)

	// 已归还数
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ?", models.BorrowStatusReturned).
		Count(&stats.ReturnedBorrows)

	// 超期借用数
	global.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, time.Now()).
		Count(&stats.OverdueBorrows)

	// 按状态统计
	stats.BorrowsByStatus = make(map[string]int64)
	statusStats := []struct {
		Status string
		Count  int64
	}{}
	global.DB.Model(&models.BorrowRecord{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusStats)
	for _, stat := range statusStats {
		stats.BorrowsByStatus[stat.Status] = stat.Count
	}

	// 月度统计（最近12个月）
	monthlyStats := []MonthlyBorrowStats{}
	global.DB.Raw(`
		SELECT 
			strftime('%Y-%m', borrow_date) as month,
			COUNT(*) as count,
			SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returns
		FROM borrow_records 
		WHERE borrow_date >= date('now', '-12 months')
		GROUP BY strftime('%Y-%m', borrow_date)
		ORDER BY month
	`).Scan(&monthlyStats)
	stats.BorrowsByMonth = monthlyStats

	// 借用人排行（前10）
	borrowerStats := []BorrowerStats{}
	global.DB.Raw(`
		SELECT 
			borrower_name,
			COUNT(*) as count,
			SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) as active_count
		FROM borrow_records 
		GROUP BY borrower_name 
		ORDER BY count DESC 
		LIMIT 10
	`).Scan(&borrowerStats)
	stats.TopBorrowers = borrowerStats

	// 热门资产排行（前10）
	assetStats := []AssetBorrowStats{}
	global.DB.Raw(`
		SELECT 
			br.asset_id,
			a.name as asset_name,
			a.asset_no,
			COUNT(*) as count
		FROM borrow_records br
		JOIN assets a ON br.asset_id = a.id
		GROUP BY br.asset_id, a.name, a.asset_no
		ORDER BY count DESC 
		LIMIT 10
	`).Scan(&assetStats)
	stats.TopAssets = assetStats

	utils.Success(c, stats)
}

// UpdateOverdueStatus 更新超期状态（定时任务调用）
func UpdateOverdueStatus(c *gin.Context) {
	// 更新超期状态
	result := global.DB.Model(&models.BorrowRecord{}).
		Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, time.Now()).
		Update("status", models.BorrowStatusOverdue)

	if result.Error != nil {
		utils.InternalError(c, result.Error)
		return
	}

	utils.Success(c, gin.H{
		"message":       "超期状态更新成功",
		"updated_count": result.RowsAffected,
	})
}

// applyBorrowFilters 应用借用记录筛选条件
func applyBorrowFilters(query *gorm.DB, filters BorrowFilters) *gorm.DB {
	if filters.AssetID != nil {
		query = query.Where("asset_id = ?", *filters.AssetID)
	}
	if filters.BorrowerName != nil && *filters.BorrowerName != "" {
		query = query.Where("borrower_name LIKE ?", "%"+*filters.BorrowerName+"%")
	}
	if filters.DepartmentID != nil {
		query = query.Where("department_id = ?", *filters.DepartmentID)
	}
	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}
	if filters.BorrowDateFrom != nil {
		query = query.Where("borrow_date >= ?", *filters.BorrowDateFrom)
	}
	if filters.BorrowDateTo != nil {
		query = query.Where("borrow_date <= ?", *filters.BorrowDateTo)
	}
	if filters.ExpectedDateFrom != nil {
		query = query.Where("expected_return_date >= ?", *filters.ExpectedDateFrom)
	}
	if filters.ExpectedDateTo != nil {
		query = query.Where("expected_return_date <= ?", *filters.ExpectedDateTo)
	}
	if filters.OverdueOnly != nil && *filters.OverdueOnly {
		query = query.Where("status = ? AND expected_return_date < ?", models.BorrowStatusBorrowed, time.Now())
	}

	return query
}
