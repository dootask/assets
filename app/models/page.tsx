'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/contexts/app-context';
import { MockDataManager } from '@/lib/mock-data';
import { AIModelConfig } from '@/lib/types';
import { Activity, CheckCircle, Cpu, Edit, Eye, Key, MoreHorizontal, Plus, Settings, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ModelsPage() {
  const { Confirm } = useAppContext();
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadModels = () => {
    setIsLoading(true);
    setTimeout(() => {
      MockDataManager.initializeData();
      const settings = MockDataManager.getSystemSettings();
      setModels(settings.aiModels);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleToggleActive = (modelId: string, isActive: boolean) => {
    const updatedModel = MockDataManager.updateAIModel(modelId, { isActive });
    if (updatedModel) {
      setModels(prevModels => prevModels.map(model => (model.id === modelId ? updatedModel : model)));
      toast.success(isActive ? '模型已启用' : '模型已停用');
    }
  };

  const handleSetDefault = (modelId: string) => {
    const updatedModel = MockDataManager.updateAIModel(modelId, { isDefault: true });
    if (updatedModel) {
      // 重新加载所有模型以确保只有一个默认模型
      const settings = MockDataManager.getSystemSettings();
      setModels(settings.aiModels);
      toast.success('已设为默认模型');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (
      await Confirm({
        title: '确认删除AI模型',
        message: '此操作将永久删除该AI模型配置。此操作无法撤销。',
        variant: 'destructive',
      })
    ) {
      const success = MockDataManager.removeAIModel(modelId);
      if (success) {
        setModels(prevModels => prevModels.filter(model => model.id !== modelId));
        toast.success('模型已删除');
      }
    }
  };

  const getProviderInfo = (provider: string) => {
    const providerMap = {
      openai: { name: 'ChatGPT (OpenAI)', color: 'bg-green-100 text-green-800' },
      anthropic: { name: 'Claude (Anthropic)', color: 'bg-orange-100 text-orange-800' },
      deepseek: { name: 'DeepSeek', color: 'bg-purple-100 text-purple-800' },
      google: { name: 'Gemini (Google)', color: 'bg-blue-100 text-blue-800' },
      xai: { name: 'Grok (xAI)', color: 'bg-gray-100 text-gray-800' },
      ollama: { name: 'Ollama (本地)', color: 'bg-indigo-100 text-indigo-800' },
      zhipuai: { name: '智谱清言', color: 'bg-cyan-100 text-cyan-800' },
      qwen: { name: '通义千问', color: 'bg-red-100 text-red-800' },
      wenxin: { name: '文心一言', color: 'bg-yellow-100 text-yellow-800' },
    };
    return providerMap[provider as keyof typeof providerMap] || { name: provider, color: 'bg-gray-100 text-gray-800' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI 模型管理</h1>
            <p className="text-muted-foreground">管理和配置 AI 模型</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-5 w-32 animate-pulse rounded"></div>
                <div className="bg-muted h-4 w-48 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted h-4 w-24 animate-pulse rounded"></div>
                  <div className="bg-muted h-3 w-36 animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI 模型管理</h1>
          <p className="text-muted-foreground">管理和配置 AI 模型</p>
        </div>
        <Button asChild>
          <Link href="/models/create">
            <Plus className="mr-2 h-4 w-4" />
            添加模型
          </Link>
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模型总数</CardTitle>
            <Cpu className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.length}</div>
            <p className="text-muted-foreground text-xs">已配置模型</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃模型</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.filter(m => m.isActive).length}</div>
            <p className="text-muted-foreground text-xs">已启用模型</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">默认模型</CardTitle>
            <Star className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.find(m => m.isDefault)?.displayName || '未设置'}</div>
            <p className="text-muted-foreground text-xs">当前默认</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">状态</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">正常</div>
            <p className="text-muted-foreground text-xs">所有模型运行正常</p>
          </CardContent>
        </Card>
      </div>

      {/* 模型列表 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models.map(model => {
          const providerInfo = getProviderInfo(model.provider);

          return (
            <Card
              key={model.id}
              className={`transition-all ${model.isActive ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' : 'opacity-75'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${model.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                      <Cpu
                        className={`h-5 w-5 ${model.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {model.displayName}
                        {model.isDefault && <Star className="h-4 w-4 fill-current text-yellow-500" />}
                      </CardTitle>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="default" className={providerInfo.color}>
                          {providerInfo.name}
                        </Badge>
                        {model.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            启用
                          </Badge>
                        ) : (
                          <Badge variant="secondary">禁用</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/models/${model.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/models/${model.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑配置
                        </Link>
                      </DropdownMenuItem>
                      {!model.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(model.id)}>
                          <Star className="mr-2 h-4 w-4" />
                          设为默认
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDeleteModel(model.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="mt-2 text-sm">
                  模型：{model.name} | 最大Token：{model.maxTokens}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* 启用/禁用开关 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">状态</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${model.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {model.isActive ? '运行中' : '已停用'}
                    </span>
                    <Switch
                      checked={model.isActive}
                      onCheckedChange={checked => handleToggleActive(model.id, checked)}
                    />
                  </div>
                </div>

                {/* API配置信息 */}
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">API配置</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="text-muted-foreground h-3 w-3" />
                    <span>密钥：{model.apiKey ? '已配置' : '未配置'}</span>
                  </div>
                  {model.baseUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <Settings className="text-muted-foreground h-3 w-3" />
                      <span className="truncate">自定义API地址</span>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/models/${model.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      查看
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/models/${model.id}/edit`}>
                      <Edit className="mr-1 h-3 w-3" />
                      编辑
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {models.length === 0 && (
        <Card className="p-12 text-center">
          <Cpu className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">还没有AI模型</h3>
          <p className="text-muted-foreground mb-4">添加您的第一个AI模型来开始使用</p>
          <Button asChild>
            <Link href="/models/create">
              <Plus className="mr-2 h-4 w-4" />
              添加模型
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
