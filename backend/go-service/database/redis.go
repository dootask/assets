package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"dootask-ai/go-service/global"
	"dootask-ai/go-service/pkg/utils"

	"github.com/redis/go-redis/v9"
)

// InitRedis 初始化Redis连接
func InitRedis() error {
	// 从环境变量获取Redis配置
	redisHost := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisDb := os.Getenv("REDIS_DB")
	redisPassword := os.Getenv("REDIS_PASSWORD")

	// 设置默认值
	if redisHost == "" {
		redisHost = "127.0.0.1"
	}
	if redisPort == "" {
		redisPort = "6379"
	}
	if redisDb == "" {
		redisDb = "0"
	}

	global.Redis = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: redisPassword,
		DB:       utils.StrToInt(redisDb),
		// 连接池配置
		PoolSize:     10,
		MinIdleConns: 5,
		// 超时配置
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		// 重试配置
		MaxRetries:      3,
		MinRetryBackoff: 8 * time.Millisecond,
		MaxRetryBackoff: 512 * time.Millisecond,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := global.Redis.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("redis连接失败: %v", err)
	}

	fmt.Println("redis连接成功")
	return nil
}

// CloseRedis 关闭Redis连接
func CloseRedis() error {
	if global.Redis != nil {
		return global.Redis.Close()
	}
	return nil
}
