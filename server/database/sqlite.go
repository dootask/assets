package database

import (
	"fmt"
	"os"
	"path/filepath"

	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitSQLiteDatabase 初始化SQLite数据库
func InitSQLiteDatabase() error {
	// 从环境变量获取数据库路径，默认为 ./data/assets.db
	dbPath := utils.GetEnvWithDefault("DATABASE_PATH", "./data/assets.db")
	
	// 确保数据库目录存在
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("创建数据库目录失败: %v", err)
	}

	// 配置GORM日志级别
	logLevel := logger.Silent
	if utils.GetEnvWithDefault("LOG_LEVEL", "info") == "debug" {
		logLevel = logger.Info
	}

	// 连接SQLite数据库
	var err error
	global.DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return fmt.Errorf("连接SQLite数据库失败: %v", err)
	}

	// 测试数据库连接
	sqlDB, err := global.DB.DB()
	if err != nil {
		return fmt.Errorf("获取数据库连接失败: %v", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("数据库连接测试失败: %v", err)
	}

	fmt.Printf("SQLite数据库连接成功: %s\n", dbPath)

	// 执行自动迁移
	if err := models.AutoMigrate(global.DB); err != nil {
		return fmt.Errorf("数据库迁移失败: %v", err)
	}

	fmt.Println("数据库迁移完成")

	// 创建索引
	if err := CreateIndexes(); err != nil {
		return fmt.Errorf("创建索引失败: %v", err)
	}

	// 插入初始数据
	if err := seedInitialData(); err != nil {
		return fmt.Errorf("插入初始数据失败: %v", err)
	}

	fmt.Println("初始数据插入完成")

	return nil
}

// seedInitialData 插入初始数据
func seedInitialData() error {
	// 检查是否已有数据，避免重复插入
	var categoryCount int64
	if err := global.DB.Model(&models.Category{}).Count(&categoryCount).Error; err != nil {
		return err
	}

	if categoryCount > 0 {
		fmt.Println("数据库已有数据，跳过初始数据插入")
		return nil
	}

	// 插入默认分类
	defaultCategories := []models.Category{
		{
			Name:        "办公设备",
			Code:        "OFFICE",
			Description: "办公室常用设备",
		},
		{
			Name:        "计算机设备",
			Code:        "COMPUTER",
			Description: "计算机及相关设备",
		},
		{
			Name:        "网络设备",
			Code:        "NETWORK",
			Description: "网络通信设备",
		},
		{
			Name:        "家具用品",
			Code:        "FURNITURE",
			Description: "办公家具及用品",
		},
		{
			Name:        "车辆设备",
			Code:        "VEHICLE",
			Description: "公司车辆及交通工具",
		},
	}

	for _, category := range defaultCategories {
		if err := global.DB.Create(&category).Error; err != nil {
			return fmt.Errorf("插入默认分类失败: %v", err)
		}
	}

	// 插入子分类
	var computerCategory models.Category
	if err := global.DB.Where("code = ?", "COMPUTER").First(&computerCategory).Error; err != nil {
		return err
	}

	computerSubCategories := []models.Category{
		{
			Name:        "台式电脑",
			Code:        "DESKTOP",
			ParentID:    &computerCategory.ID,
			Description: "台式计算机",
		},
		{
			Name:        "笔记本电脑",
			Code:        "LAPTOP",
			ParentID:    &computerCategory.ID,
			Description: "便携式计算机",
		},
		{
			Name:        "服务器",
			Code:        "SERVER",
			ParentID:    &computerCategory.ID,
			Description: "服务器设备",
		},
	}

	for _, subCategory := range computerSubCategories {
		if err := global.DB.Create(&subCategory).Error; err != nil {
			return fmt.Errorf("插入计算机子分类失败: %v", err)
		}
	}

	// 插入默认部门
	defaultDepartments := []models.Department{
		{
			Name:        "信息技术部",
			Code:        "IT",
			Manager:     "张三",
			Contact:     "zhangsan@company.com",
			Description: "负责公司信息技术相关工作",
		},
		{
			Name:        "人力资源部",
			Code:        "HR",
			Manager:     "李四",
			Contact:     "lisi@company.com",
			Description: "负责人力资源管理",
		},
		{
			Name:        "财务部",
			Code:        "FINANCE",
			Manager:     "王五",
			Contact:     "wangwu@company.com",
			Description: "负责财务管理",
		},
		{
			Name:        "行政部",
			Code:        "ADMIN",
			Manager:     "赵六",
			Contact:     "zhaoliu@company.com",
			Description: "负责行政管理",
		},
	}

	for _, department := range defaultDepartments {
		if err := global.DB.Create(&department).Error; err != nil {
			return fmt.Errorf("插入默认部门失败: %v", err)
		}
	}

	// 插入系统配置
	defaultConfigs := []models.SystemConfig{
		{
			ConfigKey:   "system_name",
			ConfigValue: "企业固定资产管理系统",
			Description: "系统名称",
		},
		{
			ConfigKey:   "asset_no_prefix",
			ConfigValue: "ASSET",
			Description: "资产编号前缀",
		},
		{
			ConfigKey:   "default_warranty_period",
			ConfigValue: "12",
			Description: "默认保修期（月）",
		},
		{
			ConfigKey:   "overdue_reminder_days",
			ConfigValue: "7",
			Description: "超期提醒天数",
		},
		{
			ConfigKey:   "max_upload_size",
			ConfigValue: "10485760",
			Description: "最大上传文件大小（字节）",
		},
	}

	for _, config := range defaultConfigs {
		if err := global.DB.Create(&config).Error; err != nil {
			return fmt.Errorf("插入系统配置失败: %v", err)
		}
	}

	return nil
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() error {
	if global.DB != nil {
		sqlDB, err := global.DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}