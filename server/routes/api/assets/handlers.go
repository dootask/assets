package assets

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/xuri/excelize/v2"
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
	req.SetDefaultSorts(map[string]bool{
		"created_at": true,
		"id":         true,
	})

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
	if req.DepartmentID != nil && *req.DepartmentID != 0 {
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

	// 转换采购日期
	var purchaseDate *time.Time
	if req.PurchaseDate != nil && !req.PurchaseDate.Time.IsZero() {
		purchaseDate = &req.PurchaseDate.Time
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
		PurchaseDate:      purchaseDate,
		PurchasePrice:     req.PurchasePrice,
		PurchasePerson:    req.PurchasePerson,
		PurchaseQuantity:  req.PurchaseQuantity,
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
	if req.DepartmentID != nil && *req.DepartmentID != 0 {
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
	if req.DepartmentID != nil && *req.DepartmentID != 0 {
		updates["department_id"] = *req.DepartmentID
	} else if req.DepartmentID != nil && *req.DepartmentID == 0 {
		updates["department_id"] = nil
	}
	updates["brand"] = req.Brand
	updates["model"] = req.Model
	updates["serial_number"] = req.SerialNumber
	if req.PurchaseDate != nil && !req.PurchaseDate.Time.IsZero() {
		updates["purchase_date"] = req.PurchaseDate.Time
	} else if req.PurchaseDate != nil && req.PurchaseDate.Time.IsZero() {
		updates["purchase_date"] = nil
	}
	if req.PurchasePrice != nil {
		updates["purchase_price"] = *req.PurchasePrice
	}
	updates["purchase_person"] = req.PurchasePerson
	if req.PurchaseQuantity != nil {
		updates["purchase_quantity"] = *req.PurchaseQuantity
	}
	updates["supplier"] = req.Supplier
	if req.WarrantyPeriod != nil {
		updates["warranty_period"] = *req.WarrantyPeriod
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	updates["location"] = req.Location
	updates["responsible_person"] = req.ResponsiblePerson
	updates["description"] = req.Description
	updates["image_url"] = req.ImageURL
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
		// 只验证必填字段
		if assetReq.AssetNo == "" {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "资产编号不能为空",
			})
			continue
		}
		if assetReq.Name == "" {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "资产名称不能为空",
			})
			continue
		}
		if assetReq.CategoryID == 0 {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "分类ID不能为空",
			})
			continue
		}

		// 验证状态值
		validStatuses := []models.AssetStatus{"available", "borrowed", "maintenance", "scrapped"}
		isValidStatus := false
		for _, status := range validStatuses {
			if assetReq.Status == status {
				isValidStatus = true
				break
			}
		}
		if !isValidStatus {
			response.FailedCount++
			response.Errors = append(response.Errors, ImportAssetError{
				Index:   i,
				AssetNo: assetReq.AssetNo,
				Error:   "状态必须是: available, borrowed, maintenance, scrapped",
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
		if assetReq.DepartmentID != nil && *assetReq.DepartmentID != 0 {
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

		// 转换采购日期
		var purchaseDate *time.Time
		if assetReq.PurchaseDate != nil && !assetReq.PurchaseDate.Time.IsZero() {
			purchaseDate = &assetReq.PurchaseDate.Time
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
			PurchaseDate:      purchaseDate,
			PurchasePrice:     assetReq.PurchasePrice,
			PurchasePerson:    assetReq.PurchasePerson,
			PurchaseQuantity:  assetReq.PurchaseQuantity,
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

// ExportAssets 导出资产 - 生成文件并返回下载URL
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

	// 如果没有资产数据，返回错误
	if len(assets) == 0 {
		utils.Error(c, utils.ASSET_NOT_FOUND, "没有找到资产数据")
		return
	}

	// 检查是否需要异步处理（数据量较大时）
	if len(assets) > 10000 {
		// 异步处理大文件导出
		go processLargeAssetExport(assets)
		response := gin.H{
			"message": "大数据量导出已提交处理，请稍后刷新页面查看下载链接",
			"async":   true,
		}
		utils.Success(c, response)
		return
	}

	// 创建Excel文件
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// 设置工作表名称
	sheetName := "资产清单"
	f.SetSheetName("Sheet1", sheetName)

	// 设置表头
	headers := []string{
		"资产编号", "资产名称", "分类", "部门", "品牌", "型号", "序列号",
		"采购日期", "采购价格", "采购人", "采购数量", "供应商", "保修期(月)", "状态", "位置",
		"责任人", "描述", "保修到期", "是否在保修期", "创建时间", "更新时间",
	}

	// 写入表头
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// 写入数据
	for i, asset := range assets {
		row := i + 2 // 从第2行开始写入数据

		// 获取分类和部门名称
		categoryName := ""
		if asset.Category.ID != 0 {
			categoryName = asset.Category.Name
		}

		departmentName := ""
		if asset.Department != nil && asset.Department.ID != 0 {
			departmentName = asset.Department.Name
		}

		// 格式化采购日期
		purchaseDateStr := ""
		if asset.PurchaseDate != nil {
			purchaseDateStr = asset.PurchaseDate.Format("2006-01-02")
		}

		// 格式化保修到期日期
		warrantyEndDateStr := ""
		if warrantyEndDate := asset.GetWarrantyEndDate(); warrantyEndDate != nil {
			warrantyEndDateStr = warrantyEndDate.Format("2006-01-02")
		}

		// 状态映射
		statusMap := map[string]string{
			"available":   "可用",
			"borrowed":    "借用中",
			"maintenance": "维护中",
			"scrapped":    "已报废",
		}
		statusText := statusMap[string(asset.Status)]
		if statusText == "" {
			statusText = string(asset.Status)
		}

		// 是否在保修期
		isUnderWarrantyText := "否"
		if asset.IsUnderWarranty() {
			isUnderWarrantyText = "是"
		}

		// 处理数值字段，确保正确显示
		purchasePriceValue := ""
		if asset.PurchasePrice != nil {
			purchasePriceValue = fmt.Sprintf("%.2f", *asset.PurchasePrice)
		}

		purchaseQuantityValue := ""
		if asset.PurchaseQuantity != nil {
			purchaseQuantityValue = fmt.Sprintf("%d", *asset.PurchaseQuantity)
		}

		warrantyPeriodValue := ""
		if asset.WarrantyPeriod != nil {
			warrantyPeriodValue = fmt.Sprintf("%d", *asset.WarrantyPeriod)
		}

		// 写入数据行
		data := []interface{}{
			asset.AssetNo,
			asset.Name,
			categoryName,
			departmentName,
			asset.Brand,
			asset.Model,
			asset.SerialNumber,
			purchaseDateStr,
			purchasePriceValue,
			asset.PurchasePerson,
			purchaseQuantityValue,
			asset.Supplier,
			warrantyPeriodValue,
			statusText,
			asset.Location,
			asset.ResponsiblePerson,
			asset.Description,
			warrantyEndDateStr,
			isUnderWarrantyText,
			asset.CreatedAt.Format("2006-01-02 15:04:05"),
			asset.UpdatedAt.Format("2006-01-02 15:04:05"),
		}

		for j, value := range data {
			cell := fmt.Sprintf("%c%d", 'A'+j, row)

			// 为数值字段设置格式
			switch j {
			case 8: // 采购价格列（第9列，索引为8）
				if purchasePriceValue != "" {
					// 设置为数字格式，保留2位小数
					f.SetCellValue(sheetName, cell, purchasePriceValue)
					style, _ := f.NewStyle(&excelize.Style{NumFmt: 2}) // 数字格式，保留2位小数
					f.SetCellStyle(sheetName, cell, cell, style)
				} else {
					f.SetCellValue(sheetName, cell, value)
				}
			case 10: // 采购数量列（第11列，索引为10）
				if purchaseQuantityValue != "" {
					// 设置为整数格式
					f.SetCellValue(sheetName, cell, purchaseQuantityValue)
					style, _ := f.NewStyle(&excelize.Style{NumFmt: 1}) // 整数格式
					f.SetCellStyle(sheetName, cell, cell, style)
				} else {
					f.SetCellValue(sheetName, cell, value)
				}
			case 12: // 保修期列（第13列，索引为12）
				if warrantyPeriodValue != "" {
					// 设置为整数格式
					f.SetCellValue(sheetName, cell, warrantyPeriodValue)
					style, _ := f.NewStyle(&excelize.Style{NumFmt: 1}) // 整数格式
					f.SetCellStyle(sheetName, cell, cell, style)
				} else {
					f.SetCellValue(sheetName, cell, value)
				}
			default:
				f.SetCellValue(sheetName, cell, value)
			}
		}
	}

	// 设置列宽
	columnWidths := []float64{15, 20, 15, 15, 12, 15, 15, 12, 12, 12, 12, 15, 10, 10, 15, 12, 30, 12, 10, 20, 20}
	for i, width := range columnWidths {
		col := fmt.Sprintf("%c:%c", 'A'+i, 'A'+i)
		f.SetColWidth(sheetName, col, col, width)
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("asset_export_%s_%s.xlsx", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		utils.InternalError(c, fmt.Errorf("保存导出文件失败: %v", err))
		return
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     "资产清单.xlsx",
		"message":      "资产导出文件已生成",
	}

	utils.Success(c, response)
}

// GenerateTemplate 生成资产导入模板
func GenerateTemplate(c *gin.Context) {
	// 创建Excel文件
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// 设置工作表名称
	sheetName := "资产导入模板"
	index, _ := f.NewSheet(sheetName)
	f.SetActiveSheet(index)

	// 模板数据
	templateData := [][]interface{}{
		{
			"资产编号*",
			"资产名称*",
			"分类ID*",
			"部门ID",
			"品牌",
			"型号",
			"序列号",
			"采购日期",
			"采购价格",
			"采购人",
			"采购数量",
			"供应商",
			"保修期(月)",
			"状态",
			"位置",
			"责任人",
			"描述",
		},
		{
			"ASSET001",
			"联想笔记本电脑",
			"1",
			"2",
			"联想",
			"ThinkPad X1",
			"SN123456",
			"2024-01-15",
			"15000.00",
			"张三",
			"1",
			"联想科技有限公司",
			"24",
			"available",
			"办公楼A座201室",
			"张三",
			"办公用笔记本电脑",
		},
		{
			"ASSET002",
			"办公桌椅",
			"3",
			"",
			"办公家具公司",
			"办公桌椅套装",
			"",
			"2024-02-01",
			"2000.00",
			"李四",
			"5",
			"办公家具公司",
			"12",
			"available",
			"会议室B",
			"李四",
			"办公桌椅套装",
		},
	}

	// 写入数据到工作表
	for i, row := range templateData {
		for j, cellValue := range row {
			cell, _ := excelize.CoordinatesToCellName(j+1, i+1)
			f.SetCellValue(sheetName, cell, cellValue)
		}
	}

	// 设置列宽
	colWidths := []float64{15, 20, 10, 10, 12, 15, 15, 12, 12, 12, 12, 20, 12, 12, 15, 10, 30}
	for i, width := range colWidths {
		col := fmt.Sprintf("%c:%c", 'A'+i, 'A'+i)
		f.SetColWidth(sheetName, col, col, width)
	}

	// 创建说明工作表
	instructionsSheet := "导入说明"
	f.NewSheet(instructionsSheet)

	instructions := [][]interface{}{
		{"资产导入说明"},
		{""},
		{"1. 必填字段："},
		{"   - 资产编号：唯一标识，必须填写"},
		{"   - 资产名称：资产名称，必须填写"},
		{"   - 分类ID：资产分类ID，必须填写"},
		{""},
		{"2. 可选字段："},
		{"   - 部门ID：所属部门ID"},
		{"   - 品牌、型号、序列号：资产规格信息"},
		{"   - 采购日期：格式为 YYYY-MM-DD"},
		{"   - 采购价格：数字格式"},
		{"   - 采购人：采购人员姓名"},
		{"   - 采购数量：采购数量，数字格式"},
		{"   - 供应商：供应商名称"},
		{"   - 保修期：数字，单位为月"},
		{"   - 状态：available(可用)/borrowed(借用中)/maintenance(维护中)/scrapped(已报废)"},
		{"   - 位置：资产存放位置"},
		{"   - 责任人：责任人姓名"},
		{"   - 描述：资产描述信息"},
		{""},
		{"3. 注意事项："},
		{"   - 请确保资产编号的唯一性"},
		{"   - 分类ID和部门ID必须是系统中已存在的ID"},
		{"   - 日期格式请使用 YYYY-MM-DD"},
		{"   - 价格字段只填写数字，不需要货币符号"},
		{"   - 导入前请先备份数据"},
	}

	// 写入说明数据
	for i, row := range instructions {
		for j, cellValue := range row {
			cell, _ := excelize.CoordinatesToCellName(j+1, i+1)
			f.SetCellValue(instructionsSheet, cell, cellValue)
		}
	}

	// 设置说明工作表的列宽
	f.SetColWidth(instructionsSheet, "A:A", "A:A", 80)

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("asset_template_%s_%s.xlsx", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		utils.InternalError(c, fmt.Errorf("保存模板文件失败: %v", err))
		return
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     "资产导入模板.xlsx",
		"message":      "资产导入模板已生成",
	}

	utils.Success(c, response)
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
	if req.Updates.DepartmentID != nil && *req.Updates.DepartmentID != 0 {
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
	// 通用搜索关键词（同时搜索名称和编号）
	if filters.Keyword != nil && *filters.Keyword != "" {
		query = query.Where("(name LIKE ? OR asset_no LIKE ?)", "%"+*filters.Keyword+"%", "%"+*filters.Keyword+"%")
	}
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

// DownloadAssetFile 下载导出文件
func DownloadAssetFile(c *gin.Context) {
	filename := c.Param("filename")

	// 验证文件名安全性 - 防止路径遍历攻击
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		utils.ValidationError(c, "无效的文件名")
		return
	}

	// 构建文件路径
	filepath := fmt.Sprintf("./uploads/exports/%s", filename)

	// 检查文件是否存在
	if !utils.IsFileExists(filepath) {
		utils.Error(c, utils.ASSET_NOT_FOUND, "文件不存在或已过期")
		return
	}

	// 根据文件扩展名设置Content-Type
	var contentType string
	if strings.HasSuffix(filename, ".xlsx") {
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	} else if strings.HasSuffix(filename, ".csv") {
		contentType = "text/csv"
	} else {
		contentType = "application/octet-stream"
	}

	// 设置响应头，使用实际文件名
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Cache-Control", "no-cache")

	// 读取并返回文件内容
	c.File(filepath)
}

// processLargeAssetExport 处理大数据量资产导出（异步）
func processLargeAssetExport(assets []models.Asset) {
	// 创建Excel文件
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// 设置工作表名称
	sheetName := "资产清单"
	f.SetSheetName("Sheet1", sheetName)

	// 设置表头
	headers := []string{
		"资产编号", "资产名称", "分类", "部门", "品牌", "型号", "序列号",
		"采购日期", "采购价格", "采购人", "采购数量", "供应商", "保修期(月)", "状态", "位置",
		"责任人", "描述", "保修到期", "是否在保修期", "创建时间", "更新时间",
	}

	// 写入表头
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// 分批写入数据，避免内存溢出
	batchSize := 1000
	for batchStart := 0; batchStart < len(assets); batchStart += batchSize {
		batchEnd := batchStart + batchSize
		if batchEnd > len(assets) {
			batchEnd = len(assets)
		}

		batch := assets[batchStart:batchEnd]
		for i, asset := range batch {
			row := batchStart + i + 2 // 从第2行开始写入数据

			// 获取分类和部门名称
			categoryName := ""
			if asset.Category.ID != 0 {
				categoryName = asset.Category.Name
			}

			departmentName := ""
			if asset.Department != nil && asset.Department.ID != 0 {
				departmentName = asset.Department.Name
			}

			// 格式化采购日期
			purchaseDateStr := ""
			if asset.PurchaseDate != nil {
				purchaseDateStr = asset.PurchaseDate.Format("2006-01-02")
			}

			// 格式化保修到期日期
			warrantyEndDateStr := ""
			if warrantyEndDate := asset.GetWarrantyEndDate(); warrantyEndDate != nil {
				warrantyEndDateStr = warrantyEndDate.Format("2006-01-02")
			}

			// 状态映射
			statusMap := map[string]string{
				"available":   "可用",
				"borrowed":    "借用中",
				"maintenance": "维护中",
				"scrapped":    "已报废",
			}
			statusText := statusMap[string(asset.Status)]
			if statusText == "" {
				statusText = string(asset.Status)
			}

			// 是否在保修期
			isUnderWarrantyText := "否"
			if asset.IsUnderWarranty() {
				isUnderWarrantyText = "是"
			}

			// 处理数值字段，确保正确显示
			purchasePriceValue := ""
			if asset.PurchasePrice != nil {
				purchasePriceValue = fmt.Sprintf("%.2f", *asset.PurchasePrice)
			}

			purchaseQuantityValue := ""
			if asset.PurchaseQuantity != nil {
				purchaseQuantityValue = fmt.Sprintf("%d", *asset.PurchaseQuantity)
			}

			warrantyPeriodValue := ""
			if asset.WarrantyPeriod != nil {
				warrantyPeriodValue = fmt.Sprintf("%d", *asset.WarrantyPeriod)
			}

			// 写入数据行
			data := []interface{}{
				asset.AssetNo,
				asset.Name,
				categoryName,
				departmentName,
				asset.Brand,
				asset.Model,
				asset.SerialNumber,
				purchaseDateStr,
				purchasePriceValue,
				asset.PurchasePerson,
				purchaseQuantityValue,
				asset.Supplier,
				warrantyPeriodValue,
				statusText,
				asset.Location,
				asset.ResponsiblePerson,
				asset.Description,
				warrantyEndDateStr,
				isUnderWarrantyText,
				asset.CreatedAt.Format("2006-01-02 15:04:05"),
				asset.UpdatedAt.Format("2006-01-02 15:04:05"),
			}

			for j, value := range data {
				cell := fmt.Sprintf("%c%d", 'A'+j, row)

				// 为数值字段设置格式
				switch j {
				case 8: // 采购价格列（第9列，索引为8）
					if purchasePriceValue != "" {
						// 设置为数字格式，保留2位小数
						f.SetCellValue(sheetName, cell, purchasePriceValue)
						style, _ := f.NewStyle(&excelize.Style{NumFmt: 2}) // 数字格式，保留2位小数
						f.SetCellStyle(sheetName, cell, cell, style)
					} else {
						f.SetCellValue(sheetName, cell, value)
					}
				case 10: // 采购数量列（第11列，索引为10）
					if purchaseQuantityValue != "" {
						// 设置为整数格式
						f.SetCellValue(sheetName, cell, purchaseQuantityValue)
						style, _ := f.NewStyle(&excelize.Style{NumFmt: 1}) // 整数格式
						f.SetCellStyle(sheetName, cell, cell, style)
					} else {
						f.SetCellValue(sheetName, cell, value)
					}
				case 12: // 保修期列（第13列，索引为12）
					if warrantyPeriodValue != "" {
						// 设置为整数格式
						f.SetCellValue(sheetName, cell, warrantyPeriodValue)
						style, _ := f.NewStyle(&excelize.Style{NumFmt: 1}) // 整数格式
						f.SetCellStyle(sheetName, cell, cell, style)
					} else {
						f.SetCellValue(sheetName, cell, value)
					}
				default:
					f.SetCellValue(sheetName, cell, value)
				}
			}
		}
	}

	// 设置列宽
	columnWidths := []float64{15, 20, 15, 15, 12, 15, 15, 12, 12, 12, 12, 15, 10, 10, 15, 12, 30, 12, 10, 20, 20}
	for i, width := range columnWidths {
		col := fmt.Sprintf("%c:%c", 'A'+i, 'A'+i)
		f.SetColWidth(sheetName, col, col, width)
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("asset_export_large_%s_%s.xlsx", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		fmt.Printf("异步导出：创建导出目录失败: %v\n", err)
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		fmt.Printf("异步导出：保存文件失败: %v\n", err)
		return
	}

	fmt.Printf("✅ 大数据量资产导出完成: %s\n", filename)
}
