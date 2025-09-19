package backup

import (
	"asset-management-system/server/global"
	"asset-management-system/server/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

// CreateBackup 创建备份
func CreateBackup(c *gin.Context) {
	// 直接创建备份，不需要请求参数

	// 生成备份文件名
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("assets_backup_%s.sql", timestamp)

	// 创建备份目录
	backupDir := "./public/backups"
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		utils.InternalError(c, fmt.Sprintf("创建备份目录失败: %v", err))
		return
	}

	// 备份文件路径
	backupPath := filepath.Join(backupDir, filename)

	// 执行数据库备份
	if err := performDatabaseBackup(backupPath); err != nil {
		utils.InternalError(c, fmt.Sprintf("数据库备份失败: %v", err))
		return
	}

	// 获取文件大小
	var fileSize int64
	if fileInfo, err := os.Stat(backupPath); err == nil {
		fileSize = fileInfo.Size()
		fmt.Printf("备份创建成功: %s, 大小: %d 字节\n", filename, fileSize)
	} else {
		utils.InternalError(c, "备份文件创建失败")
		return
	}

	// 清理旧备份文件（保留最新10个）
	if err := cleanupOldBackups(); err != nil {
		// 清理失败不影响备份创建，只记录日志
		fmt.Printf("清理旧备份文件失败: %v\n", err)
	}

	// 返回响应
	response := CreateBackupResponse{
		Filename:  filename,
		FilePath:  backupPath,
		FileSize:  fileSize,
		CreatedAt: time.Now(),
	}

	utils.Success(c, response)
}

// RestoreBackup 恢复备份
func RestoreBackup(c *gin.Context) {
	var req RestoreBackupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 验证文件名
	if req.FileName == "" {
		utils.ValidationError(c, "文件名不能为空")
		return
	}

	// 检查文件名格式（防止路径遍历攻击）
	if strings.Contains(req.FileName, "..") || strings.Contains(req.FileName, "/") || strings.Contains(req.FileName, "\\") {
		utils.ValidationError(c, "无效的文件名")
		return
	}

	// 只允许.sql文件
	if !strings.HasSuffix(req.FileName, ".sql") {
		utils.ValidationError(c, "只允许恢复.sql备份文件")
		return
	}

	// 构建文件路径
	backupDir := "./public/backups"
	backupPath := filepath.Join(backupDir, req.FileName)

	// 检查文件是否存在
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		utils.ErrorWithMessage(c, "NOT_FOUND", "备份文件不存在", map[string]interface{}{
			"expected_path": backupPath,
			"filename":      req.FileName,
		})
		return
	}

	// 执行数据库恢复
	if err := performDatabaseRestore(backupPath); err != nil {
		utils.InternalError(c, fmt.Sprintf("数据库恢复失败: %v", err))
		return
	}

	// 返回响应
	response := RestoreBackupResponse{
		Message:    fmt.Sprintf("备份文件 %s 恢复成功", req.FileName),
		RestoredAt: time.Now(),
	}

	utils.Success(c, response)
}

