package reports

import (
	"time"
)

// AssetReportData 资产报表数据
type AssetReportData struct {
	Summary         AssetSummary         `json:"summary"`
	ByCategory      []CategoryStats      `json:"by_category"`
	ByDepartment    []DepartmentStats    `json:"by_department"`
	ByStatus        []StatusStats        `json:"by_status"`
	ByPurchaseYear  []PurchaseYearStats  `json:"by_purchase_year"`
	ValueAnalysis   ValueAnalysis        `json:"value_analysis"`
	WarrantyStatus  WarrantyStatus       `json:"warranty_status"`
	ByLocation      []LocationStats      `json:"by_location"`
	BySupplier      []SupplierStats      `json:"by_supplier"`
	ByPurchaseMonth []PurchaseMonthStats `json:"by_purchase_month"`
	UtilizationRate UtilizationRate      `json:"utilization_rate"`
}

// AssetSummary 资产汇总
type AssetSummary struct {
	TotalAssets       int64   `json:"total_assets"`
	TotalValue        float64 `json:"total_value"`
	AvailableAssets   int64   `json:"available_assets"`
	BorrowedAssets    int64   `json:"borrowed_assets"`
	MaintenanceAssets int64   `json:"maintenance_assets"`
	ScrappedAssets    int64   `json:"scrapped_assets"`
}

// CategoryStats 分类统计
type CategoryStats struct {
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	AssetCount   int64   `json:"asset_count"`
	TotalValue   float64 `json:"total_value"`
	Percentage   float64 `json:"percentage"`
}

// DepartmentStats 部门统计
type DepartmentStats struct {
	DepartmentID   *uint   `json:"department_id"`
	DepartmentName string  `json:"department_name"`
	AssetCount     int64   `json:"asset_count"`
	TotalValue     float64 `json:"total_value"`
	Percentage     float64 `json:"percentage"`
}

