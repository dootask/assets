package backup

import (
	"time"
)

// CreateBackupRequest 创建备份请求
type CreateBackupRequest struct {
	// 无需参数，直接创建备份
}

// CreateBackupResponse 创建备份响应
type CreateBackupResponse struct {
	Filename  string    `json:"filename"`
	FilePath  string    `json:"file_path"`
	FileSize  int64     `json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
}

// BackupListResponse 备份列表响应
type BackupListResponse struct {
	Filename    string    `json:"filename"`
	DownloadURL string    `json:"download_url"`
	FileSize    int64     `json:"file_size"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BackupInfoResponse 备份信息响应
type BackupInfoResponse struct {
	Filename      string    `json:"filename"`
	FilePath      string    `json:"file_path"`
	FileSize      int64     `json:"file_size"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	FormattedSize string    `json:"formatted_size"` // 格式化的文件大小
}

// DeleteBackupResponse 删除备份响应
type DeleteBackupResponse struct {
	Message string `json:"message"`
}

// BackupFilters 备份筛选条件
type BackupFilters struct {
	Keyword  *string    `json:"keyword" form:"keyword"`     // 通用搜索关键词
	DateFrom *time.Time `json:"date_from" form:"date_from"` // 创建日期开始
	DateTo   *time.Time `json:"date_to" form:"date_to"`     // 创建日期结束
}

// RestoreBackupRequest 恢复备份请求
type RestoreBackupRequest struct {
	FileName string `json:"filename" binding:"required"` // 要恢复的备份文件名
}

// RestoreBackupResponse 恢复备份响应
type RestoreBackupResponse struct {
	Message    string    `json:"message"`
	RestoredAt time.Time `json:"restored_at"`
}
