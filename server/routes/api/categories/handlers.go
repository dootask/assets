package categories

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"encoding/json"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

// GetCategories 获取分类树
func GetCategories(c *gin.Context) {
	// 解析筛选条件
	var filters CategoryFilters
	if err := c.ShouldBindQuery(&filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 构建查询
	query := global.DB.Model(&models.Category{})

	// 应用筛选条件
	if filters.Name != nil && *filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+*filters.Name+"%")
	}
	if filters.Code != nil && *filters.Code != "" {
		query = query.Where("code LIKE ?", "%"+*filters.Code+"%")
	}
	if filters.ParentID != nil {
		query = query.Where("parent_id = ?", *filters.ParentID)
	}

	// 获取所有分类
	var categories []models.Category
	if err := query.Order("parent_id ASC, name ASC").Find(&categories).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取每个分类的资产数量
	categoryAssetCounts := make(map[uint]int)
	for _, category := range categories {
		var count int64
		if err := global.DB.Model(&models.Asset{}).Where("category_id = ?", category.ID).Count(&count).Error; err != nil {
			utils.InternalError(c, err)
			return
		}
		categoryAssetCounts[category.ID] = int(count)
	}

	// 构建树形结构
	tree := buildCategoryTree(categories, categoryAssetCounts, nil)

	utils.Success(c, tree)
}

// GetCategory 获取分类详情
func GetCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的分类ID")
		return
	}

	var category models.Category
	if err := global.DB.
		Preload("Parent").
		Preload("Children").
		First(&category, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 获取资产数量
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).Where("category_id = ?", category.ID).Count(&assetCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := CategoryResponse{
		Category:   category,
		AssetCount: int(assetCount),
	}

	utils.Success(c, response)
}

// CreateCategory 创建分类
func CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 检查分类编码是否已存在
	var existingCategory models.Category
	if err := global.DB.Where("code = ?", req.Code).First(&existingCategory).Error; err == nil {
		utils.Error(c, utils.CATEGORY_CODE_EXISTS, nil)
		return
	} else if err != gorm.ErrRecordNotFound {
		utils.InternalError(c, err)
		return
	}

	// 验证父分类是否存在
	if req.ParentID != nil {
		var parentCategory models.Category
		if err := global.DB.First(&parentCategory, *req.ParentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
				return
			}
			utils.InternalError(c, err)
			return
		}
	}

	// 转换属性为JSON
	var attributesJSON []byte
	if req.Attributes != nil {
		var err error
		attributesJSON, err = json.Marshal(req.Attributes)
		if err != nil {
			utils.ValidationError(c, "属性格式错误")
			return
		}
	}

	// 创建分类
	category := models.Category{
		Name:        req.Name,
		Code:        req.Code,
		ParentID:    req.ParentID,
		Description: req.Description,
		Attributes:  attributesJSON,
	}

	if err := global.DB.Create(&category).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Parent").
		Preload("Children").
		First(&category, category.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := CategoryResponse{
		Category:   category,
		AssetCount: 0,
	}

	utils.Success(c, response)
}

