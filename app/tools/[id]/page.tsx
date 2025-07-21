'use client';

import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/contexts/app-context';
import { MockDataManager } from '@/lib/mock-data';
import { safeString } from '@/lib/utils';
import { MCPTool } from '@/lib/types';
import { Edit, ExternalLink, Key, Settings, Shield, Trash2, Wrench, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function MCPToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { Confirm } = useAppContext();
  const [tool, setTool] = useState<MCPTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // 模拟获取工具详情
    const toolId = params.id as string;
    const toolData = MockDataManager.getMCPTools().find(t => t.id === toolId);

    if (toolData) {
      setTool(toolData);
    }
    setLoading(false);
  }, [params.id]);

  const handleDelete = async () => {
    if (
      await Confirm({
        title: '确定要删除这个MCP工具吗？',
        message: '此操作不可撤销。',
        variant: 'destructive',
      })
    ) {
      // MockDataManager.deleteMCPTool(params.id as string);
      toast.success('MCP工具删除成功');
      router.push('/tools');
    }
  };

  const handleToggleStatus = async () => {
    if (!tool) return;

    const newStatus = !tool.isActive;
    setTool(prev => (prev ? { ...prev, isActive: newStatus } : null));

    // 模拟API调用
    setTimeout(() => {
      toast.success(`工具已${newStatus ? '启用' : '停用'}`);
    }, 500);
  };

  const testTool = async () => {
    if (!tool) return;

    setTesting(true);
    // 模拟工具测试
    setTimeout(() => {
      toast.success('工具测试成功！');
      setTesting(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Wrench className="text-muted-foreground mb-4 h-16 w-16" />
        <h2 className="mb-2 text-xl font-semibold">MCP工具不存在</h2>
        <p className="text-muted-foreground mb-4">请检查 URL 是否正确</p>
        <Button asChild>
          <Link href="/tools">返回列表</Link>
        </Button>
      </div>
    );
  }

  // 类别信息映射
  const categoryInfo = {
    dootask: { name: 'DooTask', color: 'bg-blue-500' },
    external: { name: '外部工具', color: 'bg-green-500' },
    custom: { name: '自定义', color: 'bg-purple-500' },
  };

  const currentCategory = categoryInfo[tool.category as keyof typeof categoryInfo] || {
    name: tool.category,
    color: 'bg-gray-500',
  };

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
            <BreadcrumbPage>{tool.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full ${currentCategory.color} flex items-center justify-center`}>
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
            <Badge variant={tool.isActive ? 'default' : 'secondary'}>{tool.isActive ? '活跃' : '停用'}</Badge>
            <Badge variant="outline" className="text-xs">
              {currentCategory.name}
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{tool.description}</p>
          <p className="text-muted-foreground">类型：{tool.type === 'internal' ? '内部工具' : '外部工具'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={testTool} disabled={testing}>
            {testing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                测试中...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                测试工具
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/tools/${tool.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧主要信息 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">工具名称</h4>
                  <p className="text-sm">{tool.name}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">工具类别</h4>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${currentCategory.color}`}></div>
                    <p className="text-sm">{currentCategory.name}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">工具类型</h4>
                  <p className="text-sm">{tool.type === 'internal' ? '内部工具' : '外部工具'}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">状态</h4>
                  <Badge variant={tool.isActive ? 'default' : 'secondary'}>{tool.isActive ? '活跃' : '停用'}</Badge>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">创建时间</h4>
                  <p className="text-sm">{new Date(tool.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">更新时间</h4>
                  <p className="text-sm">{new Date(tool.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <h4 className="text-muted-foreground mb-2 text-sm font-medium">描述</h4>
                <p className="text-sm leading-relaxed">{tool.description}</p>
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
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.type === 'external' && Boolean(tool.config.baseUrl) && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">API 基础地址</h4>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="text-muted-foreground h-4 w-4" />
                    <p className="font-mono text-sm break-all">{safeString(tool.config.baseUrl)}</p>
                  </div>
                </div>
              )}
              {Boolean(tool.config.apiKey) && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">API 密钥</h4>
                  <div className="flex items-center gap-2">
                    <Key className="text-muted-foreground h-4 w-4" />
                    <p className="font-mono text-sm">{'••••••••••••' + safeString(tool.config.apiKey).slice(-4)}</p>
                  </div>
                </div>
              )}
              {Boolean(tool.config.endpoint) && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">API 端点</h4>
                  <p className="font-mono text-sm">{safeString(tool.config.endpoint)}</p>
                </div>
              )}
              {Object.keys(tool.config).length === 0 && <p className="text-muted-foreground text-sm">暂无配置信息</p>}
            </CardContent>
          </Card>

          {/* 权限设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                权限设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tool.permissions.map(permission => (
                  <Badge key={permission} variant="outline">
                    {permission === 'read'
                      ? '读取'
                      : permission === 'write'
                        ? '写入'
                        : permission === 'execute'
                          ? '执行'
                          : permission === 'admin'
                            ? '管理员'
                            : permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧状态和设置 */}
        <div className="space-y-6">
          {/* 状态控制 */}
          <Card>
            <CardHeader>
              <CardTitle>状态控制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">启用状态</h4>
                  <p className="text-muted-foreground text-xs">控制工具是否可用</p>
                </div>
                <Switch checked={tool.isActive} onCheckedChange={handleToggleStatus} />
              </div>
            </CardContent>
          </Card>

          {/* 使用统计 */}
          <Card>
            <CardHeader>
              <CardTitle>使用统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">总调用次数</span>
                <span className="text-sm font-medium">{tool.statistics?.totalCalls || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">今日调用次数</span>
                <span className="text-sm font-medium">{tool.statistics?.todayCalls || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">平均响应时间</span>
                <span className="text-sm font-medium">{tool.statistics?.averageResponseTime || 0}s</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">成功率</span>
                <span className="text-sm font-medium">
                  {tool.statistics?.successRate ? `${(tool.statistics.successRate * 100).toFixed(1)}%` : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 关联智能体 */}
          <Card>
            <CardHeader>
              <CardTitle>关联智能体</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MockDataManager.getAgents()
                  .filter(agent => agent.tools?.includes(tool.id))
                  .map(agent => (
                    <div key={agent.id} className="flex items-center justify-between rounded border p-2">
                      <span className="text-sm">{agent.name}</span>
                      <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-xs">
                        {agent.isActive ? '活跃' : '停用'}
                      </Badge>
                    </div>
                  ))}
                {MockDataManager.getAgents().filter(agent => agent.tools?.includes(tool.id)).length === 0 && (
                  <p className="text-muted-foreground py-4 text-center text-sm">暂无关联的智能体</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 配置指南 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">使用指南</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>定期检查工具的调用统计和成功率</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>监控工具的响应时间和错误情况</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>根据需要调整工具权限设置</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>测试工具连接以确保正常运行</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
