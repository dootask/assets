package aimodels

import (
	"dootask-ai/go-service/global"
	"dootask-ai/go-service/middleware"
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler AI模型管理处理器
type Handler struct{}

// RegisterRoutes 注册AI模型管理路由
func RegisterRoutes(r *gin.RouterGroup) {
	handler := &Handler{}

	// 创建管理员路由组
	admin := r.Group("/admin")
	admin.Use(middleware.AdminRoleMiddleware())

	// AI模型管理路由
	aimodels := admin.Group("/ai-models")
	{
		aimodels.GET("", handler.GetAIModels)          // 获取AI模型列表
		aimodels.GET("/:id", handler.GetAIModel)       // 获取单个AI模型
		aimodels.POST("", handler.CreateAIModel)       // 创建AI模型
		aimodels.PUT("/:id", handler.UpdateAIModel)    // 更新AI模型
		aimodels.DELETE("/:id", handler.DeleteAIModel) // 删除AI模型
	}
}

// GetAIModels 获取AI模型列表
func (h *Handler) GetAIModels(c *gin.Context) {
	// 解析查询参数
	page := 1
	size := 10

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if s := c.Query("size"); s != "" {
		if parsed, err := strconv.Atoi(s); err == nil && parsed > 0 && parsed <= 100 {
			size = parsed
		}
	}

	// 构建查询
	db := global.DB.Model(&AIModel{})

	// 可选的过滤参数
	if provider := c.Query("provider"); provider != "" {
		db = db.Where("provider = ?", provider)
	}
	if enabled := c.Query("enabled"); enabled != "" {
		if enabled == "true" {
			db = db.Where("is_enabled = true")
		} else if enabled == "false" {
			db = db.Where("is_enabled = false")
		}
	}

	// 获取总数
	var total int64
	if err := db.Count(&total).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "查询AI模型列表失败",
			Code:    "AI_MODEL_001",
		})
		return
	}

	// 获取数据
	var models []AIModel
	offset := (page - 1) * size
	if err := db.Offset(offset).Limit(size).Order("created_at DESC").Find(&models).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "查询AI模型列表失败",
			Code:    "AI_MODEL_001",
		})
		return
	}

	// 隐藏敏感信息
	for i := range models {
		if models[i].ApiKey != nil && *models[i].ApiKey != "" {
			masked := "***"
			models[i].ApiKey = &masked
		}
	}

	// 计算总页数
	totalPages := int(math.Ceil(float64(total) / float64(size)))

	c.JSON(http.StatusOK, AIModelListResponse{
		Success: true,
		Data: AIModelList{
			Models:     models,
			Total:      total,
			Page:       page,
			Size:       size,
			TotalPages: totalPages,
		},
	})
}

// GetAIModel 获取单个AI模型
func (h *Handler) GetAIModel(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   "AI模型ID不能为空",
			Code:    "FORMAT_001",
		})
		return
	}

	var model AIModel
	if err := global.DB.First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "AI模型不存在",
				Code:    "AI_MODEL_002",
			})
		} else {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "查询AI模型失败",
				Code:    "AI_MODEL_001",
			})
		}
		return
	}

	// 隐藏敏感信息
	if model.ApiKey != nil && *model.ApiKey != "" {
		masked := "***"
		model.ApiKey = &masked
	}

	c.JSON(http.StatusOK, AIModelResponse{
		Success: true,
		Data:    model,
	})
}

// CreateAIModel 创建AI模型
func (h *Handler) CreateAIModel(c *gin.Context) {
	var req CreateAIModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   "请求数据格式错误",
			Code:    "FORMAT_001",
		})
		return
	}

	// 验证请求数据
	if err := global.Validator.Struct(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "数据验证失败: " + err.Error(),
			Code:    "VALIDATION_001",
		})
		return
	}

	// 检查名称是否已存在
	var existingModel AIModel
	if err := global.DB.Where("name = ?", req.Name).First(&existingModel).Error; err == nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "AI模型名称已存在",
			Code:    "AI_MODEL_003",
		})
		return
	}

	// 如果设置为默认模型，需要将其他模型的默认状态取消
	if req.IsDefault {
		if err := global.DB.Model(&AIModel{}).Where("is_default = true").Update("is_default", false).Error; err != nil {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "更新默认模型状态失败",
				Code:    "AI_MODEL_004",
			})
			return
		}
	}

	// 创建模型
	model := AIModel{
		Name:        req.Name,
		Provider:    req.Provider,
		ModelName:   req.ModelName,
		ApiKey:      req.ApiKey,
		BaseURL:     req.BaseURL,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
		IsEnabled:   req.IsEnabled,
		IsDefault:   req.IsDefault,
	}

	if err := global.DB.Create(&model).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "创建AI模型失败",
			Code:    "AI_MODEL_004",
		})
		return
	}

	// 隐藏敏感信息
	if model.ApiKey != nil && *model.ApiKey != "" {
		masked := "***"
		model.ApiKey = &masked
	}

	c.JSON(http.StatusOK, AIModelResponse{
		Success: true,
		Data:    model,
	})
}

