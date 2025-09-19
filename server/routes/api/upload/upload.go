package upload

import (
	"asset-management-system/server/pkg/utils"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes 注册上传路由
func RegisterRoutes(r *gin.RouterGroup) {
	upload := r.Group("/upload")
	{
		upload.POST("/image", uploadImage)
		upload.POST("/file", uploadFile)
	}
}

// uploadImage 上传图片
func uploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		utils.Error(c, utils.BAD_REQUEST, gin.H{"error": "获取上传文件失败"})
		return
	}

	// 使用默认图片上传配置
	filepath, err := utils.UploadFile(file, utils.DefaultImageUploadConfig)
	if err != nil {
		utils.Error(c, utils.FILE_UPLOAD_FAILED, gin.H{"error": err.Error()})
		return
	}

	utils.Success(c, gin.H{
		"filename": file.Filename,
		"filepath": filepath,
		"size":     file.Size,
	})
}

// uploadFile 上传通用文件
func uploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		utils.Error(c, utils.BAD_REQUEST, gin.H{"error": "获取上传文件失败"})
		return
	}

	// 通用文件上传配置
	config := utils.FileUploadConfig{
		MaxSize:      50 * 1024 * 1024, // 50MB
		AllowedTypes: []string{".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"},
		UploadDir:    "./public/uploads/files",
	}

	filepath, err := utils.UploadFile(file, config)
	if err != nil {
		utils.Error(c, utils.FILE_UPLOAD_FAILED, gin.H{"error": err.Error()})
		return
	}

	utils.Success(c, gin.H{
		"filename": file.Filename,
		"filepath": filepath,
		"size":     file.Size,
	})
}
