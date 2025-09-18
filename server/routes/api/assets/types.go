package assets

import (
	"asset-management-system/server/models"
	"encoding/json"
	"time"
)

// FlexibleTime 灵活的时间类型，支持多种日期格式
type FlexibleTime struct {
	time.Time
}

// UnmarshalJSON 自定义JSON反序列化，支持简单日期格式
func (ft *FlexibleTime) UnmarshalJSON(data []byte) error {
	// 移除引号
	if len(data) >= 2 && data[0] == '"' && data[len(data)-1] == '"' {
		data = data[1 : len(data)-1]
	}

	// 如果是空字符串，设置为nil
	if len(data) == 0 {
		ft.Time = time.Time{}
		return nil
	}

	// 尝试解析不同的日期格式
	dateStr := string(data)

	// 尝试解析简单日期格式 YYYY-MM-DD
	if t, err := time.Parse("2006-01-02", dateStr); err == nil {
		ft.Time = t
		return nil
	}

	// 尝试解析RFC3339格式
	if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
		ft.Time = t
		return nil
	}

	// 尝试解析其他常见格式
	formats := []string{
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02 15:04:05",
		"2006/01/02",
		"01/02/2006",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			ft.Time = t
			return nil
		}
	}

	return json.Unmarshal(data, &ft.Time)
}

// MarshalJSON 自定义JSON序列化
func (ft FlexibleTime) MarshalJSON() ([]byte, error) {
	if ft.Time.IsZero() {
		return []byte("null"), nil
	}
	return json.Marshal(ft.Time.Format("2006-01-02"))
}

// AssetFilters 资产筛选条件
type AssetFilters struct {
	Keyword           *string             `json:"keyword" form:"keyword"`                       // 通用搜索关键词（搜索名称和编号）
	Name              *string             `json:"name" form:"name"`                             // 资产名称（模糊搜索）
	AssetNo           *string             `json:"asset_no" form:"asset_no"`                     // 资产编号（模糊搜索）
	CategoryID        *uint               `json:"category_id" form:"category_id"`               // 分类ID
	DepartmentID      *uint               `json:"department_id" form:"department_id"`           // 部门ID
	Status            *models.AssetStatus `json:"status" form:"status"`                         // 资产状态
	Brand             *string             `json:"brand" form:"brand"`                           // 品牌（模糊搜索）
	Model             *string             `json:"model" form:"model"`                           // 型号（模糊搜索）
	Location          *string             `json:"location" form:"location"`                     // 位置（模糊搜索）
	ResponsiblePerson *string             `json:"responsible_person" form:"responsible_person"` // 责任人（模糊搜索）
	PurchaseDateFrom  *time.Time          `json:"purchase_date_from" form:"purchase_date_from"` // 采购日期开始
	PurchaseDateTo    *time.Time          `json:"purchase_date_to" form:"purchase_date_to"`     // 采购日期结束
	PriceLow          *float64            `json:"price_low" form:"price_low"`                   // 价格下限
	PriceHigh         *float64            `json:"price_high" form:"price_high"`                 // 价格上限
}

// CreateAssetRequest 创建资产请求
type CreateAssetRequest struct {
	AssetNo           string                 `json:"asset_no" validate:"required,max=100"`
	Name              string                 `json:"name" validate:"required,max=200"`
	CategoryID        uint                   `json:"category_id" validate:"required"`
	DepartmentID      *uint                  `json:"department_id"`
	Brand             string                 `json:"brand" validate:"max=100"`
	Model             string                 `json:"model" validate:"max=100"`
	SerialNumber      string                 `json:"serial_number" validate:"max=100"`
	PurchaseDate      *FlexibleTime          `json:"purchase_date"`
	PurchasePrice     *float64               `json:"purchase_price"`
	PurchasePerson    string                 `json:"purchase_person" validate:"max=100"`
	PurchaseQuantity  *int                   `json:"purchase_quantity"`
	Supplier          string                 `json:"supplier" validate:"max=200"`
	WarrantyPeriod    *int                   `json:"warranty_period"`
	Status            models.AssetStatus     `json:"status" validate:"oneof=available borrowed maintenance scrapped"`
	Location          string                 `json:"location" validate:"max=200"`
	ResponsiblePerson string                 `json:"responsible_person" validate:"max=100"`
	Description       string                 `json:"description"`
	ImageURL          string                 `json:"image_url" validate:"max=500"`
	CustomAttributes  map[string]interface{} `json:"custom_attributes"`
}