// GetBackups 获取备份列表
func GetBackups(c *gin.Context) {
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
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	// 解析筛选条件
	var filters BackupFilters
	if err := req.ParseFiltersFromQuery(c, &filters); err != nil {
		utils.ValidationError(c, err.Error())
		return
	}

	// 从文件系统读取备份文件
	backupDir := "./public/backups"
	files, err := os.ReadDir(backupDir)
	if err != nil {
		if os.IsNotExist(err) {
			// 目录不存在，返回空列表
			utils.SuccessWithPagination(c, []BackupListResponse{}, 0, req.Page, req.PageSize)
			return
		}
		utils.InternalError(c, fmt.Sprintf("读取备份目录失败: %v", err))
		return
	}

	// 解析文件信息
	var backups []BackupListResponse
	for _, file := range files {
		if file.IsDir() {
			continue // 跳过目录
		}

		// 只处理.sql文件
		if !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		fileInfo, err := file.Info()
		if err != nil {
			continue // 跳过无法读取的文件
		}

		// 解析文件名获取创建时间
		// 文件名格式: assets_backup_YYYYMMDD_HHMMSS.db
		createdAt := fileInfo.ModTime() // 使用修改时间作为创建时间

		// 应用筛选条件
		if filters.Keyword != nil && *filters.Keyword != "" {
			keyword := strings.ToLower(*filters.Keyword)
			if !strings.Contains(strings.ToLower(file.Name()), keyword) {
				continue
			}
		}

		downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/backup/%s/download", file.Name()))

		backups = append(backups, BackupListResponse{
			Filename:    file.Name(),
			DownloadURL: downloadURL,
			FileSize:    fileInfo.Size(),
			CreatedAt:   createdAt,
			UpdatedAt:   createdAt,
		})
	}

	// 按创建时间排序（最新的在前）
	for i := 0; i < len(backups)-1; i++ {
		for j := i + 1; j < len(backups); j++ {
			if backups[i].CreatedAt.Before(backups[j].CreatedAt) {
				backups[i], backups[j] = backups[j], backups[i]
			}
		}
	}

	// 计算总数
	total := int64(len(backups))

	// 应用分页
	startIndex := (req.Page - 1) * req.PageSize
	endIndex := startIndex + req.PageSize

	if startIndex >= len(backups) {
		utils.SuccessWithPagination(c, []BackupListResponse{}, total, req.Page, req.PageSize)
		return
	}

	if endIndex > len(backups) {
		endIndex = len(backups)
	}

	pagedBackups := backups[startIndex:endIndex]

	utils.SuccessWithPagination(c, pagedBackups, total, req.Page, req.PageSize)
}

// DownloadBackup 下载备份文件
func DownloadBackup(c *gin.Context) {
	filename := c.Param("filename") // 这里使用filename作为参数

	// 验证文件名
	if filename == "" {
		utils.ValidationError(c, "文件名不能为空")
		return
	}

	// 检查文件名格式（防止路径遍历攻击）
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		utils.ValidationError(c, "无效的文件名")
		return
	}

	// 只允许.sql文件
	if !strings.HasSuffix(filename, ".sql") {
		utils.ValidationError(c, "只允许下载.sql备份文件")
		return
	}

	// 构建文件路径
	backupDir := "./public/backups"
	backupPath := filepath.Join(backupDir, filename)

	// 检查文件是否存在
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		utils.ErrorWithMessage(c, "NOT_FOUND", "备份文件不存在", map[string]interface{}{
			"expected_path": backupPath,
			"filename":      filename,
		})
		return
	}

	// 设置响应头
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/octet-stream")

	// 发送文件
	c.File(backupPath)
}

// DeleteBackup 删除备份
func DeleteBackup(c *gin.Context) {
	filename := c.Param("filename") // 这里使用filename作为参数

	// 验证文件名
	if filename == "" {
		utils.ValidationError(c, "文件名不能为空")
		return
	}

	// 检查文件名格式（防止路径遍历攻击）
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		utils.ValidationError(c, "无效的文件名")
		return
	}

	// 只允许.sql文件
	if !strings.HasSuffix(filename, ".sql") {
		utils.ValidationError(c, "只允许删除.sql备份文件")
		return
	}

	// 构建文件路径
	backupDir := "./public/backups"
	backupPath := filepath.Join(backupDir, filename)

	// 检查文件是否存在
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		utils.ErrorWithMessage(c, "NOT_FOUND", "备份文件不存在", map[string]interface{}{
			"expected_path": backupPath,
			"filename":      filename,
		})
		return
	}

	// 删除物理文件
	if err := os.Remove(backupPath); err != nil {
		utils.InternalError(c, fmt.Sprintf("删除备份文件失败: %v", err))
		return
	}

	// 返回响应
	response := DeleteBackupResponse{
		Message: "备份文件删除成功",
	}

	utils.Success(c, response)
}

