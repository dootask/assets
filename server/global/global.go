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
