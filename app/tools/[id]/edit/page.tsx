'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MockDataManager } from '@/lib/mock-data';
import { CreateMCPToolRequest } from '@/lib/types';
import { ExternalLink, Key, Save, Settings, Shield, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FormData extends CreateMCPToolRequest {
  apiKey?: string;
  baseUrl?: string;
}

export default function EditMCPToolPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: 'external',
    type: 'external',
    config: {},
    permissions: ['read'],
    apiKey: '',
    baseUrl: '',
  });

  // 工具类别选项
  const categoryOptions = [
    { value: 'dootask', label: 'DooTask', description: 'DooTask 内部功能' },
    { value: 'external', label: '外部工具', description: '第三方服务和 API' },
    { value: 'custom', label: '自定义', description: '用户自定义工具' },
  ];

  // 类型选项
  const typeOptions = [
    { value: 'internal', label: '内部', description: '系统内部工具' },
    { value: 'external', label: '外部', description: '外部 API 服务' },
  ];

  // 权限选项
  const permissionOptions = [
    { value: 'read', label: '读取', description: '只能读取数据' },
    { value: 'write', label: '写入', description: '可以修改和创建数据' },
    { value: 'execute', label: '执行', description: '可以执行操作' },
    { value: 'admin', label: '管理员', description: '完全访问权限' },
  ];

  useEffect(() => {
    // 获取要编辑的工具数据
    const toolId = params.id as string;
    const tool = MockDataManager.getMCPTools().find(t => t.id === toolId);

    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description,
        category: tool.category,
        type: tool.type,
        config: tool.config || {},
        permissions: tool.permissions || ['read'],
        apiKey: ((tool.config as Record<string, unknown>)?.apiKey as string) || '',
        baseUrl: ((tool.config as Record<string, unknown>)?.baseUrl as string) || '',
      });
    }
    setLoading(false);
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (!formData.permissions || formData.permissions.length === 0) {
      toast.error('请至少选择一个权限');
      return;
    }

    setIsLoading(true);

    try {
      // 构建配置对象
      const config: Record<string, unknown> = {};
      if (formData.type === 'external' && formData.baseUrl) {
        config.baseUrl = formData.baseUrl;
      }
      if (formData.apiKey) {
        config.apiKey = formData.apiKey;
      }

      // 更新工具请求
      const toolRequest: CreateMCPToolRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        config,
        permissions: formData.permissions,
      };

      // 模拟更新API调用
      setTimeout(() => {
        MockDataManager.updateMCPTool(params.id as string, toolRequest);
        toast.success(`MCP 工具 "${formData.name}" 更新成功！`);
        router.push('/tools');
      }, 1000);
    } catch {
      toast.error('更新 MCP 工具失败');
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked ? [...prev.permissions!, permission] : prev.permissions!.filter(p => p !== permission),
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/tools">MCP 工具管理</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>编辑工具</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑 MCP 工具</h1>
          <p className="text-muted-foreground">修改 MCP 工具的配置和设置</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/tools">取消</Link>
          </Button>
          <Button type="submit" form="tool-form" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                更新中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存更改
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧主要内容 */}
        <div className="lg:col-span-2">
          <form id="tool-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>MCP 工具的基本配置信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">工具名称 *</Label>
                    <Input
                      id="name"
                      placeholder="例如：天气查询"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">工具类别 *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: 'dootask' | 'external' | 'custom') =>
                        setFormData(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择工具类别" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="flex-col items-start p-2">
                            {option.label}
                            <div className="text-muted-foreground mt-1 max-w-[180px] text-xs leading-tight">
                              {option.description}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">工具类型 *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'internal' | 'external') =>
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择工具类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="flex-col items-start p-2">
                            {option.label}
                            <div className="text-muted-foreground mt-1 max-w-[160px] text-xs leading-tight">
                              {option.description}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">工具描述 *</Label>
                  <Textarea
                    id="description"
                    placeholder="描述工具的功能和用途..."
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                  <p className="text-muted-foreground text-xs">详细描述有助于智能体正确选择和使用工具</p>
                </div>
              </CardContent>
            </Card>

            {/* 配置信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  配置信息
                </CardTitle>
                <CardDescription>配置工具的连接参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.type === 'external' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      API 基础 URL
                    </Label>
                    <Input
                      placeholder="https://api.example.com/v1"
                      value={formData.baseUrl}
                      onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    />
                    <p className="text-muted-foreground text-xs">外部 API 服务的基础地址</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key / 访问令牌
                  </Label>
                  <Input
                    type="password"
                    placeholder="sk-... 或其他访问令牌"
                    value={formData.apiKey}
                    onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <p className="text-muted-foreground text-xs">用于访问 API 的密钥或令牌</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500"></div>
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">安全提示</p>
                      <p className="mt-1 text-amber-800">
                        API 密钥将被安全加密存储。请确保使用具有适当权限的专用 API 密钥。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* 右侧配置 */}
        <div className="space-y-6">
          {/* 权限设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                权限设置
              </CardTitle>
              <CardDescription>设置工具的访问权限</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {permissionOptions.map(permission => (
                  <div key={permission.value} className="flex items-start space-x-3 rounded-lg border p-3">
                    <Checkbox
                      id={`permission-${permission.value}`}
                      checked={formData.permissions?.includes(permission.value) || false}
                      onCheckedChange={(checked: boolean) => handlePermissionToggle(permission.value, checked)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={`permission-${permission.value}`} className="text-sm font-medium">
                        {permission.label}
                      </Label>
                      <p className="text-muted-foreground mt-1 text-xs">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">权限说明</p>
                    <p className="mt-1 text-blue-800">权限控制智能体可以对工具执行的操作类型。建议遵循最小权限原则。</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 编辑注意事项 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">编辑注意事项</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>更改工具配置可能影响正在使用的智能体</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>建议先测试工具连接后再保存</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>权限变更会立即生效</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>删除权限前确认智能体使用情况</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