// GetBackupInfo 获取备份信息
func GetBackupInfo(c *gin.Context) {
	filename := c.Param("filename") // 这里使用filename作为参数

	// 验证文件名
	if filename == "" {
		utils.ValidationError(c, "文件名不能为空")
		return
	}

	// 检查文件名格式（防止路径遍历攻击）
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		utils.ValidationError(c, "无效的文件名")
		return
	}

	// 只允许.sql文件
	if !strings.HasSuffix(filename, ".sql") {
		utils.ValidationError(c, "只允许查询.sql备份文件")
		return
	}

	// 构建文件路径
	backupDir := "./public/backups"
	backupPath := filepath.Join(backupDir, filename)

	// 检查文件是否存在
	fileInfo, err := os.Stat(backupPath)
	if os.IsNotExist(err) {
		utils.ErrorWithMessage(c, "NOT_FOUND", "备份文件不存在", map[string]interface{}{
			"expected_path": backupPath,
			"filename":      filename,
		})
		return
	}
	if err != nil {
		utils.InternalError(c, fmt.Sprintf("获取文件信息失败: %v", err))
		return
	}

	// 格式化文件大小
	formattedSize := formatFileSize(fileInfo.Size())

	// 返回响应
	response := BackupInfoResponse{
		Filename:      filename,
		FilePath:      backupPath,
		FileSize:      fileInfo.Size(),
		CreatedAt:     fileInfo.ModTime(),
		UpdatedAt:     fileInfo.ModTime(),
		FormattedSize: formattedSize,
	}

	utils.Success(c, response)
}

