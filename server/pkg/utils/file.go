package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// FileUploadConfig 文件上传配置
type FileUploadConfig struct {
	MaxSize      int64    // 最大文件大小（字节）
	AllowedTypes []string // 允许的文件类型
	UploadDir    string   // 上传目录
}

// DefaultImageUploadConfig 默认图片上传配置
var DefaultImageUploadConfig = FileUploadConfig{
	MaxSize:      10 * 1024 * 1024, // 10MB
	AllowedTypes: []string{".jpg", ".jpeg", ".png", ".gif", ".webp"},
	UploadDir:    "./uploads/images",
}

// UploadFile 上传文件
func UploadFile(file *multipart.FileHeader, config FileUploadConfig) (string, error) {
	// 检查文件大小
	if file.Size > config.MaxSize {
		return "", fmt.Errorf("文件大小超出限制，最大允许 %d 字节", config.MaxSize)
	}

	// 检查文件类型
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !contains(config.AllowedTypes, ext) {
		return "", fmt.Errorf("不支持的文件类型: %s", ext)
	}

	// 确保上传目录存在
	if err := os.MkdirAll(config.UploadDir, 0755); err != nil {
		return "", fmt.Errorf("创建上传目录失败: %v", err)
	}

	// 生成唯一文件名
	filename := generateUniqueFilename(file.Filename)
	filepath := filepath.Join(config.UploadDir, filename)

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("打开上传文件失败: %v", err)
	}
	defer src.Close()

	// 创建目标文件
	dst, err := os.Create(filepath)
	if err != nil {
		return "", fmt.Errorf("创建目标文件失败: %v", err)
	}
	defer dst.Close()

	// 复制文件内容
	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("保存文件失败: %v", err)
	}

	// 返回相对路径
	return strings.TrimPrefix(filepath, "./"), nil
}

// generateUniqueFilename 生成唯一文件名
func generateUniqueFilename(originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	name := strings.TrimSuffix(originalFilename, ext)
	
	// 清理文件名，只保留字母数字和部分特殊字符
	name = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, name)
	
	// 生成时间戳和UUID
	timestamp := time.Now().Format("20060102_150405")
	uuid := uuid.New().String()[:8]
	
	return fmt.Sprintf("%s_%s_%s%s", name, timestamp, uuid, ext)
}

// DeleteFile 删除文件
func DeleteFile(filepath string) error {
	if filepath == "" {
		return nil
	}
	
	// 添加当前目录前缀（如果不是绝对路径）
	if !strings.HasPrefix(filepath, "/") {
		filepath = "./" + filepath
	}
	
	if IsFileExists(filepath) {
		return os.Remove(filepath)
	}
	
	return nil
}

// IsFileExists 检查文件是否存在
func IsFileExists(filepath string) bool {
	_, err := os.Stat(filepath)
	return !os.IsNotExist(err)
}

// GetFileSize 获取文件大小
func GetFileSize(filepath string) (int64, error) {
	info, err := os.Stat(filepath)
	if err != nil {
		return 0, err
	}
	return info.Size(), nil
}

// contains 检查切片是否包含指定元素
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}