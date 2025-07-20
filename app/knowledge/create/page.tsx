'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { MockDataManager } from '@/lib/mock-data';
import { CreateKnowledgeBaseRequest } from '@/lib/types';
import { ArrowLeft, Database, Save, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateKnowledgeBasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsLoading(true);

    try {
      // 模拟创建API调用
      setTimeout(() => {
        const newKB = MockDataManager.createKnowledgeBase(formData);
        toast.success(`知识库 "${newKB.name}" 创建成功！`);
        router.push('/knowledge');
      }, 1000);
    } catch {
      toast.error('创建知识库失败');
      setIsLoading(false);
    }
  };

  const selectedModel = availableModels.find(model => model.value === formData.embeddingModel);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/knowledge">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">创建知识库</h1>
          <p className="text-muted-foreground">配置新的知识库来存储 AI 参考资料</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                rows={3}
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
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <div className="font-medium">{model.label}</div>
                        <div className="text-muted-foreground text-xs">{model.description}</div>
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
                    选择更高性能的模型可以获得更好的检索效果，但会增加处理成本。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/knowledge">取消</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                创建中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                创建知识库
              </>
            )}
          </Button>
        </div>
      </form>

      {/* 下一步提示 */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
            <div className="text-sm">
              <p className="font-medium text-green-900">创建后可以做什么</p>
              <ul className="mt-1 space-y-1 text-green-700">
                <li>• 上传 PDF、Word、Markdown 等格式文档</li>
                <li>• 查看文档处理状态和向量化进度</li>
                <li>• 测试知识库搜索和检索效果</li>
                <li>• 将知识库关联到智能体</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
