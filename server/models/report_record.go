package models

import (
	"asset-management-system/server/pkg/utils"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ReportRecordType 报表类型枚举
type ReportRecordType string

const (
	ReportRecordTypeAsset     ReportRecordType = "asset"     // 资产报表
	ReportRecordTypeBorrow    ReportRecordType = "borrow"    // 借用报表
	ReportRecordTypeInventory ReportRecordType = "inventory" // 盘点报表
	ReportRecordTypeCustom    ReportRecordType = "custom"    // 自定义报表
)

// ReportRecordFormat 文件格式枚举
type ReportRecordFormat string

const (
	ReportRecordFormatExcel ReportRecordFormat = "xlsx"
	ReportRecordFormatCSV   ReportRecordFormat = "csv"
	ReportRecordFormatPDF   ReportRecordFormat = "pdf"
)

// ReportRecord 报表记录模型
type ReportRecord struct {
	ID            uint               `json:"id" gorm:"primaryKey;autoIncrement"`
	ReportName    string             `json:"report_name" gorm:"size:200;not null" validate:"required,max=200"`
	ReportType    ReportRecordType   `json:"report_type" gorm:"size:50;not null" validate:"required,oneof=asset borrow inventory custom"`
	FilePath      string             `json:"file_path" gorm:"size:500"`
	FileSize      *int64             `json:"file_size"`
	FileFormat    ReportRecordFormat `json:"file_format" gorm:"size:10;default:xlsx" validate:"oneof=xlsx csv pdf"`
	GeneratedBy   string             `json:"generated_by" gorm:"size:100"`
	Parameters    string             `json:"parameters" gorm:"type:text"`
	DownloadCount int                `json:"download_count" gorm:"default:0"`
	ExpiresAt     *time.Time         `json:"expires_at"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
	DeletedAt     gorm.DeletedAt     `json:"-" gorm:"index"`
}

// TableName 指定表名
func (ReportRecord) TableName() string {
	return "report_records"
}

// BeforeCreate 创建前钩子
func (rr *ReportRecord) BeforeCreate(tx *gorm.DB) error {
	// 设置默认文件格式
	if rr.FileFormat == "" {
		rr.FileFormat = ReportRecordFormatExcel
	}

	// 设置默认过期时间（7天后过期）
	if rr.ExpiresAt == nil {
		expiresAt := time.Now().AddDate(0, 0, 7)
		rr.ExpiresAt = &expiresAt
	}

	return nil
}

// IsExpired 检查报表是否过期
func (rr *ReportRecord) IsExpired() bool {
	if rr.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*rr.ExpiresAt)
}

// GetDownloadURL 获取下载URL
func (rr *ReportRecord) GetDownloadURL(baseURL string) string {
	if rr.FilePath == "" {
		return ""
	}
	return utils.GetFileURL(baseURL, "/api/reports/download/"+rr.FilePath)
}

// GetFileSizeDisplay 获取文件大小显示
func (rr *ReportRecord) GetFileSizeDisplay() string {
	if rr.FileSize == nil {
		return "未知"
	}

	size := *rr.FileSize
	switch {
	case size < 1024:
		return "1 KB"
	case size < 1024*1024:
		return fmt.Sprintf("%.1f KB", float64(size)/1024)
	case size < 1024*1024*1024:
		return fmt.Sprintf("%.1f MB", float64(size)/(1024*1024))
	default:
		return fmt.Sprintf("%.1f GB", float64(size)/(1024*1024*1024))
	}
}
