package knowledgebases

import (
	"encoding/json"
	"time"
)

// KnowledgeBase 知识库模型
type KnowledgeBase struct {
	ID             int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name           string          `gorm:"type:varchar(255);not null" json:"name" validate:"required,max=255"`
	Description    *string         `gorm:"type:text" json:"description"`
	EmbeddingModel string          `gorm:"type:varchar(100);default:'text-embedding-ada-002'" json:"embedding_model" validate:"required"`
	ChunkSize      int             `gorm:"default:1000" json:"chunk_size" validate:"min=100,max=4000"`
	ChunkOverlap   int             `gorm:"default:200" json:"chunk_overlap" validate:"min=0,max=1000"`
	Metadata       json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsActive       bool            `gorm:"default:true" json:"is_active"`
	CreatedAt      time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// 关联查询字段
	DocumentsCount int `gorm:"-" json:"documents_count"`
}

// KBDocument 知识库文档模型
type KBDocument struct {
	ID              int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	KnowledgeBaseID int64           `gorm:"column:knowledge_base_id" json:"knowledge_base_id" validate:"required"`
	Title           string          `gorm:"type:varchar(255);not null" json:"title" validate:"required,max=255"`
	Content         string          `gorm:"type:text;not null" json:"content" validate:"required"`
	FilePath        *string         `gorm:"type:varchar(500)" json:"file_path"`
	FileType        string          `gorm:"type:varchar(50)" json:"file_type"`
	FileSize        int64           `json:"file_size"`
	Metadata        json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	ChunkIndex      int             `gorm:"default:0" json:"chunk_index"`
	ParentDocID     *int64          `gorm:"column:parent_doc_id" json:"parent_doc_id"`
	ProcessStatus   string          `gorm:"-" json:"status"` // 处理状态：processed, processing, failed
	IsActive        bool            `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// 关联查询字段
	ChunksCount int `gorm:"-" json:"chunks_count"`
}

// 请求类型

// CreateKnowledgeBaseRequest 创建知识库请求
type CreateKnowledgeBaseRequest struct {
	Name           string          `json:"name" validate:"required,max=255"`
	Description    *string         `json:"description"`
	EmbeddingModel string          `json:"embedding_model" validate:"required"`
	ChunkSize      int             `json:"chunk_size" validate:"min=100,max=4000"`
	ChunkOverlap   int             `json:"chunk_overlap" validate:"min=0,max=1000"`
	Metadata       json.RawMessage `json:"metadata"`
}

// UpdateKnowledgeBaseRequest 更新知识库请求
type UpdateKnowledgeBaseRequest struct {
	Name           *string         `json:"name" validate:"omitempty,max=255"`
	Description    *string         `json:"description"`
	EmbeddingModel *string         `json:"embedding_model"`
	ChunkSize      *int            `json:"chunk_size" validate:"omitempty,min=100,max=4000"`
	ChunkOverlap   *int            `json:"chunk_overlap" validate:"omitempty,min=0,max=1000"`
	Metadata       json.RawMessage `json:"metadata"`
	IsActive       *bool           `json:"is_active"`
}

// UploadDocumentRequest 上传文档请求
type UploadDocumentRequest struct {
	Title    string          `json:"title" validate:"required,max=255"`
	Content  string          `json:"content" validate:"required"`
	FileType string          `json:"file_type" validate:"required"`
	FileSize int64           `json:"file_size" validate:"min=0"`
	FilePath *string         `json:"file_path"`
	Metadata json.RawMessage `json:"metadata"`
}

// 响应类型

// KnowledgeBaseListResponse 知识库列表响应
type KnowledgeBaseListResponse struct {
	Items      []KnowledgeBase `json:"items"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

// KnowledgeBaseResponse 知识库详情响应（包含统计信息）
type KnowledgeBaseResponse struct {
	KnowledgeBase
	DocumentsCount     int        `json:"documents_count"`
	TotalChunks        int        `json:"total_chunks"`
	ProcessedChunks    int        `json:"processed_chunks"`
	LastDocumentUpload *time.Time `json:"last_document_upload,omitempty"`
}

// DocumentListResponse 文档列表响应
type DocumentListResponse struct {
	Items      []KBDocument `json:"items"`
	Total      int64        `json:"total"`
	Page       int          `json:"page"`
	PageSize   int          `json:"page_size"`
	TotalPages int          `json:"total_pages"`
}

// 查询参数类型

// KnowledgeBaseQueryParams 知识库查询参数
type KnowledgeBaseQueryParams struct {
	Page           int    `form:"page,default=1" validate:"min=1"`
	PageSize       int    `form:"page_size,default=20" validate:"min=1,max=100"`
	Search         string `form:"search"`
	EmbeddingModel string `form:"embedding_model"`
	IsActive       *bool  `form:"is_active"`
	OrderBy        string `form:"order_by,default=created_at"`
	OrderDir       string `form:"order_dir,default=desc" validate:"oneof=asc desc"`
}

// DocumentQueryParams 文档查询参数
type DocumentQueryParams struct {
	Page     int    `form:"page,default=1" validate:"min=1"`
	PageSize int    `form:"page_size,default=20" validate:"min=1,max=100"`
	Search   string `form:"search"`
	FileType string `form:"file_type"`
	Status   string `form:"status"`
	OrderBy  string `form:"order_by,default=created_at"`
	OrderDir string `form:"order_dir,default=desc" validate:"oneof=asc desc"`
}

// 辅助方法

// GetOrderBy 获取排序字段
func (p *KnowledgeBaseQueryParams) GetOrderBy() string {
	validOrderBy := map[string]string{
		"name":            "name",
		"created_at":      "created_at",
		"updated_at":      "updated_at",
		"documents_count": "documents_count",
	}

	if orderBy, ok := validOrderBy[p.OrderBy]; ok {
		return orderBy
	}
	return "created_at"
}

// GetOrderBy 获取排序字段
func (p *DocumentQueryParams) GetOrderBy() string {
	validOrderBy := map[string]string{
		"title":      "title",
		"file_type":  "file_type",
		"file_size":  "file_size",
		"created_at": "created_at",
		"updated_at": "updated_at",
	}

	if orderBy, ok := validOrderBy[p.OrderBy]; ok {
		return orderBy
	}
	return "created_at"
}
