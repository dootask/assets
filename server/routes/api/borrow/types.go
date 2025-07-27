package borrow

import (
	"asset-management-system/server/models"
	"time"
)

// CreateBorrowRequest 创建借用记录请求
type CreateBorrowRequest struct {
	AssetID            uint       `json:"asset_id" validate:"required"`
	BorrowerName       string     `json:"borrower_name" validate:"required,max=100"`
	BorrowerContact    string     `json:"borrower_contact" validate:"max=100"`
	DepartmentID       *uint      `json:"department_id"`
	BorrowDate         time.Time  `json:"borrow_date" validate:"required"`
	ExpectedReturnDate *time.Time `json:"expected_return_date"`
	Purpose            string     `json:"purpose"`
	Notes              string     `json:"notes"`
}

// UpdateBorrowRequest 更新借用记录请求
type UpdateBorrowRequest struct {
	BorrowerName       *string    `json:"borrower_name" validate:"omitempty,max=100"`
	BorrowerContact    *string    `json:"borrower_contact" validate:"omitempty,max=100"`
	DepartmentID       *uint      `json:"department_id"`
	BorrowDate         *time.Time `json:"borrow_date"`
	ExpectedReturnDate *time.Time `json:"expected_return_date"`
	Purpose            *string    `json:"purpose"`
	Notes              *string    `json:"notes"`
}

// ReturnAssetRequest 归还资产请求
type ReturnAssetRequest struct {
	ActualReturnDate *time.Time `json:"actual_return_date"`
	Notes            *string    `json:"notes"`
}

// BorrowResponse 借用记录响应
type BorrowResponse struct {
	models.BorrowRecord
	IsOverdue    bool `json:"is_overdue"`
	OverdueDays  int  `json:"overdue_days"`
	CanReturn    bool `json:"can_return"`
}

// BorrowFilters 借用记录筛选条件
type BorrowFilters struct {
	AssetID         *uint                `form:"asset_id"`
	BorrowerName    *string              `form:"borrower_name"`
	DepartmentID    *uint                `form:"department_id"`
	Status          *models.BorrowStatus `form:"status"`
	BorrowDateFrom  *time.Time           `form:"borrow_date_from"`
	BorrowDateTo    *time.Time           `form:"borrow_date_to"`
	ExpectedDateFrom *time.Time          `form:"expected_date_from"`
	ExpectedDateTo   *time.Time          `form:"expected_date_to"`
	OverdueOnly     *bool                `form:"overdue_only"`
}

// BorrowStatsResponse 借用统计响应
type BorrowStatsResponse struct {
	TotalBorrows     int64                    `json:"total_borrows"`
	ActiveBorrows    int64                    `json:"active_borrows"`
	OverdueBorrows   int64                    `json:"overdue_borrows"`
	ReturnedBorrows  int64                    `json:"returned_borrows"`
	BorrowsByStatus  map[string]int64         `json:"borrows_by_status"`
	BorrowsByMonth   []MonthlyBorrowStats     `json:"borrows_by_month"`
	TopBorrowers     []BorrowerStats          `json:"top_borrowers"`
	TopAssets        []AssetBorrowStats       `json:"top_assets"`
}

// MonthlyBorrowStats 月度借用统计
type MonthlyBorrowStats struct {
	Month   string `json:"month"`
	Count   int64  `json:"count"`
	Returns int64  `json:"returns"`
}

// BorrowerStats 借用人统计
type BorrowerStats struct {
	BorrowerName string `json:"borrower_name"`
	Count        int64  `json:"count"`
	ActiveCount  int64  `json:"active_count"`
}

// AssetBorrowStats 资产借用统计
type AssetBorrowStats struct {
	AssetID   uint   `json:"asset_id"`
	AssetName string `json:"asset_name"`
	AssetNo   string `json:"asset_no"`
	Count     int64  `json:"count"`
}

// AvailableAssetResponse 可借用资产响应
type AvailableAssetResponse struct {
	models.Asset
	LastBorrowDate *time.Time `json:"last_borrow_date"`
	BorrowCount    int64      `json:"borrow_count"`
}