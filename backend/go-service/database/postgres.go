package database

import (
	"fmt"
	"os"

	"dootask-ai/go-service/global"
	"dootask-ai/go-service/migrations"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// InitDatabase 初始化数据库
func InitDatabase() error {
	// 从环境变量获取配置
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	dbName := os.Getenv("POSTGRES_DB")
	username := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	sslmode := os.Getenv("POSTGRES_SSLMODE")

	// 设置默认值
	if host == "" {
		host = "127.0.0.1"
	}
	if port == "" {
		port = "5432"
	}
	if dbName == "" {
		dbName = "dootask_ai"
	}
	if username == "" {
		username = "dootask"
	}
	if password == "" {
		password = "dootask123"
	}
	if sslmode == "" {
		sslmode = "disable"
	}

	// 构建DSN
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, username, password, dbName, sslmode)

	var err error
	global.DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("连接Postgres数据库失败: %v", err)
	}

	// 使用迁移管理器执行数据库迁移
	migrationManager := migrations.NewMigrationManager(global.DB)
	if err := migrationManager.Migrate(); err != nil {
		return fmt.Errorf("数据库迁移失败: %v", err)
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
