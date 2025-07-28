package departments

import (
	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

// GetDepartments 获取部门列表
func GetDepartments(c *gin.Context) {
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
	var filters DepartmentFilters
	if err := req.ParseFiltersFromQuery(c, &filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 设置默认排序
	req.SetDefaultSort("created_at", true)

	// 验证排序字段
	allowedSortFields := []string{"id", "name", "code", "manager", "contact", "created_at", "updated_at"}
	for _, sort := range req.Sorts {
		if !utils.ValidateSortField(sort.Key, allowedSortFields) {
			utils.ValidationError(c, fmt.Sprintf("不支持的排序字段: %s", sort.Key))
			return
		}
	}

	// 构建查询
	query := global.DB.Model(&models.Department{})

	// 应用筛选条件
	query = applyDepartmentFilters(query, filters)

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取部门列表
	var departments []models.Department
	if err := query.
		Order(req.GetOrderBy()).
		Offset(req.GetOffset()).
		Limit(req.PageSize).
		Find(&departments).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取每个部门的资产数量
	departmentResponses := make([]DepartmentResponse, len(departments))
	for i, dept := range departments {
		var assetCount int64
		if err := global.DB.Model(&models.Asset{}).
			Where("department_id = ?", dept.ID).
			Count(&assetCount).Error; err != nil {
			utils.InternalError(c, err)
			return
		}

		departmentResponses[i] = DepartmentResponse{
			Department: dept,
			AssetCount: assetCount,
		}
	}

	// 返回分页响应
	response := utils.NewPaginationResponse(req.Page, req.PageSize, total, departmentResponses)
	utils.Success(c, response)
}

// GetDepartment 获取部门详情
func GetDepartment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的部门ID")
		return
	}

	var department models.Department
	if err := global.DB.First(&department, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 获取部门资产数量
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).
		Where("department_id = ?", department.ID).
		Count(&assetCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := DepartmentResponse{
		Department: department,
		AssetCount: assetCount,
	}

	utils.Success(c, response)
}

// CreateDepartment 创建部门
func CreateDepartment(c *gin.Context) {
	var req CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 检查部门编码是否已存在
	var existingDepartment models.Department
	if err := global.DB.Where("code = ?", req.Code).First(&existingDepartment).Error; err == nil {
		utils.ErrorWithMessage(c, utils.VALIDATION_ERROR, "部门编码已存在", nil)
		return
	} else if err != gorm.ErrRecordNotFound {
		utils.InternalError(c, err)
		return
	}

	// 创建部门
	department := models.Department{
		Name:        req.Name,
		Code:        req.Code,
		Manager:     req.Manager,
		Contact:     req.Contact,
		Description: req.Description,
	}

	if err := global.DB.Create(&department).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := DepartmentResponse{
		Department: department,
		AssetCount: 0,
	}

	utils.Success(c, response)
}

// UpdateDepartment 更新部门
func UpdateDepartment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的部门ID")
		return
	}

	var req UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证请求数据
	if err := validate.Struct(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 查找部门
	var department models.Department
	if err := global.DB.First(&department, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查部门编码是否已被其他部门使用
	if req.Code != nil && *req.Code != department.Code {
		var existingDepartment models.Department
		if err := global.DB.Where("code = ? AND id != ?", *req.Code, id).First(&existingDepartment).Error; err == nil {
			utils.ErrorWithMessage(c, utils.VALIDATION_ERROR, "部门编码已存在", nil)
			return
		} else if err != gorm.ErrRecordNotFound {
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
	if req.Manager != nil {
		updates["manager"] = *req.Manager
	}
	if req.Contact != nil {
		updates["contact"] = *req.Contact
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}

	// 执行更新
	if err := global.DB.Model(&department).Updates(updates).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 获取部门资产数量
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).
		Where("department_id = ?", department.ID).
		Count(&assetCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := DepartmentResponse{
		Department: department,
		AssetCount: assetCount,
	}

	utils.Success(c, response)
}

// DeleteDepartment 删除部门
func DeleteDepartment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的部门ID")
		return
	}

	// 查找部门
	var department models.Department
	if err := global.DB.First(&department, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 检查是否有关联资产
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).
		Where("department_id = ?", id).
		Count(&assetCount).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	if assetCount > 0 {
		utils.Error(c, utils.DEPARTMENT_HAS_ASSETS, nil)
		return
	}

	// 删除部门
	if err := global.DB.Delete(&department).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	utils.Success(c, gin.H{"message": "部门删除成功"})
}

// GetDepartmentStats 获取部门统计信息
func GetDepartmentStats(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.ValidationError(c, "无效的部门ID")
		return
	}

	// 验证部门是否存在
	var department models.Department
	if err := global.DB.First(&department, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Error(c, utils.DEPARTMENT_NOT_FOUND, nil)
			return
		}
		utils.InternalError(c, err)
		return
	}

	// 获取总资产数量
	var totalAssets int64
	if err := global.DB.Model(&models.Asset{}).
		Where("department_id = ?", id).
		Count(&totalAssets).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	// 按状态统计资产
	assetsByStatus := make(map[string]int64)
	statusStats := []struct {
		Status string
		Count  int64
	}{}
	if err := global.DB.Model(&models.Asset{}).
		Select("status, COUNT(*) as count").
		Where("department_id = ?", id).
		Group("status").
		Scan(&statusStats).Error; err != nil {
		utils.InternalError(c, err)
		return
	}
	for _, stat := range statusStats {
		assetsByStatus[stat.Status] = stat.Count
	}

	// 按分类统计资产
	assetsByCategory := make(map[string]int64)
	categoryStats := []struct {
		CategoryName string
		Count        int64
	}{}
	if err := global.DB.Table("assets").
		Select("categories.name as category_name, COUNT(*) as count").
		Joins("LEFT JOIN categories ON assets.category_id = categories.id").
		Where("assets.department_id = ?", id).
		Group("categories.name").
		Scan(&categoryStats).Error; err != nil {
		utils.InternalError(c, err)
		return
	}
	for _, stat := range categoryStats {
		assetsByCategory[stat.CategoryName] = stat.Count
	}

	// 获取最近的资产
	var recentAssets []models.Asset
	if err := global.DB.
		Preload("Category").
		Where("department_id = ?", id).
		Order("created_at DESC").
		Limit(5).
		Find(&recentAssets).Error; err != nil {
		utils.InternalError(c, err)
		return
	}

	response := DepartmentStatsResponse{
		TotalAssets:      totalAssets,
		AssetsByStatus:   assetsByStatus,
		AssetsByCategory: assetsByCategory,
		RecentAssets:     recentAssets,
	}

	utils.Success(c, response)
}

// applyDepartmentFilters 应用部门筛选条件
func applyDepartmentFilters(query *gorm.DB, filters DepartmentFilters) *gorm.DB {
	if filters.Name != nil && *filters.Name != "" {
		query = query.Where("name LIKE ?", "%"+*filters.Name+"%")
	}
	if filters.Code != nil && *filters.Code != "" {
		query = query.Where("code LIKE ?", "%"+*filters.Code+"%")
	}
	if filters.Manager != nil && *filters.Manager != "" {
		query = query.Where("manager LIKE ?", "%"+*filters.Manager+"%")
	}

	return query
}
