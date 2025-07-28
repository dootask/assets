package global

import (
	"github.com/go-playground/validator/v10"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

var (
	EnvFile   string              // 环境变量文件
	Validator *validator.Validate // 验证器
	DB        *gorm.DB            // 数据库连接
	Redis     *redis.Client       // Redis客户端
)

// Config 应用配置
type Config struct {
	// 应用配置
	AppName    string `env:"APP_NAME" envDefault:"企业固定资产管理系统"`
	AppVersion string `env:"APP_VERSION" envDefault:"1.0.0"`
	NodeEnv    string `env:"NODE_ENV" envDefault:"development"`
	
	// 服务端口
	AppPort       string `env:"APP_PORT" envDefault:"3000"`
	GoServicePort string `env:"GO_SERVICE_PORT" envDefault:"8000"`
	
	// 数据库配置
	DatabaseType string `env:"DATABASE_TYPE" envDefault:"sqlite"`
	SQLiteDBPath string `env:"SQLITE_DB_PATH" envDefault:"./data/assets.db"`
	
	// 文件上传配置
	UploadDir           string `env:"UPLOAD_DIR" envDefault:"./uploads"`
	UploadMaxSize       int64  `env:"UPLOAD_MAX_SIZE" envDefault:"10485760"`
	UploadAllowedTypes  string `env:"UPLOAD_ALLOWED_TYPES" envDefault:"jpg,jpeg,png,gif,pdf,doc,docx,xlsx,xls"`
	
	// 日志配置
	LogLevel     string `env:"LOG_LEVEL" envDefault:"info"`
	EnableDebug  bool   `env:"ENABLE_DEBUG" envDefault:"false"`
	EnableSwagger bool  `env:"ENABLE_SWAGGER" envDefault:"false"`
	
	// 前端配置
	NextOutputMode      string `env:"NEXT_OUTPUT_MODE" envDefault:""`
	NextPublicAPIBaseURL string `env:"NEXT_PUBLIC_API_BASE_URL" envDefault:""`
	
	// 安全配置
	JWTSecret   string `env:"JWT_SECRET" envDefault:"default-jwt-secret"`
	CORSOrigins string `env:"CORS_ORIGINS" envDefault:"*"`
	
	// 性能配置
	MaxConcurrentRequests    int `env:"MAX_CONCURRENT_REQUESTS" envDefault:"100"`
	RequestTimeout          int `env:"REQUEST_TIMEOUT" envDefault:"30"`
	StaticFileCacheDuration int `env:"STATIC_FILE_CACHE_DURATION" envDefault:"86400"`
}

var AppConfig *Config