// UpdateAssetRequest 更新资产请求
type UpdateAssetRequest struct {
	AssetNo           *string                `json:"asset_no" validate:"omitempty,max=100"`
	Name              *string                `json:"name" validate:"omitempty,max=200"`
	CategoryID        *uint                  `json:"category_id"`
	DepartmentID      *uint                  `json:"department_id"`
	Brand             string                 `json:"brand" validate:"omitempty,max=100"`
	Model             string                 `json:"model" validate:"omitempty,max=100"`
	SerialNumber      string                 `json:"serial_number" validate:"omitempty,max=100"`
	PurchaseDate      *FlexibleTime          `json:"purchase_date"`
	PurchasePrice     *float64               `json:"purchase_price"`
	PurchasePerson    string                 `json:"purchase_person" validate:"omitempty,max=100"`
	PurchaseQuantity  *int                   `json:"purchase_quantity"`
	Supplier          string                 `json:"supplier" validate:"omitempty,max=200"`
	WarrantyPeriod    *int                   `json:"warranty_period"`
	Status            *models.AssetStatus    `json:"status" validate:"omitempty,oneof=available borrowed maintenance scrapped"`
	Location          string                 `json:"location" validate:"omitempty,max=200"`
	ResponsiblePerson string                 `json:"responsible_person" validate:"omitempty,max=100"`
	Description       string                 `json:"description"`
	ImageURL          string                 `json:"image_url" validate:"omitempty,max=500"`
	CustomAttributes  map[string]interface{} `json:"custom_attributes"`
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
	SuccessCount int                `json:"success_count"` // 成功导入数量
	FailedCount  int                `json:"failed_count"`  // 失败数量
	Errors       []ImportAssetError `json:"errors"`        // 错误详情
	Assets       []models.Asset     `json:"assets"`        // 成功导入的资产
}

// ImportAssetError 导入错误详情
type ImportAssetError struct {
	Index   int    `json:"index"`    // 数据索引
	AssetNo string `json:"asset_no"` // 资产编号
	Error   string `json:"error"`    // 错误信息
}

// CheckAssetNoResponse 检查资产编号响应
type CheckAssetNoResponse struct {
	Exists bool `json:"exists"` // 是否存在
}

// BatchUpdateAssetsRequest 批量更新资产请求
type BatchUpdateAssetsRequest struct {
	AssetIDs []uint                `json:"asset_ids" validate:"required,min=1,max=100"`
	Updates  BatchUpdateAssetsData `json:"updates" validate:"required"`
}

// BatchUpdateAssetsData 批量更新数据
type BatchUpdateAssetsData struct {
	Status            *models.AssetStatus `json:"status" validate:"omitempty,oneof=available borrowed maintenance scrapped"`
	DepartmentID      *uint               `json:"department_id"`
	Location          *string             `json:"location" validate:"omitempty,max=200"`
	ResponsiblePerson *string             `json:"responsible_person" validate:"omitempty,max=100"`
}

// BatchUpdateAssetsResponse 批量更新资产响应
type BatchUpdateAssetsResponse struct {
	SuccessCount  int                `json:"success_count"`  // 成功更新数量
	FailedCount   int                `json:"failed_count"`   // 失败数量
	Errors        []BatchUpdateError `json:"errors"`         // 错误详情
	UpdatedAssets []models.Asset     `json:"updated_assets"` // 更新后的资产
}

// BatchUpdateError 批量更新错误详情
type BatchUpdateError struct {
	AssetID uint   `json:"asset_id"` // 资产ID
	Error   string `json:"error"`    // 错误信息
}

// BatchDeleteAssetsRequest 批量删除资产请求
type BatchDeleteAssetsRequest struct {
	AssetIDs []uint `json:"asset_ids" validate:"required,min=1,max=100"`
}

// BatchDeleteAssetsResponse 批量删除资产响应
type BatchDeleteAssetsResponse struct {
	SuccessCount    int                `json:"success_count"`     // 成功删除数量
	FailedCount     int                `json:"failed_count"`      // 失败数量
	Errors          []BatchDeleteError `json:"errors"`            // 错误详情
	DeletedAssetIDs []uint             `json:"deleted_asset_ids"` // 已删除的资产ID
}

// BatchDeleteError 批量删除错误详情
type BatchDeleteError struct {
	AssetID uint   `json:"asset_id"` // 资产ID
	Error   string `json:"error"`    // 错误信息
}
