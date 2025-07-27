package departments

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册部门管理路由
func RegisterRoutes(r *gin.RouterGroup) {
	departments := r.Group("/departments")
	{
		departments.GET("", GetDepartments)           // 获取部门列表
		departments.POST("", CreateDepartment)        // 创建部门
		departments.GET("/:id", GetDepartment)        // 获取部门详情
		departments.PUT("/:id", UpdateDepartment)     // 更新部门
		departments.DELETE("/:id", DeleteDepartment)  // 删除部门
		departments.GET("/:id/stats", GetDepartmentStats) // 获取部门统计信息
	}
}