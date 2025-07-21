'use client';

import { CommandSelect, CommandSelectOption } from '@/components/command-select';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MockDataManager } from '@/lib/mock-data';
import { AIModelConfig } from '@/lib/types';
import { Cpu, Key, Save, Settings, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditModelPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Omit<AIModelConfig, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    displayName: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    maxTokens: 4000,
    isDefault: false,
    isActive: true,
  });

  // AI提供商配置
  const providerOptions = [
    {
      value: 'openai',
      label: 'ChatGPT (OpenAI)',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
      description: '最流行的AI模型提供商',
    },
    {
      value: 'anthropic',
      label: 'Claude (Anthropic)',
      baseUrl: 'https://api.anthropic.com',
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
      description: '高质量对话AI模型',
    },
    {
      value: 'deepseek',
      label: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      models: ['deepseek-chat', 'deepseek-coder'],
      description: '国产优秀大模型',
    },
    {
      value: 'google',
      label: 'Gemini (Google)',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
      description: 'Google最新AI模型',
    },
    {
      value: 'xai',
      label: 'Grok (xAI)',
      baseUrl: 'https://api.x.ai/v1',
      models: ['grok-beta'],
      description: '马斯克的xAI产品',
    },
    {
      value: 'ollama',
      label: 'Ollama (本地)',
      baseUrl: 'http://localhost:11434',
      models: ['llama2', 'mistral', 'codellama', 'qwen'],
      description: '本地部署开源模型',
    },
    {
      value: 'zhipuai',
      label: '智谱清言',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      models: ['glm-4', 'glm-3-turbo', 'chatglm3-6b'],
      description: '清华智谱AI',
    },
    {
      value: 'qwen',
      label: '通义千问',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      description: '阿里云AI',
    },
    {
      value: 'wenxin',
      label: '文心一言',
      baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
      models: ['ernie-bot', 'ernie-bot-turbo', 'ernie-bot-4'],
      description: '百度AI',
    },
  ];

  // 转换为CommandSelect选项
  const providerSelectOptions: CommandSelectOption[] = providerOptions.map(option => ({
    value: option.value,
    label: option.label,
    description: option.description,
  }));

  const selectedProvider = providerOptions.find(p => p.value === formData.provider);

  useEffect(() => {
    // 获取要编辑的模型数据
    const modelId = params.id as string;
    const model = MockDataManager.getAIModels().find(m => m.id === modelId);

    if (model) {
      setFormData({
        name: model.name || '',
        displayName: model.displayName || '',
        provider: model.provider || 'openai',
        apiKey: model.apiKey || '',
        baseUrl: model.baseUrl || '',
        maxTokens: model.maxTokens || 4000,
        isDefault: model.isDefault || false,
        isActive: model.isActive !== undefined ? model.isActive : true,
      });
    }
    setLoading(false);
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.displayName.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (!formData.apiKey.trim()) {
      toast.error('请填写API密钥');
      return;
    }

    setIsLoading(true);

    try {
      // 模拟更新API调用
      setTimeout(() => {
        MockDataManager.updateAIModel(params.id as string, formData);
        toast.success(`AI模型 "${formData.displayName}" 更新成功！`);
        router.push(`/models/${params.id}`);
      }, 1000);
    } catch {
      toast.error('更新AI模型失败');
      setIsLoading(false);
    }
  };

  const handleProviderChange = (provider: AIModelConfig['provider']) => {
    const providerConfig = providerOptions.find(p => p.value === provider);
    setFormData(prev => ({
      ...prev,
      provider,
      baseUrl: providerConfig?.baseUrl || '',
      name: (prev.provider === provider ? prev.name : null) || providerConfig?.models[0] || '',
    }));
  };

  const handleProviderSelectChange = (value: string) => {
    handleProviderChange(value as AIModelConfig['provider']);
  };

  const testConnection = () => {
    if (!formData.apiKey) {
      toast.error('请先填写API密钥');
      return;
    }

    // 模拟连接测试
    toast.loading('测试连接中...');
    setTimeout(() => {
      toast.success('连接测试成功！');
    }, 1500);
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
              <Link href="/models">AI 模型管理</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/models/${params.id}`}>{formData.displayName || '模型详情'}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>编辑</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑 AI 模型</h1>
          <p className="text-muted-foreground">修改 AI 模型的配置参数</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/models/${params.id}`}>取消</Link>
          </Button>
          <Button type="submit" form="model-form" disabled={isLoading}>
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
          <form id="model-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>AI 模型的基本配置信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">显示名称 *</Label>
                    <Input
                      id="displayName"
                      placeholder="例如：GPT-4 Turbo"
                      value={formData.displayName}
                      onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">模型名称 *</Label>
                    <Input
                      id="name"
                      placeholder="例如：gpt-4-turbo"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">AI 提供商 *</Label>
                  <CommandSelect
                    options={providerSelectOptions}
                    value={formData.provider}
                    onValueChange={handleProviderSelectChange}
                    placeholder="选择 AI 提供商"
                    searchPlaceholder="搜索提供商..."
                    emptyMessage="没有找到相关提供商"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大 Token 数</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.maxTokens}
                    onChange={e => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    placeholder="4000"
                  />
                  <p className="text-muted-foreground text-xs">控制模型单次输出的最大长度</p>
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
                <CardDescription>配置模型的 API 连接参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API 密钥 *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="sk-... 或其他API密钥"
                      value={formData.apiKey}
                      onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                      required
                    />
                    <Button type="button" variant="outline" onClick={testConnection}>
                      <Cpu className="mr-2 h-4 w-4" />
                      测试
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">请确保 API 密钥具有适当的权限</p>
                </div>

                <div className="space-y-2">
                  <Label>API 基础地址</Label>
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={formData.baseUrl}
                    onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                  <p className="text-muted-foreground text-xs">留空将使用默认地址：{selectedProvider?.baseUrl}</p>
                </div>
              </CardContent>
            </Card>

            {/* 高级设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  高级设置
                </CardTitle>
                <CardDescription>模型的高级配置选项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">启用状态</Label>
                    <p className="text-muted-foreground text-sm">是否立即启用此模型</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">设为默认模型</Label>
                    <p className="text-muted-foreground text-sm">新建智能体时默认选择此模型</p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* 右侧信息 */}
        <div className="space-y-6">
          {/* 提供商信息 */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedProvider.label}</CardTitle>
                <CardDescription>{selectedProvider.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">默认API地址</p>
                    <p className="text-muted-foreground text-xs break-all">{selectedProvider.baseUrl}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">常用模型</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedProvider.models.map(model => (
                        <Button
                          key={model}
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, name: model }))}
                        >
                          {model}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 配置指南 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">配置指南</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>获取 API 密钥：访问提供商官网注册并获取</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>测试连接：配置完成后使用测试按钮验证</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>模型名称：必须与提供商支持的模型一致</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>Token 限制：根据使用需求合理设置</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 安全提示 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">安全提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>API 密钥将被安全加密存储</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>建议使用专用的 API 密钥</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>定期检查 API 使用量和费用</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>不要共享您的 API 密钥</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
