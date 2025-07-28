# 企业固定资产管理系统 - API 文档

## 📋 API 概览

本文档描述了企业固定资产管理系统的 RESTful API 接口。

### 基础信息

- **Base URL**: `http://localhost:8000`
- **API 版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": { ... }
}
```

### 错误响应格式

```json
{
  "code": "ERROR_CODE",
  "message": "错误描述",
  "data": null
}
```

## 🏥 健康检查

### GET /health

检查服务器健康状态

**响应示例**:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "asset-management-server",
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

## 📦 资产管理 API

### GET /api/assets

获取资产列表

**查询参数**:

- `page` (int): 页码，默认 1
- `limit` (int): 每页数量，默认 20
- `search` (string): 搜索关键词
- `category_id` (int): 分类ID
- `department_id` (int): 部门ID
- `status` (string): 资产状态

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": 1,
        "asset_no": "A001",
        "name": "联想笔记本电脑",
        "category_id": 1,
        "category_name": "电脑设备",
        "department_id": 1,
        "department_name": "技术部",
        "brand": "联想",
        "model": "ThinkPad X1",
        "serial_number": "SN123456",
        "purchase_date": "2024-01-01",
        "purchase_price": 8000.0,
        "status": "available",
        "location": "办公室A-101",
        "responsible_person": "张三",
        "image_url": "/uploads/assets/1.jpg",
        "created_at": "2024-01-01T12:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### POST /api/assets

创建新资产

**请求体**:

```json
{
  "name": "联想笔记本电脑",
  "category_id": 1,
  "department_id": 1,
  "brand": "联想",
  "model": "ThinkPad X1",
  "serial_number": "SN123456",
  "purchase_date": "2024-01-01",
  "purchase_price": 8000.0,
  "supplier": "联想官方",
  "warranty_period": 36,
  "location": "办公室A-101",
  "responsible_person": "张三",
  "description": "技术部使用的笔记本电脑"
}
```

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "创建成功",
  "data": {
    "id": 1,
    "asset_no": "A001",
    "name": "联想笔记本电脑"
    // ... 其他字段
  }
}
```

### GET /api/assets/:id

获取资产详情

**路径参数**:

- `id` (int): 资产ID

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "id": 1,
    "asset_no": "A001",
    "name": "联想笔记本电脑",
    // ... 完整资产信息
    "borrow_records": [
      {
        "id": 1,
        "borrower_name": "李四",
        "borrow_date": "2024-01-15T09:00:00Z",
        "expected_return_date": "2024-01-30T18:00:00Z",
        "status": "borrowed"
      }
    ]
  }
}
```

### PUT /api/assets/:id

更新资产信息

**路径参数**:

- `id` (int): 资产ID

**请求体**: 与创建资产相同

### DELETE /api/assets/:id

删除资产

**路径参数**:

- `id` (int): 资产ID

## 🏷️ 分类管理 API

### GET /api/categories

获取分类树

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "电子设备",
      "code": "ELECTRONICS",
      "parent_id": null,
      "description": "各类电子设备",
      "children": [
        {
          "id": 2,
          "name": "电脑设备",
          "code": "COMPUTERS",
          "parent_id": 1,
          "description": "台式机、笔记本等",
          "children": []
        }
      ]
    }
  ]
}
```

### POST /api/categories

创建分类

**请求体**:

```json
{
  "name": "电脑设备",
  "code": "COMPUTERS",
  "parent_id": 1,
  "description": "台式机、笔记本等",
  "attributes": {
    "cpu": "处理器",
    "memory": "内存",
    "storage": "存储"
  }
}
```

## 🏢 部门管理 API

### GET /api/departments

获取部门列表

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "技术部",
      "code": "TECH",
      "manager": "张经理",
      "contact": "13800138000",
      "description": "负责技术开发",
      "asset_count": 25,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/departments

创建部门

**请求体**:

```json
{
  "name": "技术部",
  "code": "TECH",
  "manager": "张经理",
  "contact": "13800138000",
  "description": "负责技术开发"
}
```

## 📋 借用管理 API

### GET /api/borrow-records

获取借用记录

**查询参数**:

- `page` (int): 页码
- `limit` (int): 每页数量
- `status` (string): 借用状态 (borrowed, returned, overdue)
- `borrower_name` (string): 借用人姓名
- `asset_id` (int): 资产ID

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": 1,
        "asset_id": 1,
        "asset_name": "联想笔记本电脑",
        "asset_no": "A001",
        "borrower_name": "李四",
        "borrower_contact": "13900139000",
        "department_name": "市场部",
        "borrow_date": "2024-01-15T09:00:00Z",
        "expected_return_date": "2024-01-30T18:00:00Z",
        "actual_return_date": null,
        "status": "borrowed",
        "purpose": "出差使用",
        "is_overdue": false,
        "overdue_days": 0
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### POST /api/borrow-records

创建借用记录

**请求体**:

