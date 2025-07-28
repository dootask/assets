package assets

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

// GetAssets 获取资产列表
func GetAssets(c *gin.Context) {
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
	var filters AssetFilters
	if err := req.ParseFiltersFromQuery(c, &filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认排序
	req.SetDefaultSort("created_at", true)

	// 验证排序字段
	allowedSortFields := []string{"id", "asset_no", "name", "category_id", "department_id", "status", "brand", "model", "purchase_date", "purchase_price", "created_at", "updated_at"}
	for _, sort := range req.Sorts {
		if !utils.ValidateSortField(sort.Key, allowedSortFields) {
			utils.ValidationError(c, fmt.Sprintf("不支持的排序字段: %s", sort.Key))
			return
		}
	}

	// 构建查询
	query := global.DB.Model(&models.Asset{}).
		Preload("Category").
		Preload("Department")

	// 应用筛选条件
	query = applyAssetFilters(query, filters)

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 应用分页和排序
	var assets []models.Asset
	if err := query.
		Order(req.GetOrderBy()).
		Offset(req.GetOffset()).
		Limit(req.PageSize).
		Find(&assets).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 转换为响应格式
	assetResponses := make([]AssetResponse, len(assets))
	for i, asset := range assets {
		assetResponses[i] = AssetResponse{
			Asset:           asset,
			WarrantyEndDate: asset.GetWarrantyEndDate(),
			IsUnderWarranty: asset.IsUnderWarranty(),
		}
	}

	// 返回分页响应
	response := utils.NewPaginationResponse(req.Page, req.PageSize, total, assetResponses)
	utils.Success(c, response)
}

// GetAsset 获取资产详情
func GetAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的资产ID")
		return
	}

	var asset models.Asset
	if err := global.DB.
		Preload("Category").
		Preload("Department").
		Preload("BorrowRecords", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(10)
		}).
		First(&asset, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.ASSET_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	response := AssetResponse{
		Asset:           asset,
		WarrantyEndDate: asset.GetWarrantyEndDate(),
		IsUnderWarranty: asset.IsUnderWarranty(),
	}

	utils.Success(c, response)
}