// formatFileSize 格式化文件大小
func formatFileSize(bytes int64) string {
	if bytes == 0 {
		return "0 B"
	}

	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// performDatabaseBackup 执行数据库备份，只备份业务表，排除SQLite系统表
func performDatabaseBackup(backupPath string) error {
	sqlDB, err := global.DB.DB()
	if err != nil {
		return fmt.Errorf("获取数据库连接失败: %v", err)
	}

	// 创建备份文件
	file, err := os.Create(backupPath)
	if err != nil {
		return fmt.Errorf("创建备份文件失败: %v", err)
	}
	defer file.Close()

	// 写入SQL文件头部信息
	file.WriteString("-- 资产管理系统数据库备份\n")
	file.WriteString(fmt.Sprintf("-- 备份时间: %s\n", time.Now().Format("2006-01-02 15:04:05")))
	file.WriteString("-- 注意: 此备份文件仅包含业务表数据，不包含SQLite系统表\n\n")
	file.WriteString("PRAGMA foreign_keys = OFF;\n")
	file.WriteString("BEGIN TRANSACTION;\n\n")

	// 获取所有业务表名（排除SQLite系统表），按照依赖关系排序
	// 只备份业务相关的表，排除sqlite_sequence等系统表
	businessTables := []string{
		"departments",       // 基础表：部门表
		"categories",        // 基础表：分类表
		"system_configs",    // 基础表：系统配置表
		"assets",            // 引用基础表的表：资产表
		"inventory_tasks",   // 引用assets的表：盘点任务表
		"borrow_records",    // 引用assets的表：借用记录表
		"inventory_records", // 引用assets的表：盘点记录表
		"operation_logs",    // 引用其他表的表：操作日志表
		"report_records",    // 引用其他表的表：报告记录表
	}

	// 验证这些表是否存在于数据库中
	var tables []string
	for _, tableName := range businessTables {
		var count int
		err := sqlDB.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", tableName).Scan(&count)
		if err != nil {
			return fmt.Errorf("检查表 %s 存在性失败: %v", tableName, err)
		}
		if count > 0 {
			tables = append(tables, tableName)
		}
	}

	// 在头部注释中记录备份的表
	file.WriteString(fmt.Sprintf("-- 备份的表: %v\n", tables))

	// 导出每个表的结构和数据
	for _, tableName := range tables {
		// 导出表结构
		var createSQL string
		err := sqlDB.QueryRow(fmt.Sprintf("SELECT sql FROM sqlite_master WHERE type='table' AND name='%s'", tableName)).Scan(&createSQL)
		if err != nil {
			return fmt.Errorf("获取表 %s 结构失败: %v", tableName, err)
		}

		// 写入表删除和重建SQL
		file.WriteString(fmt.Sprintf("-- 表: %s\n", tableName))
		file.WriteString(fmt.Sprintf("DROP TABLE IF EXISTS %s;\n", tableName))
		file.WriteString(fmt.Sprintf("%s;\n\n", createSQL))

		// 导出表数据
		dataRows, err := sqlDB.Query(fmt.Sprintf("SELECT * FROM %s", tableName))
		if err != nil {
			return fmt.Errorf("查询表 %s 数据失败: %v", tableName, err)
		}

		// 获取列信息
		columns, err := dataRows.Columns()
		if err != nil {
			dataRows.Close()
			return fmt.Errorf("获取表 %s 列信息失败: %v", tableName, err)
		}

		// 逐行导出数据
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		for dataRows.Next() {
			err := dataRows.Scan(valuePtrs...)
			if err != nil {
				dataRows.Close()
				return fmt.Errorf("扫描表 %s 数据失败: %v", tableName, err)
			}

			// 构建INSERT语句
			file.WriteString(fmt.Sprintf("INSERT INTO %s (", tableName))
			for i, col := range columns {
				if i > 0 {
					file.WriteString(", ")
				}
				file.WriteString(fmt.Sprintf("`%s`", col))
			}
			file.WriteString(") VALUES (")

			for i, val := range values {
				if i > 0 {
					file.WriteString(", ")
				}
				if val == nil {
					file.WriteString("NULL")
				} else {
					switch v := val.(type) {
					case int64:
						file.WriteString(fmt.Sprintf("%d", v))
					case float64:
						file.WriteString(fmt.Sprintf("%g", v))
					case bool:
						if v {
							file.WriteString("1")
						} else {
							file.WriteString("0")
						}
					case []byte:
						// 处理BLOB数据，转义特殊字符
						escaped := strings.ReplaceAll(string(v), "'", "''")
						file.WriteString(fmt.Sprintf("'%s'", escaped))
					case string:
						// 转义单引号
						escaped := strings.ReplaceAll(v, "'", "''")
						file.WriteString(fmt.Sprintf("'%s'", escaped))
					default:
						// 其他类型转为字符串
						escaped := strings.ReplaceAll(fmt.Sprintf("%v", v), "'", "''")
						file.WriteString(fmt.Sprintf("'%s'", escaped))
					}
				}
			}
			file.WriteString(");\n")
		}
		dataRows.Close()

		file.WriteString("\n")
	}

	// 写入SQL文件结尾
	file.WriteString("COMMIT;\n")
	file.WriteString("PRAGMA foreign_keys = ON;\n")

	return nil
}

// performDatabaseRestore 执行数据库恢复，从SQL文件恢复数据
func performDatabaseRestore(backupPath string) error {
	sqlDB, err := global.DB.DB()
	if err != nil {
		return fmt.Errorf("获取数据库连接失败: %v", err)
	}

	// 定义业务表列表（按照依赖关系的逆序删除）
	businessTables := []string{
		"report_records",    // 没有外键依赖，最后删除
		"operation_logs",    // 没有外键依赖，最后删除
		"inventory_records", // 引用assets和inventory_tasks
		"borrow_records",    // 引用assets和departments
		"inventory_tasks",   // 没有外键依赖
		"assets",            // 被多个表引用，先删除引用表
		"system_configs",    // 没有外键依赖
		"categories",        // 被assets引用
		"departments",       // 被assets和borrow_records引用
	}

	// 开始事务
	tx, err := sqlDB.Begin()
	if err != nil {
		return fmt.Errorf("开始事务失败: %v", err)
	}
	defer tx.Rollback()

	// 禁用外键约束
	if _, err := tx.Exec("PRAGMA foreign_keys = OFF;"); err != nil {
		return fmt.Errorf("禁用外键约束失败: %v", err)
	}

	// 删除所有现有业务表（按照依赖关系的逆序）
	for _, tableName := range businessTables {
		dropStmt := fmt.Sprintf("DROP TABLE IF EXISTS %s", tableName)
		if _, err := tx.Exec(dropStmt); err != nil {
			return fmt.Errorf("删除表 %s 失败: %v", tableName, err)
		}
		fmt.Printf("已删除表: %s\n", tableName)
	}

	// 读取SQL文件内容
	sqlContent, err := os.ReadFile(backupPath)
	if err != nil {
		return fmt.Errorf("读取备份文件失败: %v", err)
	}

	// 重新启用外键约束（准备执行备份文件）
	if _, err := tx.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return fmt.Errorf("重新启用外键约束失败: %v", err)
	}

	// 执行SQL恢复脚本
	// 使用智能解析器正确分割SQL语句，处理字符串中的分号
	sqlStatements, err := parseSQLStatements(string(sqlContent))
	if err != nil {
		return fmt.Errorf("解析SQL语句失败: %v", err)
	}

	for _, stmt := range sqlStatements {
		// 跳过空语句和注释
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}

		// 跳过PRAGMA、事务控制语句以及DROP TABLE语句（我们已经手动处理了）
		if strings.HasPrefix(strings.ToUpper(stmt), "PRAGMA") ||
			strings.HasPrefix(strings.ToUpper(stmt), "BEGIN") ||
			strings.HasPrefix(strings.ToUpper(stmt), "COMMIT") ||
			strings.Contains(strings.ToUpper(stmt), "DROP TABLE") {
			continue
		}

		// 执行SQL语句
		if _, err := tx.Exec(stmt); err != nil {
			return fmt.Errorf("执行SQL语句失败 [%s]: %v", stmt, err)
		}
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("提交事务失败: %v", err)
	}

	fmt.Println("数据库恢复成功")
	return nil
}