// StatusStats 状态统计
type StatusStats struct {
	Status     string  `json:"status"`
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

// PurchaseYearStats 采购年份统计
type PurchaseYearStats struct {
	Year       int     `json:"year"`
	Count      int64   `json:"count"`
	TotalValue float64 `json:"total_value"`
}

// ValueAnalysis 价值分析
type ValueAnalysis struct {
	HighValue    int64   `json:"high_value"`    // 高价值资产数量 (>10000)
	MediumValue  int64   `json:"medium_value"`  // 中等价值资产数量 (1000-10000)
	LowValue     int64   `json:"low_value"`     // 低价值资产数量 (<1000)
	NoValue      int64   `json:"no_value"`      // 无价值信息资产数量
	AverageValue float64 `json:"average_value"` // 平均价值
}

// WarrantyStatus 保修状态
type WarrantyStatus struct {
	InWarranty      int64 `json:"in_warranty"`      // 保修期内
	ExpiredWarranty int64 `json:"expired_warranty"` // 保修期外
	NoWarranty      int64 `json:"no_warranty"`      // 无保修信息
}

// BorrowReportData 借用报表数据
type BorrowReportData struct {
	Summary          BorrowSummary           `json:"summary"`
	ByDepartment     []BorrowDepartmentStats `json:"by_department"`
	ByAsset          []BorrowAssetStats      `json:"by_asset"`
	OverdueAnalysis  OverdueAnalysis         `json:"overdue_analysis"`
	MonthlyTrend     []MonthlyBorrowStats    `json:"monthly_trend"`
	PopularAssets    []PopularAssetStats     `json:"popular_assets"`
	ByBorrower       []BorrowerStats         `json:"by_borrower"`
	ByAssetCategory  []BorrowCategoryStats   `json:"by_asset_category"`
	ByBorrowDuration []BorrowDurationStats   `json:"by_borrow_duration"`
	BorrowTrends     BorrowTrends            `json:"borrow_trends"`
}

// BorrowSummary 借用汇总
type BorrowSummary struct {
	TotalBorrows      int64   `json:"total_borrows"`
	ActiveBorrows     int64   `json:"active_borrows"`
	ReturnedBorrows   int64   `json:"returned_borrows"`
	OverdueBorrows    int64   `json:"overdue_borrows"`
	AverageReturnDays float64 `json:"average_return_days"`
}

// BorrowDepartmentStats 部门借用统计
type BorrowDepartmentStats struct {
	DepartmentID   *uint   `json:"department_id"`
	DepartmentName string  `json:"department_name"`
	BorrowCount    int64   `json:"borrow_count"`
	ActiveCount    int64   `json:"active_count"`
	OverdueCount   int64   `json:"overdue_count"`
	Percentage     float64 `json:"percentage"`
}

// BorrowAssetStats 资产借用统计
type BorrowAssetStats struct {
	AssetID     uint   `json:"asset_id"`
	AssetNo     string `json:"asset_no"`
	AssetName   string `json:"asset_name"`
	BorrowCount int64  `json:"borrow_count"`
	TotalDays   int64  `json:"total_days"`
}

// OverdueAnalysis 超期分析
type OverdueAnalysis struct {
	TotalOverdue       int64              `json:"total_overdue"`
	OverdueRate        float64            `json:"overdue_rate"`
	AverageOverdueDays float64            `json:"average_overdue_days"`
	ByOverdueDays      []OverdueDaysStats `json:"by_overdue_days"`
}

// OverdueDaysStats 超期天数统计
type OverdueDaysStats struct {
	DaysRange string `json:"days_range"`
	Count     int64  `json:"count"`
}

// MonthlyBorrowStats 月度借用统计
type MonthlyBorrowStats struct {
	Month       string `json:"month"`
	BorrowCount int64  `json:"borrow_count"`
	ReturnCount int64  `json:"return_count"`
}

// PopularAssetStats 热门资产统计
type PopularAssetStats struct {
	AssetID     uint   `json:"asset_id"`
	AssetNo     string `json:"asset_no"`
	AssetName   string `json:"asset_name"`
	BorrowCount int64  `json:"borrow_count"`
	Rank        int    `json:"rank"`
}

// BorrowerStats 借用人统计
type BorrowerStats struct {
	BorrowerName string  `json:"borrower_name"`
	BorrowCount  int64   `json:"borrow_count"`
	ActiveCount  int64   `json:"active_count"`
	OverdueCount int64   `json:"overdue_count"`
	Percentage   float64 `json:"percentage"`
}

// BorrowCategoryStats 资产分类借用统计
type BorrowCategoryStats struct {
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	BorrowCount  int64   `json:"borrow_count"`
	ActiveCount  int64   `json:"active_count"`
	OverdueCount int64   `json:"overdue_count"`
	Percentage   float64 `json:"percentage"`
}

// BorrowDurationStats 借用时长统计
type BorrowDurationStats struct {
	DurationRange string  `json:"duration_range"`
	BorrowCount   int64   `json:"borrow_count"`
	Percentage    float64 `json:"percentage"`
}

// BorrowTrends 借用趋势分析
type BorrowTrends struct {
	WeeklyTrend   []WeeklyBorrowStats `json:"weekly_trend"`
	DailyTrend    []DailyBorrowStats  `json:"daily_trend"`
	HourlyPattern []HourlyBorrowStats `json:"hourly_pattern"`
}

// WeeklyBorrowStats 周度借用统计
type WeeklyBorrowStats struct {
	Week        string `json:"week"`
	BorrowCount int64  `json:"borrow_count"`
	ReturnCount int64  `json:"return_count"`
	NetBorrows  int64  `json:"net_borrows"`
}

// DailyBorrowStats 日度借用统计
type DailyBorrowStats struct {
	Date        string `json:"date"`
	BorrowCount int64  `json:"borrow_count"`
	ReturnCount int64  `json:"return_count"`
	NetBorrows  int64  `json:"net_borrows"`
}

// HourlyBorrowStats 小时借用统计
type HourlyBorrowStats struct {
	Hour        int   `json:"hour"`
	BorrowCount int64 `json:"borrow_count"`
	ReturnCount int64 `json:"return_count"`
}

// InventoryReportData 盘点报表数据
type InventoryReportData struct {
	Summary            InventorySummary           `json:"summary"`
	TaskAnalysis       []InventoryTaskStats       `json:"task_analysis"`
	ResultAnalysis     InventoryResultAnalysis    `json:"result_analysis"`
	DepartmentAnalysis []InventoryDepartmentStats `json:"department_analysis"`
	CategoryAnalysis   []InventoryCategoryStats   `json:"category_analysis"`
	TrendAnalysis      []InventoryTrendStats      `json:"trend_analysis"`
}

// InventorySummary 盘点汇总
type InventorySummary struct {
	TotalTasks      int64   `json:"total_tasks"`
	CompletedTasks  int64   `json:"completed_tasks"`
	PendingTasks    int64   `json:"pending_tasks"`
	InProgressTasks int64   `json:"in_progress_tasks"`
	TotalRecords    int64   `json:"total_records"`
	AccuracyRate    float64 `json:"accuracy_rate"`
}

// InventoryTaskStats 盘点任务统计
type InventoryTaskStats struct {
	TaskID        uint       `json:"task_id"`
	TaskName      string     `json:"task_name"`
	TaskType      string     `json:"task_type"`
	Status        string     `json:"status"`
	StartDate     *time.Time `json:"start_date"`
	EndDate       *time.Time `json:"end_date"`
	TotalAssets   int64      `json:"total_assets"`
	CheckedAssets int64      `json:"checked_assets"`
	NormalCount   int64      `json:"normal_count"`
	SurplusCount  int64      `json:"surplus_count"`
	DeficitCount  int64      `json:"deficit_count"`
	DamagedCount  int64      `json:"damaged_count"`
	AccuracyRate  float64    `json:"accuracy_rate"`
}

// InventoryResultAnalysis 盘点结果分析
type InventoryResultAnalysis struct {
	NormalCount  int64   `json:"normal_count"`
	SurplusCount int64   `json:"surplus_count"`
	DeficitCount int64   `json:"deficit_count"`
	DamagedCount int64   `json:"damaged_count"`
	NormalRate   float64 `json:"normal_rate"`
	SurplusRate  float64 `json:"surplus_rate"`
	DeficitRate  float64 `json:"deficit_rate"`
	DamagedRate  float64 `json:"damaged_rate"`
}

// InventoryDepartmentStats 部门盘点统计
type InventoryDepartmentStats struct {
	DepartmentID   *uint   `json:"department_id"`
	DepartmentName string  `json:"department_name"`
	TotalAssets    int64   `json:"total_assets"`
	CheckedAssets  int64   `json:"checked_assets"`
	NormalCount    int64   `json:"normal_count"`
	IssueCount     int64   `json:"issue_count"`
	AccuracyRate   float64 `json:"accuracy_rate"`
}

// InventoryCategoryStats 分类盘点统计
type InventoryCategoryStats struct {
	CategoryID    uint    `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	TotalAssets   int64   `json:"total_assets"`
	CheckedAssets int64   `json:"checked_assets"`
	NormalCount   int64   `json:"normal_count"`
	IssueCount    int64   `json:"issue_count"`
	AccuracyRate  float64 `json:"accuracy_rate"`
}

// InventoryTrendStats 盘点趋势统计
type InventoryTrendStats struct {
	Month        string  `json:"month"`
	TaskCount    int64   `json:"task_count"`
	AccuracyRate float64 `json:"accuracy_rate"`
}

// DashboardReportData 仪表板报表数据
type DashboardReportData struct {
	AssetSummary     AssetOverview     `json:"asset_summary"`
	BorrowSummary    BorrowOverview    `json:"borrow_summary"`
	InventorySummary InventoryOverview `json:"inventory_summary"`
	RecentActivities RecentActivity    `json:"recent_activities"`
	Alerts           []SystemAlert     `json:"alerts"`
}

// AssetOverview 资产概览
type AssetOverview struct {
	TotalAssets       int64   `json:"total_assets"`
	TotalValue        float64 `json:"total_value"`
	AvailableAssets   int64   `json:"available_assets"`
	BorrowedAssets    int64   `json:"borrowed_assets"`
	MaintenanceAssets int64   `json:"maintenance_assets"`
	ScrappedAssets    int64   `json:"scrapped_assets"`
	GrowthRate        float64 `json:"growth_rate"` // 相比上月增长率
}

// BorrowOverview 借用概览
type BorrowOverview struct {
	ActiveBorrows  int64   `json:"active_borrows"`
	OverdueBorrows int64   `json:"overdue_borrows"`
	TodayBorrows   int64   `json:"today_borrows"`
	TodayReturns   int64   `json:"today_returns"`
	OverdueRate    float64 `json:"overdue_rate"`
}

// InventoryOverview 盘点概览
type InventoryOverview struct {
	ActiveTasks    int64   `json:"active_tasks"` // 前端期望的活跃任务数（pending + in_progress）
	CompletedTasks int64   `json:"completed_tasks"`
	AccuracyRate   float64 `json:"accuracy_rate"`
}

// RecentActivity 最近活动
type RecentActivity struct {
	RecentAssets  []RecentAsset  `json:"recent_assets"`
	RecentBorrows []RecentBorrow `json:"recent_borrows"`
	RecentReturns []RecentReturn `json:"recent_returns"`
}

// RecentAsset 最近资产
type RecentAsset struct {
	ID           uint      `json:"id"`
	AssetNo      string    `json:"asset_no"`
	Name         string    `json:"name"`
	CategoryName string    `json:"category_name"`
	CreatedAt    time.Time `json:"created_at"`
}

// RecentBorrow 最近借用
type RecentBorrow struct {
	ID           uint      `json:"id"`
	AssetNo      string    `json:"asset_no"`
	AssetName    string    `json:"asset_name"`
	BorrowerName string    `json:"borrower_name"`
	BorrowDate   time.Time `json:"borrow_date"`
}

// RecentReturn 最近归还
type RecentReturn struct {
	ID               uint      `json:"id"`
	AssetNo          string    `json:"asset_no"`
	AssetName        string    `json:"asset_name"`
	BorrowerName     string    `json:"borrower_name"`
	ActualReturnDate time.Time `json:"actual_return_date"`
}

// SystemAlert 系统警报
type SystemAlert struct {
	Type        string    `json:"type"` // overdue, warranty_expiring, maintenance_due
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Count       int64     `json:"count"`
	Severity    string    `json:"severity"` // low, medium, high
	CreatedAt   time.Time `json:"created_at"`
}

// CustomReportRequest 自定义报表请求
type CustomReportRequest struct {
	ReportType string                 `json:"type"` // asset, borrow, inventory
	DateRange  DateRange              `json:"date_range"`
	Filters    map[string]interface{} `json:"filters"`
	GroupBy    []string               `json:"group_by"`
	Metrics    []string               `json:"fields"`
	SortBy     string                 `json:"sort_by"`
	SortOrder  string                 `json:"sort_order"` // asc, desc
	Limit      int                    `json:"limit"`
}

// DateRange 日期范围
type DateRange struct {
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
}

// CustomReportResponse 自定义报表响应
type CustomReportResponse struct {
	Columns []CustomReportColumn     `json:"columns"`
	Data    []map[string]interface{} `json:"data"`
	Total   int64                    `json:"total"`
}

// CustomReportColumn 自定义报表列定义
type CustomReportColumn struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

// LocationStats 位置统计
type LocationStats struct {
	Location   string  `json:"location"`
	AssetCount int64   `json:"asset_count"`
	TotalValue float64 `json:"total_value"`
	Percentage float64 `json:"percentage"`
}

// SupplierStats 供应商统计
type SupplierStats struct {
	Supplier   string  `json:"supplier"`
	AssetCount int64   `json:"asset_count"`
	TotalValue float64 `json:"total_value"`
	Percentage float64 `json:"percentage"`
}

// PurchaseMonthStats 采购月份统计
type PurchaseMonthStats struct {
	Month        string  `json:"month"`
	AssetCount   int64   `json:"asset_count"`
	TotalValue   float64 `json:"total_value"`
	AverageValue float64 `json:"average_value"`
}

// UtilizationRate 利用率统计
type UtilizationRate struct {
	TotalAssets     int64   `json:"total_assets"`
	BorrowedAssets  int64   `json:"borrowed_assets"`
	AvailableAssets int64   `json:"available_assets"`
	UtilizationRate float64 `json:"utilization_rate"`
	BorrowRate      float64 `json:"borrow_rate"`
}

// ExportRequest 导出请求
type ExportRequest struct {
	Format     string                 `json:"format"` // excel, csv, pdf
	ReportType string                 `json:"report_type"`
	DateRange  DateRange              `json:"date_range"`
	Filters    map[string]interface{} `json:"filters"`
}
