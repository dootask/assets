# 企业固定资产管理系统 - 开发指南

## 🚀 快速开始

### 环境要求

- **Node.js** 22+
- **Go** 1.21+
- **SQLite** 3+

### 项目克隆和初始化

```bash
# 克隆项目
git clone https://github.com/asset-management/system.git
cd system

# 安装前端依赖
npm install

# 启动前端开发服务器
npm run dev

# 启动后端服务器（新终端）
cd server
go run main.go
```

### 环境配置

```bash
# 后端环境变量 (server/.env)
PORT=8000
DATABASE_URL=./data/assets.db
UPLOAD_DIR=./uploads
LOG_LEVEL=info
```

## 📝 开发规范

### Git 工作流

```bash
# 功能分支命名规范
feature/资产管理    # feature/asset-management
feature/借用系统    # feature/borrow-system
feature/盘点功能    # feature/inventory-feature
hotfix/修复XXX     # hotfix/fix-xxx
```

### 代码格式化规范

```bash
# 格式化所有代码
npm run format

# 检查代码格式
npm run format:check

# 格式化并修复 ESLint 问题
npm run format:fix
```

### 提交规范

```bash
git commit -m "feat(frontend): 添加资产列表页面"
git commit -m "fix(backend): 修复借用记录查询错误"
git commit -m "docs: 更新API文档"

# 类型说明
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式调整
refactor: 代码重构
test:     添加测试
chore:    其他修改
```

## 🔧 核心模块开发

### 1. Go 后端服务开发

#### 项目结构

```
server/
├── main.go              # 主入口
├── cmd/                 # 命令行工具
├── database/            # 数据库连接
├── global/              # 全局变量
├── middleware/          # 中间件
├── migrations/          # 数据库迁移
├── pkg/                 # 工具包
└── routes/             # 路由处理
```

#### 主入口文件

```go
// server/main.go
package main

import (
    "fmt"
    "os"
    "asset-management-system/server/cmd"
)

func main() {
    if err := cmd.Execute(); err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
}
```

#### 资产管理 API

```go
// server/routes/api/assets/routes.go
package assets

import (
    "net/http"
    "strconv"
    "asset-management-system/server/global"
    "github.com/gin-gonic/gin"
)

type Asset struct {
    ID          uint   `json:"id" gorm:"primaryKey"`
    AssetNo     string `json:"asset_no" gorm:"uniqueIndex;not null"`
    Name        string `json:"name" gorm:"not null"`
    CategoryID  uint   `json:"category_id"`
    Status      string `json:"status" gorm:"default:available"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

func GetAssets(c *gin.Context) {
    var assets []Asset
    if err := global.DB.Find(&assets).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, assets)
}