// UpdateAIModel 更新AI模型
func (h *Handler) UpdateAIModel(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   "AI模型ID不能为空",
			Code:    "FORMAT_001",
		})
		return
	}

	var req UpdateAIModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   "请求数据格式错误",
			Code:    "FORMAT_001",
		})
		return
	}

	// 验证请求数据
	if err := global.Validator.Struct(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "数据验证失败: " + err.Error(),
			Code:    "VALIDATION_001",
		})
		return
	}

	// 检查模型是否存在
	var model AIModel
	if err := global.DB.First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "AI模型不存在",
				Code:    "AI_MODEL_002",
			})
		} else {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "查询AI模型失败",
				Code:    "AI_MODEL_001",
			})
		}
		return
	}

	// 检查名称是否冲突（如果更新了名称）
	if req.Name != nil && *req.Name != model.Name {
		var existingModel AIModel
		if err := global.DB.Where("name = ? AND id != ?", *req.Name, id).First(&existingModel).Error; err == nil {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "AI模型名称已存在",
				Code:    "AI_MODEL_003",
			})
			return
		}
	}

	// 如果设置为默认模型，需要将其他模型的默认状态取消
	if req.IsDefault != nil && *req.IsDefault {
		if err := global.DB.Model(&AIModel{}).Where("is_default = true AND id != ?", id).Update("is_default", false).Error; err != nil {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "更新默认模型状态失败",
				Code:    "AI_MODEL_004",
			})
			return
		}
	}

	// 构建更新数据
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Provider != nil {
		updates["provider"] = *req.Provider
	}
	if req.ModelName != nil {
		updates["model_name"] = *req.ModelName
	}
	if req.ApiKey != nil {
		updates["api_key"] = *req.ApiKey
	}
	if req.BaseURL != nil {
		updates["base_url"] = *req.BaseURL
	}
	if req.MaxTokens != nil {
		updates["max_tokens"] = *req.MaxTokens
	}
	if req.Temperature != nil {
		updates["temperature"] = *req.Temperature
	}
	if req.IsEnabled != nil {
		updates["is_enabled"] = *req.IsEnabled
	}
	if req.IsDefault != nil {
		updates["is_default"] = *req.IsDefault
	}

	// 执行更新
	if err := global.DB.Model(&model).Updates(updates).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "更新AI模型失败",
			Code:    "AI_MODEL_004",
		})
		return
	}

	// 重新获取更新后的数据
	if err := global.DB.First(&model, id).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "查询更新后的AI模型失败",
			Code:    "AI_MODEL_001",
		})
		return
	}

	// 隐藏敏感信息
	if model.ApiKey != nil && *model.ApiKey != "" {
		masked := "***"
		model.ApiKey = &masked
	}

	c.JSON(http.StatusOK, AIModelResponse{
		Success: true,
		Data:    model,
	})
}

// DeleteAIModel 删除AI模型
func (h *Handler) DeleteAIModel(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success: false,
			Error:   "AI模型ID不能为空",
			Code:    "FORMAT_001",
		})
		return
	}

	// 检查模型是否存在
	var model AIModel
	if err := global.DB.First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "AI模型不存在",
				Code:    "AI_MODEL_002",
			})
		} else {
			c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
				Success: false,
				Error:   "查询AI模型失败",
				Code:    "AI_MODEL_001",
			})
		}
		return
	}

	// 检查是否有关联的智能体在使用
	var agentCount int64
	if err := global.DB.Table("agents").Where("ai_model_id = ?", id).Count(&agentCount).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "检查关联智能体失败",
			Code:    "AI_MODEL_005",
		})
		return
	}

	if agentCount > 0 {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "该AI模型正在被智能体使用，无法删除",
			Code:    "AI_MODEL_006",
		})
		return
	}

	// 执行删除
	if err := global.DB.Delete(&model).Error; err != nil {
		c.JSON(http.StatusUnprocessableEntity, ErrorResponse{
			Success: false,
			Error:   "删除AI模型失败",
			Code:    "AI_MODEL_005",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "AI模型删除成功",
		},
	})
}