// CreateAsset 创建资产
func CreateAsset(c *gin.Context) {
	var req CreateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 检查资产编号是否已存在
	var existingAsset models.Asset
	if err := global.DB.Where("asset_no = ?", req.AssetNo).First(&existingAsset).Error; err == nil {
		utils.Error(c, utils.ASSET_NO_EXISTS, nil)
		return
	} else if err != gorm.ErrRecordNotFound {
		utils.InternalError(c, err)
		return
	}

	// 验证分类是否存在
	var category models.Category
	if err := global.DB.First(&category, req.CategoryID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
			return
		}
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

	// 转换自定义属性为JSON
	var customAttributesJSON []byte
	if req.CustomAttributes != nil {
		var err error
		customAttributesJSON, err = json.Marshal(req.CustomAttributes)
		if err != nil {
			utils.ValidationError(c, "自定义属性格式错误")
			return
		}
	}

	// 创建资产
	asset := models.Asset{
		AssetNo:           req.AssetNo,
		Name:              req.Name,
		CategoryID:        req.CategoryID,
		DepartmentID:      req.DepartmentID,
		Brand:             req.Brand,
		Model:             req.Model,
		SerialNumber:      req.SerialNumber,
		PurchaseDate:      req.PurchaseDate,
		PurchasePrice:     req.PurchasePrice,
		Supplier:          req.Supplier,
		WarrantyPeriod:    req.WarrantyPeriod,
		Status:            req.Status,
		Location:          req.Location,
		ResponsiblePerson: req.ResponsiblePerson,
		Description:       req.Description,
		ImageURL:          req.ImageURL,
		CustomAttributes:  customAttributesJSON,
	}

	// 设置默认状态
	if asset.Status == "" {
		asset.Status = models.AssetStatusAvailable
	}

	if err := global.DB.Create(&asset).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Category").
		Preload("Department").
		First(&asset, asset.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := AssetResponse{
		Asset:           asset,
		WarrantyEndDate: asset.GetWarrantyEndDate(),
		IsUnderWarranty: asset.IsUnderWarranty(),
	}

	utils.Success(c, response)
}

// UpdateAsset 更新资产
func UpdateAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的资产ID")
		return
	}

	var req UpdateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 查找资产
	var asset models.Asset
	if err := global.DB.First(&asset, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.ASSET_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查资产编号是否已被其他资产使用
	if req.AssetNo != nil && *req.AssetNo != asset.AssetNo {
		var existingAsset models.Asset
		if err := global.DB.Where("asset_no = ? AND id != ?", *req.AssetNo, id).First(&existingAsset).Error; err == nil {
			utils.Error(c, utils.ASSET_NO_EXISTS, nil)
			return
		} else if err != gorm.ErrRecordNotFound {
			utils.InternalError(c, err)
			return
		}
	}

	// 验证分类是否存在
	if req.CategoryID != nil {
		var category models.Category
		if err := global.DB.First(&category, *req.CategoryID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
				return
			}
			utils.InternalError(c, err)
			return
		}
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
	if req.AssetNo != nil {
		updates["asset_no"] = *req.AssetNo
	}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.CategoryID != nil {
		updates["category_id"] = *req.CategoryID
	}
	if req.DepartmentID != nil {
		updates["department_id"] = *req.DepartmentID
	}
	if req.Brand != nil {
		updates["brand"] = *req.Brand
	}
	if req.Model != nil {
		updates["model"] = *req.Model
	}
	if req.SerialNumber != nil {
		updates["serial_number"] = *req.SerialNumber
	}
	if req.PurchaseDate != nil {
		updates["purchase_date"] = *req.PurchaseDate
	}
	if req.PurchasePrice != nil {
		updates["purchase_price"] = *req.PurchasePrice
	}
	if req.Supplier != nil {
		updates["supplier"] = *req.Supplier
	}
	if req.WarrantyPeriod != nil {
		updates["warranty_period"] = *req.WarrantyPeriod
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.ResponsiblePerson != nil {
		updates["responsible_person"] = *req.ResponsiblePerson
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.ImageURL != nil {
		updates["image_url"] = *req.ImageURL
	}
	if req.CustomAttributes != nil {
		customAttributesJSON, err := json.Marshal(req.CustomAttributes)
		if err != nil {
			utils.ValidationError(c, "自定义属性格式错误")
			return
		}
		updates["custom_attributes"] = customAttributesJSON
	}

	// 执行更新
	if err := global.DB.Model(&asset).Updates(updates).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Category").
		Preload("Department").
		First(&asset, asset.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := AssetResponse{
		Asset:           asset,
		WarrantyEndDate: asset.GetWarrantyEndDate(),
		IsUnderWarranty: asset.IsUnderWarranty(),
	}

	utils.Success(c, response)
}

// DeleteAsset 删除资产
func DeleteAsset(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的资产ID")
		return
	}

	// 查找资产
	var asset models.Asset
	if err := global.DB.First(&asset, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.ASSET_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查是否有未归还的借用记录
	var borrowCount int64
	if err := global.DB.Model(&models.BorrowRecord{}).
		Where("asset_id = ? AND status = ?", id, models.BorrowStatusBorrowed).
		Count(&borrowCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	if borrowCount > 0 {
		utils.Error(c, utils.ASSET_IN_USE, nil)
		return
	}

	// 删除资产
	if err := global.DB.Delete(&asset).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, gin.H{"message": "资产删除成功"})
}

// CheckAssetNo 检查资产编号是否存在
func CheckAssetNo(c *gin.Context) {
	assetNo := c.Param("assetNo")
	if assetNo == "" {
		utils.ValidationError(c, "资产编号不能为空")
		return
	}

	var count int64
	if err := global.DB.Model(&models.Asset{}).Where("asset_no = ?", assetNo).Count(&count).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := CheckAssetNoResponse{
		Exists: count > 0,
	}

	utils.Success(c, response)
}

// ImportAssets 批量导入资产
func ImportAssets(c *gin.Context) {
	var req ImportAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	response := ImportAssetResponse{
		Errors: make([]ImportAssetError, 0),
		Assets: make([]models.Asset, 0),
	}

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for i, assetReq := range req.Assets {
		// 验证单个资产数据
		if err := validate.Struct(&assetReq); err != nil {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   err.Error(),
			})
			continue
		}

		// 检查资产编号是否已存在
		var existingAsset models.Asset
		if err := tx.Where("asset_no = ?", assetReq.AssetNo).First(&existingAsset).Error; err == nil {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "资产编号已存在",
			})
			continue
		} else if err != gorm.ErrRecordNotFound {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "数据库查询错误",
			})
			continue
		}

		// 验证分类是否存在
		var category models.Category
		if err := tx.First(&category, assetReq.CategoryID).Error; err != nil {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "分类不存在",
			})
			continue
		}

		// 验证部门是否存在（如果提供了部门ID）
		if assetReq.DepartmentID != nil {
			var department models.Department
			if err := tx.First(&department, *assetReq.DepartmentID).Error; err != nil {
				response.FailedCount++
				response.Errors = append(response.Errors, ImportAssetError{
					Index:   i,
					AssetNo: assetReq.AssetNo,
					Error:   "部门不存在",
				})
				continue
			}
		}

		// 转换自定义属性为JSON
		var customAttributesJSON []byte
		if assetReq.CustomAttributes != nil {
			var err error
			customAttributesJSON, err = json.Marshal(assetReq.CustomAttributes)
			if err != nil {
				response.FailedCount++
				response.Errors = append(response.Errors, ImportAssetError{
					Index:   i,
					AssetNo: assetReq.AssetNo,
					Error:   "自定义属性格式错误",
				})
				continue
			}
		}

		// 创建资产
		asset := models.Asset{
			AssetNo:           assetReq.AssetNo,
			Name:              assetReq.Name,
			CategoryID:        assetReq.CategoryID,
			DepartmentID:      assetReq.DepartmentID,
			Brand:             assetReq.Brand,
			Model:             assetReq.Model,
			SerialNumber:      assetReq.SerialNumber,
			PurchaseDate:      assetReq.PurchaseDate,
			PurchasePrice:     assetReq.PurchasePrice,
			Supplier:          assetReq.Supplier,
			WarrantyPeriod:    assetReq.WarrantyPeriod,
			Status:            assetReq.Status,
			Location:          assetReq.Location,
			ResponsiblePerson: assetReq.ResponsiblePerson,
			Description:       assetReq.Description,
			ImageURL:          assetReq.ImageURL,
			CustomAttributes:  customAttributesJSON,
		}

		// 设置默认状态
		if asset.Status == "" {
			asset.Status = models.AssetStatusAvailable
		}

		if err := tx.Create(&asset).Error; err != nil {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "创建资产失败",
			})
			continue
		}

		response.SuccessCount++
		response.Assets = append(response.Assets, asset)
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, response)
}

