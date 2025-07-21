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
import { MockDataManager } from '@/lib/mock-data';
import { AIModelConfig } from '@/lib/types';
import { Cpu, Edit, Key, Settings, Star, Trash2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [model, setModel] = useState<AIModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // 模拟获取模型详情
    const modelId = params.id as string;
    const modelData = MockDataManager.getAIModels().find(m => m.id === modelId);

    if (modelData) {
      setModel(modelData);
    }
    setLoading(false);
  }, [params.id]);

  const handleDelete = () => {
    if (confirm('确定要删除这个AI模型吗？此操作不可撤销。')) {
      MockDataManager.deleteAIModel(params.id as string);
      toast.success('AI模型删除成功');
      router.push('/models');
    }
  };

  const handleToggleStatus = async () => {
    if (!model) return;

    const newStatus = !model.isActive;
    setModel(prev => (prev ? { ...prev, isActive: newStatus } : null));

    // 模拟API调用
    setTimeout(() => {
      toast.success(`模型已${newStatus ? '启用' : '停用'}`);
    }, 500);
  };

  const handleToggleDefault = async () => {
    if (!model) return;

    const newDefault = !model.isDefault;
    setModel(prev => (prev ? { ...prev, isDefault: newDefault } : null));

    // 模拟API调用
    setTimeout(() => {
      toast.success(`${newDefault ? '已设为默认模型' : '已取消默认模型'}`);
    }, 500);
  };

  const testConnection = async () => {
    if (!model) return;

    setTesting(true);
    // 模拟连接测试
    setTimeout(() => {
      toast.success('连接测试成功！');
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

  if (!model) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Cpu className="text-muted-foreground mb-4 h-16 w-16" />
        <h2 className="mb-2 text-xl font-semibold">AI模型不存在</h2>
        <p className="text-muted-foreground mb-4">请检查 URL 是否正确</p>
        <Button asChild>
          <Link href="/models">返回列表</Link>
        </Button>
      </div>
    );
  }

  // 提供商信息映射
  const providerInfo = {
    openai: { name: 'ChatGPT (OpenAI)', color: 'bg-green-500' },
    anthropic: { name: 'Claude (Anthropic)', color: 'bg-orange-500' },
    deepseek: { name: 'DeepSeek', color: 'bg-blue-500' },
    google: { name: 'Gemini (Google)', color: 'bg-red-500' },
    xai: { name: 'Grok (xAI)', color: 'bg-gray-700' },
    ollama: { name: 'Ollama (本地)', color: 'bg-purple-500' },
    zhipuai: { name: '智谱清言', color: 'bg-indigo-500' },
    qwen: { name: '通义千问', color: 'bg-yellow-500' },
    wenxin: { name: '文心一言', color: 'bg-cyan-500' },
  };

  const currentProvider = providerInfo[model.provider as keyof typeof providerInfo] || {
    name: model.provider,
    color: 'bg-gray-500',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/models">AI 模型管理</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{model.displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full ${currentProvider.color} flex items-center justify-center`}>
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{model.displayName}</h1>
            <Badge variant={model.isActive ? 'default' : 'secondary'}>{model.isActive ? '活跃' : '停用'}</Badge>
            {model.isDefault && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                <Star className="mr-1 h-3 w-3" />
                默认
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">模型名称：{model.name}</p>
          <p className="text-muted-foreground">提供商：{currentProvider.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={testConnection} disabled={testing}>
            {testing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                测试中...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                测试连接
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/models/${model.id}/edit`}>
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
                <Cpu className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">显示名称</h4>
                  <p className="text-sm">{model.displayName}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">模型名称</h4>
                  <p className="font-mono text-sm">{model.name}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">AI 提供商</h4>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${currentProvider.color}`}></div>
                    <p className="text-sm">{currentProvider.name}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">最大 Token 数</h4>
                  <p className="text-sm">{model.maxTokens.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">创建时间</h4>
                  <p className="text-sm">{new Date(model.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">更新时间</h4>
                  <p className="text-sm">{new Date(model.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API 配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API 配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">API 基础地址</h4>
                  <p className="font-mono text-sm break-all">{model.baseUrl || '使用默认地址'}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">API 密钥</h4>
                  <div className="flex items-center gap-2">
                    <Key className="text-muted-foreground h-4 w-4" />
                    <p className="font-mono text-sm">
                      {model.apiKey ? '••••••••••••' + model.apiKey.slice(-4) : '未配置'}
                    </p>
                  </div>
                </div>
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
                  <p className="text-muted-foreground text-xs">控制模型是否可用</p>
                </div>
                <Switch checked={model.isActive} onCheckedChange={handleToggleStatus} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">默认模型</h4>
                  <p className="text-muted-foreground text-xs">新建智能体时默认选择</p>
                </div>
                <Switch checked={model.isDefault} onCheckedChange={handleToggleDefault} />
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
                <span className="text-muted-foreground text-sm">关联智能体</span>
                <span className="text-sm font-medium">{model.agentCount || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">总对话数</span>
                <span className="text-sm font-medium">{model.conversationCount || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Token 使用量</span>
                <span className="text-sm font-medium">{(model.tokenUsage || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">最后使用</span>
                <span className="text-sm font-medium">
                  {model.lastUsedAt ? new Date(model.lastUsedAt).toLocaleDateString() : '从未使用'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 性能指标 */}
          <Card>
            <CardHeader>
              <CardTitle>性能指标</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">平均响应时间</span>
                <span className="text-sm font-medium">{model.avgResponseTime || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">成功率</span>
                <span className="text-sm font-medium">{model.successRate || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">错误次数</span>
                <span className="text-sm font-medium">{model.errorCount || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* 配置指南 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">配置提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>定期检查 API 配额和使用情况</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>监控错误率和响应时间</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>适时更新 API 密钥</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>根据使用情况调整 Token 限制</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
