package middleware

import (
	"github.com/gin-gonic/gin"
)

// DootaskMiddleware 对接口进行鉴权
func DootaskMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 测试环境
		c.Set("DooTask_Token", "YIG8ANC8q2ROQF91r8Pe6-53rIG3oCxcqQN-mMdZpQKe7mKwNqIHenDNqbDDdyQIdo9w2KdveEpF1NaH-5Nfmv0dBr9TkjJ7srTrjvFfg1R9dzzVs7zL6JaAliRz8d5z")
		c.Set("DooTask_Server", "http://127.0.0.1:2222")

		// 生产环境
		// c.Set("DooTask_Token", c.GetHeader("DooTask-Token"))
		// c.Set("DooTask_Server", "http://nginx")

		c.Next()
	}
}
