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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MockDataManager } from '@/lib/mock-data';
import { CreateKnowledgeBaseRequest } from '@/lib/types';
import { Database, Save, Settings } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditKnowledgeBasePage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateKnowledgeBaseRequest>({
    name: '',
    description: '',
    embeddingModel: 'text-embedding-ada-002',
  });

  // 可用的 Embedding 模型
  const availableModels = [
    {
      value: 'text-embedding-ada-002',
      label: 'OpenAI Ada-002',
      description: '成本较低，适合大部分场景',
      dimensions: 1536,
      cost: '低',
    },
    {
      value: 'text-embedding-3-small',
      label: 'OpenAI Embedding v3 Small',
      description: '平衡性能与成本',
      dimensions: 1536,
      cost: '中',
    },
    {
      value: 'text-embedding-3-large',
      label: 'OpenAI Embedding v3 Large',
      description: '最佳性能，成本较高',
      dimensions: 3072,
      cost: '高',
    },
  ];

  useEffect(() => {
    // 获取要编辑的知识库数据
    const kbId = params.id as string;
    const kb = MockDataManager.getKnowledgeBases().find(kb => kb.id === kbId);

    if (kb) {
      setFormData({
        name: kb.name,
        description: kb.description,
        embeddingModel: kb.embeddingModel || 'text-embedding-ada-002',
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

    setIsLoading(true);

    try {
      // 模拟更新API调用
      setTimeout(() => {
        MockDataManager.updateKnowledgeBase(params.id as string, formData);
        toast.success(`知识库 "${formData.name}" 更新成功！`);
        router.push(`/knowledge/${params.id}`);
      }, 1000);
    } catch {
      toast.error('更新知识库失败');
      setIsLoading(false);
    }
  };

  const selectedModel = availableModels.find(model => model.value === formData.embeddingModel);

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
              <Link href="/knowledge">知识库管理</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/knowledge/${params.id}`}>{formData.name || '知识库详情'}</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">编辑知识库</h1>
          <p className="text-muted-foreground">修改知识库的配置和设置</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/knowledge/${params.id}`}>取消</Link>
          </Button>
          <Button type="submit" form="knowledge-form" disabled={isLoading}>
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
          <form id="knowledge-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>知识库的基本配置信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">知识库名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如：技术文档库"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">知识库描述 *</Label>
                  <Textarea
                    id="description"
                    placeholder="描述知识库的用途和内容类型..."
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                  <p className="text-muted-foreground text-xs">详细描述有助于 AI 更好地理解知识库内容</p>
                </div>
              </CardContent>
            </Card>

            {/* Embedding 模型设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  向量化设置
                </CardTitle>
                <CardDescription>选择文档向量化的模型和参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="embeddingModel">Embedding 模型 *</Label>
                  <Select
                    value={formData.embeddingModel}
                    onValueChange={value => setFormData(prev => ({ ...prev, embeddingModel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择 Embedding 模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model.value} value={model.value} className="flex-col items-start p-2">
                          {model.label}
                          <div className="text-muted-foreground mt-1 max-w-[220px] text-xs leading-tight">
                            {model.description}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedModel && (
                  <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                    <h4 className="text-sm font-medium">模型详情</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">维度数</span>
                        <p className="font-medium">{selectedModel.dimensions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">成本</span>
                        <p className="font-medium">{selectedModel.cost}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">适用场景</span>
                        <p className="font-medium">
                          {selectedModel.cost === '低' ? '通用' : selectedModel.cost === '中' ? '平衡' : '高精度'}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">{selectedModel.description}</p>
                  </div>
                )}

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">关于 Embedding 模型</p>
                      <p className="mt-1 text-blue-700">
                        Embedding 模型用于将文档转换为向量表示，影响 AI 的检索精度和相关性判断。
                        更改模型将需要重新处理所有文档。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* 右侧帮助信息 */}
        <div className="space-y-6">
          {/* 编辑注意事项 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">编辑注意事项</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>更改 Embedding 模型将触发所有文档的重新处理</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>重新处理期间可能影响检索效果</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>建议在低峰时段进行模型更改</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                  <span>模型更改可能产生额外费用</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 最佳实践 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">最佳实践</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>定期清理过期或无用的文档</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>保持文档结构清晰和标题明确</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>根据内容性质选择合适的模型</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span>监控知识库的使用情况和效果</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