func CreateAsset(c *gin.Context) {
    var asset Asset
    if err := c.ShouldBindJSON(&asset); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if err := global.DB.Create(&asset).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, asset)
}
```

### 2. 前端组件开发

#### 资产管理页面

```typescript
// app/assets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Asset } from '@/lib/types'
import { assetsApi } from '@/lib/api'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const data = await assetsApi.list()
      setAssets(data)
    } catch (error) {
      console.error('加载资产失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">加载中...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">资产管理</h1>
        <Button onClick={() => router.push('/assets/new')}>
          新增资产
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="cursor-pointer hover:shadow-lg">
            <CardHeader>
              <CardTitle>{asset.name}</CardTitle>
              <CardDescription>编号: {asset.asset_no}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  状态: {asset.status}
                </div>
                <div className="text-sm text-gray-600">
                  分类: {asset.category_name}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

#### 资产表单组件

```typescript
// components/assets/AssetForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AssetFormData {
  name: string
  asset_no: string
  category_id: number
  brand?: string
  model?: string
  description?: string
}

interface AssetFormProps {
  onSubmit: (data: AssetFormData) => void
  onCancel: () => void
  initialData?: Partial<AssetFormData>
}

export default function AssetForm({ onSubmit, onCancel, initialData }: AssetFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<AssetFormData>({
    defaultValues: initialData
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">资产名称</Label>
        <Input
          id="name"
          {...register('name', { required: '资产名称不能为空' })}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="asset_no">资产编号</Label>
        <Input
          id="asset_no"
          {...register('asset_no', { required: '资产编号不能为空' })}
        />
        {errors.asset_no && <p className="text-red-500 text-sm">{errors.asset_no.message}</p>}
      </div>

      <div>
        <Label htmlFor="brand">品牌</Label>
        <Input id="brand" {...register('brand')} />
      </div>

      <div>
        <Label htmlFor="model">型号</Label>
        <Input id="model" {...register('model')} />
      </div>

      <div>
        <Label htmlFor="description">描述</Label>
        <Textarea id="description" {...register('description')} />
      </div>

      <div className="flex space-x-2">
        <Button type="submit">保存</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  )
}
```

## 🧪 测试指南

### Go 后端测试

```go
// server/routes/api/assets/routes_test.go
package assets

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestCreateAsset(t *testing.T) {
    gin.SetMode(gin.TestMode)
    r := gin.Default()
    r.POST("/assets", CreateAsset)

    asset := Asset{
        Name:    "测试资产",
        AssetNo: "TEST001",
        Status:  "available",
    }

    jsonData, _ := json.Marshal(asset)
    req, _ := http.NewRequest("POST", "/assets", bytes.NewBuffer(jsonData))
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)

    assert.Equal(t, 201, w.Code)

    var response Asset
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Equal(t, "测试资产", response.Name)
}
```

### 前端测试

```typescript
// __tests__/assets/AssetForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import AssetForm from '@/components/assets/AssetForm'

describe('AssetForm', () => {
  it('应该正确提交表单数据', () => {
    const mockSubmit = jest.fn()
    const mockCancel = jest.fn()

    render(<AssetForm onSubmit={mockSubmit} onCancel={mockCancel} />)

    fireEvent.change(screen.getByLabelText('资产名称'), {
      target: { value: '测试资产' }
    })
    fireEvent.change(screen.getByLabelText('资产编号'), {
      target: { value: 'TEST001' }
    })

    fireEvent.click(screen.getByText('保存'))

    expect(mockSubmit).toHaveBeenCalledWith({
      name: '测试资产',
      asset_no: 'TEST001'
    })
  })
})
```

## 📖 API 文档

### 资产管理 API

#### 获取资产列表

```http
GET /api/assets
```

#### 创建资产

```http
POST /api/assets
Content-Type: application/json

{
  "name": "笔记本电脑",
  "asset_no": "NB001",
  "category_id": 1,
  "brand": "Dell",
  "model": "Latitude 5520"
}
```

#### 更新资产

```http
PUT /api/assets/:id
Content-Type: application/json

{
  "name": "笔记本电脑",
  "status": "maintenance"
}
```

### 借用管理 API

#### 创建借用记录

```http
POST /api/borrow-records
Content-Type: application/json

{
  "asset_id": 1,
  "borrower_name": "张三",
  "borrower_contact": "13800138000",
  "expected_return_date": "2024-02-01T00:00:00Z"
}
```

## 🚀 部署指南

### 开发环境

```bash
# 启动前端
npm run dev

# 启动后端
cd server
go run main.go
```

### 生产环境

```bash
# 构建前端
npm run build

# 构建后端
cd server
go build -o asset-management

# 启动服务
./asset-management
```

### Docker 部署

```dockerfile
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM golang:1.21-alpine AS backend
WORKDIR /app
COPY server/ .
RUN go build -o asset-management

FROM alpine:latest
WORKDIR /root/
COPY --from=backend /app/asset-management .
COPY --from=frontend /app/.next ./.next
CMD ["./asset-management"]
```

这个开发指南为团队提供了完整的开发环境设置、代码规范、核心模块实现和测试部署等指导，确保资产管理系统能够高效、规范地进行开发。
