package config

import (
	"asset-management-system/server/global"
	"asset-management-system/server/pkg/utils"
	"os"
	"strconv"
)

// LoadConfig 加载应用配置
func LoadConfig() *global.Config {
	config := &global.Config{
		AppName:    utils.GetEnvWithDefault("APP_NAME", "企业固定资产管理系统"),
		AppVersion: utils.GetEnvWithDefault("APP_VERSION", "1.0.0"),
		NodeEnv:    utils.GetEnvWithDefault("NODE_ENV", "development"),
		
		AppPort:       utils.GetEnvWithDefault("APP_PORT", "3000"),
		GoServicePort: utils.GetEnvWithDefault("GO_SERVICE_PORT", "8000"),
		
		DatabaseType: utils.GetEnvWithDefault("DATABASE_TYPE", "sqlite"),
		SQLiteDBPath: utils.GetEnvWithDefault("SQLITE_DB_PATH", "./data/assets.db"),
		
		UploadDir:          utils.GetEnvWithDefault("UPLOAD_DIR", "./uploads"),
		UploadAllowedTypes: utils.GetEnvWithDefault("UPLOAD_ALLOWED_TYPES", "jpg,jpeg,png,gif,pdf,doc,docx,xlsx,xls"),
		
		LogLevel:      utils.GetEnvWithDefault("LOG_LEVEL", "info"),
		EnableDebug:   getBoolEnv("ENABLE_DEBUG", false),
		EnableSwagger: getBoolEnv("ENABLE_SWAGGER", false),
		
		NextOutputMode:       utils.GetEnvWithDefault("NEXT_OUTPUT_MODE", ""),
		NextPublicAPIBaseURL: utils.GetEnvWithDefault("NEXT_PUBLIC_API_BASE_URL", ""),
		
		JWTSecret:   utils.GetEnvWithDefault("JWT_SECRET", "default-jwt-secret"),
		CORSOrigins: utils.GetEnvWithDefault("CORS_ORIGINS", "*"),
		
		MaxConcurrentRequests:   getIntEnv("MAX_CONCURRENT_REQUESTS", 100),
		RequestTimeout:          getIntEnv("REQUEST_TIMEOUT", 30),
		StaticFileCacheDuration: getIntEnv("STATIC_FILE_CACHE_DURATION", 86400),
	}
	
	// 设置上传文件大小限制
	config.UploadMaxSize = getInt64Env("UPLOAD_MAX_SIZE", 10485760)
	
	return config
}

// getBoolEnv 获取布尔类型环境变量
func getBoolEnv(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	
	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		return defaultValue
	}
	
	return boolValue
}

// getIntEnv 获取整数类型环境变量
func getIntEnv(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	
	return intValue
}

// getInt64Env 获取int64类型环境变量
func getInt64Env(key string, defaultValue int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	
	int64Value, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return defaultValue
	}
	
	return int64Value
}

// IsProduction 判断是否为生产环境
func IsProduction() bool {
	return global.AppConfig.NodeEnv == "production"
}

// IsDevelopment 判断是否为开发环境
func IsDevelopment() bool {
	return global.AppConfig.NodeEnv == "development"
}