// UpdateCategory 更新分类
func UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的分类ID")
		return
	}

	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 查找分类
	var category models.Category
	if err := global.DB.First(&category, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查分类编码是否已被其他分类使用
	if req.Code != nil && *req.Code != category.Code {
		var existingCategory models.Category
		if err := global.DB.Where("code = ? AND id != ?", *req.Code, id).First(&existingCategory).Error; err == nil {
			utils.Error(c, utils.CATEGORY_CODE_EXISTS, nil)
			return
		} else if err != gorm.ErrRecordNotFound {
			utils.InternalError(c, err)
			return
		}
	}

	// 验证父分类是否存在，并检查是否会形成循环引用
	if req.ParentID != nil {
		// 检查是否设置自己为父分类
		if *req.ParentID == uint(id) {
			utils.ValidationError(c, "不能将自己设置为父分类")
			return
		}

		// 检查是否会形成循环引用
		if err := checkCircularReference(uint(id), *req.ParentID); err != nil {
			utils.ValidationError(c, "不能形成循环引用")
			return
		}

		// 验证父分类是否存在
		var parentCategory models.Category
		if err := global.DB.First(&parentCategory, *req.ParentID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
				return
			}
			utils.InternalError(c, err)
			return
		}
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Code != nil {
		updates["code"] = *req.Code
	}
	if req.ParentID != nil {
		updates["parent_id"] = *req.ParentID
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Attributes != nil {
		attributesJSON, err := json.Marshal(req.Attributes)
		if err != nil {
			utils.ValidationError(c, "属性格式错误")
			return
		}
		updates["attributes"] = attributesJSON
	}

	// 执行更新
	if err := global.DB.Model(&category).Updates(updates).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 重新查询以获取关联数据
	if err := global.DB.
		Preload("Parent").
		Preload("Children").
		First(&category, category.ID).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取资产数量
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).Where("category_id = ?", category.ID).Count(&assetCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := CategoryResponse{
		Category:   category,
		AssetCount: int(assetCount),
	}

	utils.Success(c, response)
}

// DeleteCategory 删除分类
func DeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的分类ID")
		return
	}

	// 查找分类
	var category models.Category
	if err := global.DB.First(&category, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查是否有子分类
	var childCount int64
	if err := global.DB.Model(&models.Category{}).Where("parent_id = ?", id).Count(&childCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}
	if childCount > 0 {
		utils.Error(c, utils.CATEGORY_HAS_CHILDREN, nil)
		return
	}

	// 检查是否有关联资产
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).Where("category_id = ?", id).Count(&assetCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}
	if assetCount > 0 {
		utils.Error(c, utils.CATEGORY_HAS_ASSETS, nil)
		return
	}

	// 删除分类
	if err := global.DB.Delete(&category).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, gin.H{"message": "分类删除成功"})
}

// GetCategoryAssets 获取分类下的资产
func GetCategoryAssets(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的分类ID")
		return
	}

	// 验证分类是否存在
	var category models.Category
	if err := global.DB.First(&category, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.CATEGORY_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 解析分页参数
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
		req.PageSize = 12
	}
	if req.PageSize > 200 {
		req.PageSize = 200
	}

	// 设置默认排序
	req.SetDefaultSorts(map[string]bool{
		"created_at": true,
		"id":         true,
	})

	// 构建查询
	query := global.DB.Model(&models.Asset{}).
		Where("category_id = ?", id).
		Preload("Category").
		Preload("Department")

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

	// 返回分页响应
	response := utils.NewPaginationResponse(req.Page, req.PageSize, total, assets)
	utils.Success(c, response)
}

// buildCategoryTree 构建分类树
func buildCategoryTree(categories []models.Category, assetCounts map[uint]int, parentID *uint) []CategoryTreeResponse {
	var tree []CategoryTreeResponse

	for _, category := range categories {
		// 检查是否为当前父级的子分类
		if (parentID == nil && category.ParentID == nil) || (parentID != nil && category.ParentID != nil && *category.ParentID == *parentID) {
			// 解析属性JSON
			var attributes interface{}
			if len(category.Attributes) > 0 {
				json.Unmarshal(category.Attributes, &attributes)
			}

			node := CategoryTreeResponse{
				ID:          category.ID,
				Name:        category.Name,
				Code:        category.Code,
				ParentID:    category.ParentID,
				Description: category.Description,
				Attributes:  attributes,
				AssetCount:  assetCounts[category.ID],
				CreatedAt:   category.CreatedAt,
				UpdatedAt:   category.UpdatedAt,
			}

			// 递归构建子分类
			node.Children = buildCategoryTree(categories, assetCounts, &category.ID)

			tree = append(tree, node)
		}
	}

	return tree
}

// checkCircularReference 检查循环引用
func checkCircularReference(categoryID, parentID uint) error {
	// 如果父ID就是当前分类ID，直接返回错误
	if categoryID == parentID {
		return gorm.ErrInvalidData
	}

	// 递归检查父分类的父分类
	var parent models.Category
	if err := global.DB.First(&parent, parentID).Error; err != nil {
		return err
	}

	if parent.ParentID != nil {
		if *parent.ParentID == categoryID {
			return gorm.ErrInvalidData
		}
		return checkCircularReference(categoryID, *parent.ParentID)
	}

	return nil
}