// parseSQLStatements 智能解析SQL语句，正确处理字符串中的分号
func parseSQLStatements(sqlContent string) ([]string, error) {
	var statements []string
	var currentStmt strings.Builder
	inString := false
	stringChar := byte(0)

	for i := 0; i < len(sqlContent); i++ {
		char := sqlContent[i]

		// 处理字符串开始和结束
		if !inString && (char == '\'' || char == '"') {
			inString = true
			stringChar = char
		} else if inString && char == stringChar {
			// 检查是否是转义的引号
			if i > 0 && sqlContent[i-1] == '\\' {
				// 这是转义的引号，继续在字符串中
			} else {
				inString = false
				stringChar = 0
			}
		}

		// 如果遇到分号且不在字符串中，则分割语句
		if char == ';' && !inString {
			stmt := strings.TrimSpace(currentStmt.String())
			if stmt != "" {
				statements = append(statements, stmt)
			}
			currentStmt.Reset()
		} else {
			currentStmt.WriteByte(char)
		}
	}

	// 处理最后一个语句（如果没有以分号结束）
	lastStmt := strings.TrimSpace(currentStmt.String())
	if lastStmt != "" {
		statements = append(statements, lastStmt)
	}

	return statements, nil
}

// cleanupOldBackups 清理旧备份文件，保留最新10个
func cleanupOldBackups() error {
	backupDir := "./public/backups"

	// 读取备份目录
	files, err := os.ReadDir(backupDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // 目录不存在，不需要清理
		}
		return fmt.Errorf("读取备份目录失败: %v", err)
	}

	// 收集.db文件信息
	type backupFileInfo struct {
		name    string
		path    string
		modTime time.Time
	}

	var backupFiles []backupFileInfo
	for _, file := range files {
		if file.IsDir() {
			continue
		}

		if !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		fileInfo, err := file.Info()
		if err != nil {
			continue // 跳过无法读取的文件
		}

		backupFiles = append(backupFiles, backupFileInfo{
			name:    file.Name(),
			path:    filepath.Join(backupDir, file.Name()),
			modTime: fileInfo.ModTime(),
		})
	}

	// 按修改时间排序（最新的在前）
	for i := 0; i < len(backupFiles)-1; i++ {
		for j := i + 1; j < len(backupFiles); j++ {
			if backupFiles[i].modTime.Before(backupFiles[j].modTime) {
				backupFiles[i], backupFiles[j] = backupFiles[j], backupFiles[i]
			}
		}
	}

	// 如果备份数量超过10个，删除多余的
	if len(backupFiles) > 10 {
		for i := 10; i < len(backupFiles); i++ {
			backupFile := backupFiles[i]

			// 删除物理文件
			if err := os.Remove(backupFile.path); err != nil && !os.IsNotExist(err) {
				fmt.Printf("删除备份文件失败 %s: %v\n", backupFile.path, err)
			} else {
				fmt.Printf("已清理旧备份文件: %s\n", backupFile.name)
			}
		}
	}

	return nil
}
