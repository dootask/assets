package assets

import (
	"asset-management-system/server/models"
	"time"
)

// AssetFilters 资产筛选条件
type AssetFilters struct {
	Name             *string             `json:"name" form:"name"`                         // 资产名称（模糊搜索）
	AssetNo          *string             `json:"asset_no" form:"asset_no"`                 // 资产编号（模糊搜索）
	CategoryID       *uint               `json:"category_id" form:"category_id"`           // 分类ID
	DepartmentID     *uint               `json:"department_id" form:"department_id"`       // 部门ID
	Status           *models.AssetStatus `json:"status" form:"status"`                     // 资产状态
	Brand            *string             `json:"brand" form:"brand"`                       // 品牌（模糊搜索）
	Model            *string             `json:"model" form:"model"`                       // 型号（模糊搜索）
	Location         *string             `json:"location" form:"location"`                 // 位置（模糊搜索）
	ResponsiblePerson *string            `json:"responsible_person" form:"responsible_person"` // 责任人（模糊搜索）
	PurchaseDateFrom *time.Time          `json:"purchase_date_from" form:"purchase_date_from"` // 采购日期开始
	PurchaseDateTo   *time.Time          `json:"purchase_date_to" form:"purchase_date_to"`     // 采购日期结束
	PriceLow         *float64            `json:"price_low" form:"price_low"`               // 价格下限
	PriceHigh        *float64            `json:"price_high" form:"price_high"`             // 价格上限
}

// CreateAssetRequest 创建资产请求
type CreateAssetRequest struct {
	AssetNo             string                 `json:"asset_no" validate:"required,max=100"`
	Name                string                 `json:"name" validate:"required,max=200"`
	CategoryID          uint                   `json:"category_id" validate:"required"`
	DepartmentID        *uint                  `json:"department_id"`
	Brand               string                 `json:"brand" validate:"max=100"`
	Model               string                 `json:"model" validate:"max=100"`
	SerialNumber        string                 `json:"serial_number" validate:"max=100"`
	PurchaseDate        *time.Time             `json:"purchase_date"`
	PurchasePrice       *float64               `json:"purchase_price"`
	Supplier            string                 `json:"supplier" validate:"max=200"`
	WarrantyPeriod      *int                   `json:"warranty_period"`
	Status              models.AssetStatus     `json:"status" validate:"oneof=available borrowed maintenance scrapped"`
	Location            string                 `json:"location" validate:"max=200"`
	ResponsiblePerson   string                 `json:"responsible_person" validate:"max=100"`
	Description         string                 `json:"description"`
	ImageURL            string                 `json:"image_url" validate:"max=500"`
	CustomAttributes    map[string]interface{} `json:"custom_attributes"`
}

// UpdateAssetRequest 更新资产请求
type UpdateAssetRequest struct {
	AssetNo             *string                `json:"asset_no" validate:"omitempty,max=100"`
	Name                *string                `json:"name" validate:"omitempty,max=200"`
	CategoryID          *uint                  `json:"category_id"`
	DepartmentID        *uint                  `json:"department_id"`
	Brand               *string                `json:"brand" validate:"omitempty,max=100"`
	Model               *string                `json:"model" validate:"omitempty,max=100"`
	SerialNumber        *string                `json:"serial_number" validate:"omitempty,max=100"`
	PurchaseDate        *time.Time             `json:"purchase_date"`
	PurchasePrice       *float64               `json:"purchase_price"`
	Supplier            *string                `json:"supplier" validate:"omitempty,max=200"`
	WarrantyPeriod      *int                   `json:"warranty_period"`
	Status              *models.AssetStatus    `json:"status" validate:"omitempty,oneof=available borrowed maintenance scrapped"`
	Location            *string                `json:"location" validate:"omitempty,max=200"`
	ResponsiblePerson   *string                `json:"responsible_person" validate:"omitempty,max=100"`
	Description         *string                `json:"description"`
	ImageURL            *string                `json:"image_url" validate:"omitempty,max=500"`
	CustomAttributes    map[string]interface{} `json:"custom_attributes"`
}

// AssetResponse 资产响应
type AssetResponse struct {
	models.Asset
	WarrantyEndDate *time.Time `json:"warranty_end_date,omitempty"` // 保修结束日期
	IsUnderWarranty bool       `json:"is_under_warranty"`           // 是否在保修期内
}

// ImportAssetRequest 批量导入资产请求
type ImportAssetRequest struct {
	Assets []CreateAssetRequest `json:"assets" validate:"required,dive"`
}

// ImportAssetResponse 批量导入资产响应
type ImportAssetResponse struct {
	SuccessCount int                    `json:"success_count"` // 成功导入数量
	FailedCount  int                    `json:"failed_count"`  // 失败数量
	Errors       []ImportAssetError     `json:"errors"`        // 错误详情
	Assets       []models.Asset         `json:"assets"`        // 成功导入的资产
}

// ImportAssetError 导入错误详情
type ImportAssetError struct {
	Index   int    `json:"index"`   // 数据索引
	AssetNo string `json:"asset_no"` // 资产编号
	Error   string `json:"error"`   // 错误信息
}

// CheckAssetNoResponse 检查资产编号响应
type CheckAssetNoResponse struct {
	Exists bool `json:"exists"` // 是否存在
}