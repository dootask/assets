package cmd

import (
	"asset-management-system/server/database"
	"asset-management-system/server/global"
	"asset-management-system/server/middleware"
	"asset-management-system/server/pkg/config"
	"asset-management-system/server/pkg/utils"
	"asset-management-system/server/routes"
	"fmt"
	"log"
	"net/http"
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

	// 加载应用配置
	global.AppConfig = config.LoadConfig()
	fmt.Printf("应用配置加载完成: %s v%s (%s)\n",
		global.AppConfig.AppName,
		global.AppConfig.AppVersion,
		global.AppConfig.NodeEnv)

	// 创建必要的目录
	if err := os.MkdirAll(global.AppConfig.UploadDir, 0755); err != nil {
		fmt.Printf("创建上传目录失败: %v\n", err)
		os.Exit(1)
	}

	if err := os.MkdirAll(filepath.Dir(global.AppConfig.SQLiteDBPath), 0755); err != nil {
		fmt.Printf("创建数据库目录失败: %v\n", err)
		os.Exit(1)
	}

	// 初始化SQLite数据库
	if err := database.InitSQLiteDatabase(); err != nil {
		fmt.Printf("初始化数据库失败: %v\n", err)
		os.Exit(1)
	}
}

func runServer(*cobra.Command, []string) {
	// 设置gin模式
	if global.AppConfig.EnableDebug {
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

	// 静态文件服务
	setupStaticFileServing(r)

	// 注册路由
	routes.RegisterRoutes(r)

	// 启动服务器
	fmt.Printf("🚀 %s 服务器启动在端口: %s\n", global.AppConfig.AppName, global.AppConfig.GoServicePort)
	if err := r.Run(":" + global.AppConfig.GoServicePort); err != nil {
		database.CloseDatabase()
		log.Fatal("Failed to start server:", err)
	}
}

// setupStaticFileServing 设置静态文件服务
func setupStaticFileServing(r *gin.Engine) {
	// 上传文件服务 - 使用配置的上传目录路径
	r.Static("./public/uploads", global.AppConfig.UploadDir)

	// 生产环境下服务前端静态文件
	if config.IsProduction() {
		// 服务 Next.js 静态文件
		r.Static("/static", "./public")
		r.Static("/_next/static", "./_next/static")

		// 处理前端路由 - 所有非API请求返回index.html
		r.NoRoute(func(c *gin.Context) {
			// 如果是API请求，返回404
			if len(c.Request.URL.Path) > 4 && c.Request.URL.Path[:4] == "/api" {
				c.JSON(http.StatusNotFound, gin.H{
					"code":    "NOT_FOUND",
					"message": "API endpoint not found",
				})
				return
			}

			// 其他请求返回前端页面
			c.File("./index.html")
		})
	}
}

func Execute() error {
	global.Validator = validator.New()

	return rootCmd.Execute()
}
