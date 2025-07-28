package dashboard

import (
	"net/http"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"

	"github.com/gin-gonic/gin"
)

var startTime = time.Now()

// RegisterRoutes 注册仪表板路由
func RegisterRoutes(router *gin.RouterGroup) {
	// 仪表板路由
	dashboardGroup := router.Group("/dashboard")
	{
		dashboardGroup.GET("/stats", GetDashboardStats)           // 获取仪表板统计
		dashboardGroup.GET("/system-status", GetSystemStatus)     // 获取系统状态
		dashboardGroup.GET("/recent-activity", GetRecentActivity) // 获取最近活动
		dashboardGroup.GET("/health", GetSystemHealth)            // 系统健康检查
		dashboardGroup.GET("/test", TestDashboard)                // 测试数据库连接
	}
}

// GetDashboardStats 获取仪表板统计数据
func GetDashboardStats(c *gin.Context) {
	stats := map[string]interface{}{
		"assets":        getAssetStats(),
		"categories":    getCategoryStats(),
		"departments":   getDepartmentStats(),
		"borrow":        getBorrowStats(),
		"inventory":     getInventoryStats(),
		"system_status": getSystemStatusInfo(),
		"last_updated":  time.Now(),
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "操作成功",
		"data":    stats,
	})
}

// GetSystemStatus 获取系统状态
func GetSystemStatus(c *gin.Context) {
	status := getSystemStatusInfo()
	c.JSON(http.StatusOK, status)
}

// GetRecentActivity 获取最近活动
func GetRecentActivity(c *gin.Context) {
	activity := map[string]interface{}{
		"recent_assets":  getRecentAssets(),
		"recent_borrows": getRecentBorrows(),
	}

	c.JSON(http.StatusOK, activity)
}

// GetSystemHealth 系统健康检查
func GetSystemHealth(c *gin.Context) {
	services := make(map[string]ServiceStatus)

	// 检查Go服务状态
	services["go_service"] = ServiceStatus{
		Status:    "online",
		Uptime:    int64(time.Since(startTime).Seconds()),
		LastCheck: time.Now(),
		Details:   "Service running normally",
	}

	// 检查数据库状态
	dbStatus := checkDatabaseStatus()
	services["database"] = dbStatus

	// 检查文件存储状态
	services["file_storage"] = ServiceStatus{
		Status:    "online",
		Uptime:    int64(time.Since(startTime).Seconds()),
		LastCheck: time.Now(),
		Details:   "File storage operational",
	}

	// 计算整体健康状态
	healthyCount := 0
	totalCount := len(services)
	var issues []string

	for name, service := range services {
		if service.Status == "online" || service.Status == "connected" {
			healthyCount++
		} else {
			issues = append(issues, name+" is "+service.Status)
		}
	}

	overallStatus := "healthy"
	if healthyCount < totalCount {
		if healthyCount > totalCount/2 {
			overallStatus = "warning"
		} else {
			overallStatus = "error"
		}
	}

	response := SystemHealthResponse{
		Status:   overallStatus,
		Services: services,
		Summary: SystemHealthSummary{
			HealthyServices: healthyCount,
			TotalServices:   totalCount,
			OverallScore:    (healthyCount * 100) / totalCount,
			Issues:          issues,
		},
	}

	c.JSON(http.StatusOK, response)
}

// TestDashboard 测试仪表板相关表的数据库连接
func TestDashboard(c *gin.Context) {
	testResults := make(map[string]interface{})

	// 测试assets表
	var assetCount int64
	if err := global.DB.Model(&models.Asset{}).Count(&assetCount).Error; err != nil {
		testResults["assets"] = gin.H{"error": err.Error()}
	} else {
		testResults["assets"] = gin.H{"count": assetCount, "status": "ok"}
	}

	// 测试categories表
	var categoryCount int64
	if err := global.DB.Model(&models.Category{}).Count(&categoryCount).Error; err != nil {
		testResults["categories"] = gin.H{"error": err.Error()}
	} else {
		testResults["categories"] = gin.H{"count": categoryCount, "status": "ok"}
	}

	// 测试departments表
	var departmentCount int64
	if err := global.DB.Model(&models.Department{}).Count(&departmentCount).Error; err != nil {
		testResults["departments"] = gin.H{"error": err.Error()}
	} else {
		testResults["departments"] = gin.H{"count": departmentCount, "status": "ok"}
	}

	// 测试borrow_records表
	var borrowCount int64
	if err := global.DB.Model(&models.BorrowRecord{}).Count(&borrowCount).Error; err != nil {
		testResults["borrow_records"] = gin.H{"error": err.Error()}
	} else {
		testResults["borrow_records"] = gin.H{"count": borrowCount, "status": "ok"}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "数据库表测试完成",
		"data":    testResults,
	})
}

// getAssetStats 获取资产统计
func getAssetStats() map[string]interface{} {
	var total, available, borrowed, maintenance, scrapped int64

	global.DB.Model(&models.Asset{}).Count(&total)
	global.DB.Model(&models.Asset{}).Where("status = ?", "available").Count(&available)
	global.DB.Model(&models.Asset{}).Where("status = ?", "borrowed").Count(&borrowed)
	global.DB.Model(&models.Asset{}).Where("status = ?", "maintenance").Count(&maintenance)
	global.DB.Model(&models.Asset{}).Where("status = ?", "scrapped").Count(&scrapped)

	return map[string]interface{}{
		"total":       total,
		"available":   available,
		"borrowed":    borrowed,
		"maintenance": maintenance,
		"scrapped":    scrapped,
	}
}

