package cmd

import (
	"asset-management-system/server/database"
	"asset-management-system/server/global"
	"asset-management-system/server/middleware"
	"asset-management-system/server/pkg/utils"
	"asset-management-system/server/routes"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
)

var (
	rootCmd = &cobra.Command{
		Use:    "asset-management-server",
		Short:  "Asset Management System Server",
		PreRun: runPre,
		Run:    runServer,
	}
)

func init() {
	rootCmd.PersistentFlags().StringVar(&global.EnvFile, "env-file", ".env", "环境变量文件路径")
}

func runPre(*cobra.Command, []string) {
	// 转换环境变量
	if absPath, err := filepath.Abs(global.EnvFile); err == nil {
		global.EnvFile = absPath
	}

	// 加载主环境变量文件
	if global.EnvFile != "" && utils.IsFileExists(global.EnvFile) {
		if err := godotenv.Load(global.EnvFile); err != nil {
			fmt.Printf("加载环境变量失败: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("环境变量文件: %s\n", global.EnvFile)
	}

	// 初始化SQLite数据库
	if err := database.InitSQLiteDatabase(); err != nil {
		fmt.Printf("初始化数据库失败: %v\n", err)
		os.Exit(1)
	}
}

func runServer(*cobra.Command, []string) {
	// 设置gin模式
	if os.Getenv("ENABLE_DEBUG") == "true" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建Gin实例
	r := gin.New()

	// 添加中间件
	r.Use(middleware.LoggingMiddleware())
	r.Use(gin.Recovery())

	// 基础中间件
	r.Use(middleware.BaseMiddleware())

	// CORS中间件
	r.Use(middleware.CorsMiddleware())

	// 认证中间件
	r.Use(middleware.AuthMiddleware())

	// 请求响应日志中间件
	r.Use(middleware.RequestResponseLoggingMiddleware())

	// 注册路由
	routes.RegisterRoutes(r)

	// 获取端口
	port := utils.GetEnvWithDefault("GO_SERVICE_PORT", "8000")

	// 启动服务器
	fmt.Printf("服务器启动在端口: %s\n", port)
	if err := r.Run(":" + port); err != nil {
		database.CloseDatabase()
		log.Fatal("Failed to start server:", err)
	}
}

func Execute() error {
	global.Validator = validator.New()

	return rootCmd.Execute()
}