// ExportAssets 导出资产
func ExportAssets(c *gin.Context) {
	// 解析筛选条件
	var filters AssetFilters
	var req utils.PaginationRequest
	if err := req.ParseFiltersFromQuery(c, &filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 构建查询
	query := global.DB.Model(&models.Asset{}).
		Preload("Category").
		Preload("Department")

	// 应用筛选条件
	query = applyAssetFilters(query, filters)

	// 获取所有资产
	var assets []models.Asset
	if err := query.Find(&assets).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 转换为响应格式
	assetResponses := make([]AssetResponse, len(assets))
	for i, asset := range assets {
		assetResponses[i] = AssetResponse{
			Asset:           asset,
			WarrantyEndDate: asset.GetWarrantyEndDate(),
			IsUnderWarranty: asset.IsUnderWarranty(),
		}
	}

	// 设置响应头
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", "attachment; filename=assets.json")

	utils.Success(c, assetResponses)
}

// BatchUpdateAssets 批量更新资产
func BatchUpdateAssets(c *gin.Context) {
	var req BatchUpdateAssetsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	if len(req.AssetIDs) == 0 {
		utils.ValidationError(c, "资产ID列表不能为空")
		return
	}

	if len(req.AssetIDs) > 100 {
		utils.ValidationError(c, "批量操作最多支持100个资产")
		return
	}

	response := BatchUpdateAssetsResponse{
		SuccessCount:  0,
		FailedCount:   0,
		Errors:        make([]BatchUpdateError, 0),
		UpdatedAssets: make([]models.Asset, 0),
	}

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 验证所有资产是否存在
	var existingAssets []models.Asset
	if err := tx.Where("id IN ?", req.AssetIDs).Find(&existingAssets).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, err)
		return
	}

	// 创建ID到资产的映射
	assetMap := make(map[uint]models.Asset)
	for _, asset := range existingAssets {
		assetMap[asset.ID] = asset
	}

	// 检查不存在的资产ID
	for _, id := range req.AssetIDs {
		if _, exists := assetMap[id]; !exists {
			response.FailedCount++
			response.Errors = append(response.Errors, BatchUpdateError{
				AssetID: id,
				Error:   "资产不存在",
			})
		}
	}

	// 构建更新数据
	updates := make(map[string]interface{})
	if req.Updates.Status != nil {
		updates["status"] = *req.Updates.Status
	}
	if req.Updates.DepartmentID != nil {
		// 验证部门是否存在
		var department models.Department
		if err := tx.First(&department, *req.Updates.DepartmentID).Error; err != nil {
			tx.Rollback()
			if err == gorm.ErrRecordNotFound {
				utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
			} else {
				utils.InternalError(c, err)
			}
			return
		}
		updates["department_id"] = *req.Updates.DepartmentID
	}
	if req.Updates.Location != nil {
		updates["location"] = *req.Updates.Location
	}
	if req.Updates.ResponsiblePerson != nil {
		updates["responsible_person"] = *req.Updates.ResponsiblePerson
	}

	// 批量更新存在的资产
	validAssetIDs := make([]uint, 0)
	for _, id := range req.AssetIDs {
		if _, exists := assetMap[id]; exists {
			validAssetIDs = append(validAssetIDs, id)
		}
	}

	if len(validAssetIDs) > 0 && len(updates) > 0 {
		if err := tx.Model(&models.Asset{}).Where("id IN ?", validAssetIDs).Updates(updates).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, err)
			return
		}

		// 获取更新后的资产
		var updatedAssets []models.Asset
		if err := tx.Preload("Category").Preload("Department").Where("id IN ?", validAssetIDs).Find(&updatedAssets).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, err)
			return
		}

		response.SuccessCount = len(updatedAssets)
		response.UpdatedAssets = updatedAssets
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, response)
}