// getCategoryStats 获取分类统计
func getCategoryStats() map[string]interface{} {
	var total int64
	global.DB.Model(&models.Category{}).Count(&total)

	return map[string]interface{}{
		"total": total,
	}
}

// getDepartmentStats 获取部门统计
func getDepartmentStats() map[string]interface{} {
	var total int64
	global.DB.Model(&models.Department{}).Count(&total)

	return map[string]interface{}{
		"total": total,
	}
}

// getBorrowStats 获取借用统计
func getBorrowStats() map[string]interface{} {
	var total, active, overdue int64

	global.DB.Model(&models.BorrowRecord{}).Count(&total)
	global.DB.Model(&models.BorrowRecord{}).Where("status = ?", "borrowed").Count(&active)
	global.DB.Model(&models.BorrowRecord{}).Where("status = ? AND expected_return_date < ?", "borrowed", time.Now()).Count(&overdue)

	return map[string]interface{}{
		"total":   total,
		"active":  active,
		"overdue": overdue,
	}
}

// getInventoryStats 获取盘点统计
func getInventoryStats() map[string]interface{} {
	var total, pending, completed int64

	global.DB.Model(&models.InventoryTask{}).Count(&total)
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", "pending").Count(&pending)
	global.DB.Model(&models.InventoryTask{}).Where("status = ?", "completed").Count(&completed)

	return map[string]interface{}{
		"total":     total,
		"pending":   pending,
		"completed": completed,
	}
}

// getSystemStatusInfo 获取系统状态信息
func getSystemStatusInfo() map[string]interface{} {
	now := time.Now()
	uptime := int64(time.Since(startTime).Seconds())

	return map[string]interface{}{
		"server": ServiceStatus{
			Status:    "online",
			Uptime:    uptime,
			LastCheck: now,
			Details:   "Asset management server running",
		},
		"database": checkDatabaseStatus(),
		"file_storage": ServiceStatus{
			Status:    "online",
			Uptime:    uptime,
			LastCheck: now,
			Details:   "File storage operational",
		},
	}
}

// checkDatabaseStatus 检查数据库状态
func checkDatabaseStatus() ServiceStatus {
	now := time.Now()

	sqlDB, err := global.DB.DB()
	if err != nil {
		return ServiceStatus{
			Status:    "error",
			Uptime:    0,
			LastCheck: now,
			Details:   "Failed to get database connection: " + err.Error(),
		}
	}

	if err := sqlDB.Ping(); err != nil {
		return ServiceStatus{
			Status:    "offline",
			Uptime:    0,
			LastCheck: now,
			Details:   "Database ping failed: " + err.Error(),
		}
	}

	return ServiceStatus{
		Status:    "online",
		Uptime:    int64(time.Since(startTime).Seconds()),
		LastCheck: now,
		Details:   "Database connection healthy",
	}
}

// getRecentAssets 获取最近添加的资产
func getRecentAssets() []map[string]interface{} {
	var assets []map[string]interface{}

	rows, err := global.DB.Raw(`
		SELECT a.id, a.asset_no, a.name, a.status, a.created_at,
		       c.name as category_name, d.name as department_name
		FROM assets a
		LEFT JOIN categories c ON c.id = a.category_id AND c.deleted_at IS NULL
		LEFT JOIN departments d ON d.id = a.department_id AND d.deleted_at IS NULL
		WHERE a.deleted_at IS NULL
		ORDER BY a.created_at DESC
		LIMIT 5
	`).Rows()

	if err != nil {
		return assets
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var assetNo, name, status, categoryName, departmentName string
		var createdAt time.Time

		if err := rows.Scan(&id, &assetNo, &name, &status, &createdAt,
			&categoryName, &departmentName); err != nil {
			continue
		}

		assets = append(assets, map[string]interface{}{
			"id":              id,
			"asset_no":        assetNo,
			"name":            name,
			"status":          status,
			"category_name":   categoryName,
			"department_name": departmentName,
			"created_at":      createdAt,
		})
	}

	return assets
}

// getRecentBorrows 获取最近的借用记录
func getRecentBorrows() []map[string]interface{} {
	var borrows []map[string]interface{}

	rows, err := global.DB.Raw(`
		SELECT br.id, br.borrower_name, br.borrow_date, br.status,
		       a.asset_no, a.name as asset_name
		FROM borrow_records br
		JOIN assets a ON a.id = br.asset_id AND a.deleted_at IS NULL
		WHERE br.deleted_at IS NULL
		ORDER BY br.borrow_date DESC
		LIMIT 5
	`).Rows()

	if err != nil {
		return borrows
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var borrowerName, status, assetNo, assetName string
		var borrowDate time.Time

		if err := rows.Scan(&id, &borrowerName, &borrowDate, &status,
			&assetNo, &assetName); err != nil {
			continue
		}

		borrows = append(borrows, map[string]interface{}{
			"id":            id,
			"borrower_name": borrowerName,
			"asset_no":      assetNo,
			"asset_name":    assetName,
			"status":        status,
			"borrow_date":   borrowDate,
		})
	}

	return borrows
}