```json
{
  "asset_id": 1,
  "borrower_name": "李四",
  "borrower_contact": "13900139000",
  "department_id": 2,
  "expected_return_date": "2024-01-30T18:00:00Z",
  "purpose": "出差使用",
  "notes": "需要安装特定软件"
}
```

### PUT /api/borrow-records/:id/return

归还资产

**路径参数**:

- `id` (int): 借用记录ID

**请求体**:

```json
{
  "notes": "设备状态良好"
}
```

### GET /api/borrow-records/overdue

获取超期记录

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "asset_name": "联想笔记本电脑",
      "borrower_name": "李四",
      "expected_return_date": "2024-01-30T18:00:00Z",
      "overdue_days": 5,
      "borrower_contact": "13900139000"
    }
  ]
}
```

## 📊 盘点管理 API

### GET /api/inventory-tasks

获取盘点任务列表

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "task_name": "2024年第一季度盘点",
      "task_type": "full",
      "status": "in_progress",
      "start_date": "2024-01-01T09:00:00Z",
      "end_date": null,
      "created_by": "管理员",
      "total_assets": 100,
      "checked_assets": 75,
      "progress": 75.0
    }
  ]
}
```

### POST /api/inventory-tasks

创建盘点任务

**请求体**:

```json
{
  "task_name": "2024年第一季度盘点",
  "task_type": "full",
  "scope_filter": {
    "category_ids": [1, 2],
    "department_ids": [1]
  },
  "notes": "重点检查电子设备"
}
```

### POST /api/inventory-records

提交盘点记录

**请求体**:

```json
{
  "task_id": 1,
  "asset_id": 1,
  "actual_status": "available",
  "result": "normal",
  "notes": "设备状态良好",
  "checked_by": "张三"
}
```

## 📈 报表统计 API

### GET /api/reports/dashboard

获取仪表板数据

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "summary": {
      "total_assets": 500,
      "available_assets": 450,
      "borrowed_assets": 30,
      "maintenance_assets": 15,
      "scrapped_assets": 5
    },
    "recent_activities": [
      {
        "type": "asset_created",
        "description": "新增资产：联想笔记本电脑",
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ],
    "charts": {
      "asset_by_category": [
        { "name": "电脑设备", "value": 200 },
        { "name": "办公设备", "value": 150 }
      ],
      "asset_by_status": [
        { "name": "可用", "value": 450 },
        { "name": "借用中", "value": 30 }
      ]
    }
  }
}
```

### GET /api/reports/assets

获取资产统计报表

**查询参数**:

- `start_date` (string): 开始日期
- `end_date` (string): 结束日期
- `group_by` (string): 分组方式 (category, department, status)

### GET /api/reports/borrow

获取借用统计报表

### GET /api/reports/inventory

获取盘点统计报表

## 📁 文件上传 API

### POST /api/upload

上传文件

**请求**: multipart/form-data

- `file`: 文件内容
- `type`: 文件类型 (asset_image, document)

**响应示例**:

```json
{
  "code": "SUCCESS",
  "message": "上传成功",
  "data": {
    "filename": "asset_1_20240101120000.jpg",
    "url": "/uploads/assets/asset_1_20240101120000.jpg",
    "size": 1024000,
    "mime_type": "image/jpeg"
  }
}
```

## 🚨 错误码说明

| 错误码                | 描述                   |
| --------------------- | ---------------------- |
| SUCCESS               | 操作成功               |
| INTERNAL_ERROR        | 内部服务器错误         |
| VALIDATION_ERROR      | 数据验证失败           |
| NOT_FOUND             | 资源不存在             |
| ASSET_NOT_FOUND       | 资产不存在             |
| ASSET_NO_EXISTS       | 资产编号已存在         |
| ASSET_IN_USE          | 资产正在使用中         |
| CATEGORY_NOT_FOUND    | 分类不存在             |
| CATEGORY_HAS_ASSETS   | 分类下有资产，无法删除 |
| DEPARTMENT_NOT_FOUND  | 部门不存在             |
| DEPARTMENT_HAS_ASSETS | 部门下有资产，无法删除 |
| ASSET_NOT_AVAILABLE   | 资产不可借用           |
| BORROW_NOT_FOUND      | 借用记录不存在         |
| ALREADY_RETURNED      | 资产已归还             |

## 📝 使用示例

### JavaScript/TypeScript

```typescript
// 获取资产列表
const response = await fetch('/api/assets?page=1&limit=20');
const data = await response.json();

// 创建资产
const asset = {
  name: '联想笔记本电脑',
  category_id: 1,
  department_id: 1,
  // ... 其他字段
};

const response = await fetch('/api/assets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(asset),
});
```

### cURL

```bash
# 获取资产列表
curl -X GET "http://localhost:8000/api/assets?page=1&limit=20"

# 创建资产
curl -X POST "http://localhost:8000/api/assets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "联想笔记本电脑",
    "category_id": 1,
    "department_id": 1
  }'
```

---

更多详细信息请参考源码中的路由处理器实现。