// BatchDeleteAssets 批量删除资产
func BatchDeleteAssets(c *gin.Context) {
	var req BatchDeleteAssetsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	if len(req.AssetIDs) == 0 {
		utils.ValidationError(c, "资产ID列表不能为空")
		return
	}

	if len(req.AssetIDs) > 100 {
		utils.ValidationError(c, "批量操作最多支持100个资产")
		return
	}

	response := BatchDeleteAssetsResponse{
		SuccessCount:    0,
		FailedCount:     0,
		Errors:          make([]BatchDeleteError, 0),
		DeletedAssetIDs: make([]uint, 0),
	}

	// 开始事务
	tx := global.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, assetID := range req.AssetIDs {
		// 查找资产
		var asset models.Asset
		if err := tx.First(&asset, assetID).Error; err != nil {
			response.FailedCount++
			if err == gorm.ErrRecordNotFound {
				response.Errors = append(response.Errors, BatchDeleteError{
					AssetID: assetID,
					Error:   "资产不存在",
				})
			} else {
				response.Errors = append(response.Errors, BatchDeleteError{
					AssetID: assetID,
					Error:   "查询资产失败",
				})
			}
			continue
		}

		// 检查是否有未归还的借用记录
		var borrowCount int64
		if err := tx.Model(&models.BorrowRecord{}).
			Where("asset_id = ? AND status = ?", assetID, models.BorrowStatusBorrowed).
			Count(&borrowCount).Error; err != nil {
			response.FailedCount++
			response.Errors = append(response.Errors, BatchDeleteError{
				AssetID: assetID,
				Error:   "检查借用记录失败",
			})
			continue
		}

		if borrowCount > 0 {
			response.FailedCount++
			response.Errors = append(response.Errors, BatchDeleteError{
				AssetID: assetID,
				Error:   "资产正在使用中，无法删除",
			})
			continue
		}

		// 删除资产
		if err := tx.Delete(&asset).Error; err != nil {
			response.FailedCount++
			response.Errors = append(response.Errors, BatchDeleteError{
				AssetID: assetID,
				Error:   "删除资产失败",
			})
			continue
		}

		response.SuccessCount++
		response.DeletedAssetIDs = append(response.DeletedAssetIDs, assetID)
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, response)
}

// applyAssetFilters 应用资产筛选条件
func applyAssetFilters(query *gorm.DB, filters AssetFilters) *gorm.DB {
	if filters.Name != nil && *filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+*filters.Name+"%")
	}
	if filters.AssetNo != nil && *filters.AssetNo != "" {
		query = query.Where("asset_no LIKE ?", "%"+*filters.AssetNo+"%")
	}
	if filters.CategoryID != nil {
		query = query.Where("category_id = ?", *filters.CategoryID)
	}
	if filters.DepartmentID != nil {
		query = query.Where("department_id = ?", *filters.DepartmentID)
	}
	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}
	if filters.Brand != nil && *filters.Brand != "" {
		query = query.Where("brand LIKE ?", "%"+*filters.Brand+"%")
	}
	if filters.Model != nil && *filters.Model != "" {
		query = query.Where("model LIKE ?", "%"+*filters.Model+"%")
	}
	if filters.Location != nil && *filters.Location != "" {
		query = query.Where("location LIKE ?", "%"+*filters.Location+"%")
	}
	if filters.ResponsiblePerson != nil && *filters.ResponsiblePerson != "" {
		query = query.Where("responsible_person LIKE ?", "%"+*filters.ResponsiblePerson+"%")
	}
	if filters.PurchaseDateFrom != nil {
		query = query.Where("purchase_date >= ?", *filters.PurchaseDateFrom)
	}
	if filters.PurchaseDateTo != nil {
		query = query.Where("purchase_date <= ?", *filters.PurchaseDateTo)
	}
	if filters.PriceLow != nil {
		query = query.Where("purchase_price >= ?", *filters.PriceLow)
	}
	if filters.PriceHigh != nil {
		query = query.Where("purchase_price <= ?", *filters.PriceHigh)
	}

	return query
}
