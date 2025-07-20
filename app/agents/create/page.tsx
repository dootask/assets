'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { MockDataManager } from '@/lib/mock-data';
import { CreateAgentRequest } from '@/lib/types';
import { ArrowLeft, Bot, Database, Save, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface FormData extends CreateAgentRequest {
  maxTokens: number;
}

export default function CreateAgentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    prompt: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
    tools: [],
    knowledgeBases: [],
  });

  // Mock数据 - 在实际应用中这些应该从API获取
  const availableModels = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: '快速响应，成本较低' },
    { value: 'gpt-4', label: 'GPT-4', description: '更强大的推理能力，成本较高' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: '平衡性能与成本' },
  ];

  const availableTools = MockDataManager.getMCPTools().map(tool => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
  }));

  const availableKnowledgeBases = MockDataManager.getKnowledgeBases().map(kb => ({
    id: kb.id,
    name: kb.name,
    description: kb.description,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.prompt.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsLoading(true);

    try {
      // 模拟创建API调用
      setTimeout(() => {
        const newAgent = MockDataManager.createAgent(formData);
        toast.success(`智能体 "${newAgent.name}" 创建成功！`);
        router.push('/agents');
      }, 1000);
    } catch {
      toast.error('创建智能体失败');
      setIsLoading(false);
    }
  };

  const handleToolToggle = (toolId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tools: checked ? [...prev.tools!, toolId] : prev.tools!.filter(id => id !== toolId),
    }));
  };

  const handleKnowledgeBaseToggle = (kbId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      knowledgeBases: checked ? [...prev.knowledgeBases!, kbId] : prev.knowledgeBases!.filter(id => id !== kbId),
    }));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">创建智能体</h1>
          <p className="text-muted-foreground">配置新的 AI 智能体</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              基本信息
            </CardTitle>
            <CardDescription>智能体的基本配置信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">智能体名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：技术助手"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">AI 模型 *</Label>
                <Select
                  value={formData.model}
                  onValueChange={value => setFormData(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择 AI 模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-muted-foreground text-xs">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">智能体描述 *</Label>
              <Input
                id="description"
                placeholder="描述智能体的作用和特点"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">系统提示词 *</Label>
              <Textarea
                id="prompt"
                placeholder="你是一个专业的助手，擅长..."
                value={formData.prompt}
                onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                rows={6}
                required
              />
              <p className="text-muted-foreground text-xs">提示词将决定智能体的行为风格和专业领域，请详细描述</p>
            </div>
          </CardContent>
        </Card>

        {/* AI 参数设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI 参数设置
            </CardTitle>
            <CardDescription>调整 AI 模型的生成参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>创造性 (Temperature): {formData.temperature}</Label>
                <Slider
                  value={[formData.temperature]}
                  onValueChange={([value]: [number]) => setFormData(prev => ({ ...prev, temperature: value }))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-muted-foreground text-xs">0 = 保守稳定，1 = 富有创意</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">最大输出长度: {formData.maxTokens}</Label>
                <Slider
                  value={[formData.maxTokens]}
                  onValueChange={([value]: [number]) => setFormData(prev => ({ ...prev, maxTokens: value }))}
                  max={4000}
                  min={500}
                  step={100}
                  className="w-full"
                />
                <p className="text-muted-foreground text-xs">控制单次回复的最大长度</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MCP 工具配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              MCP 工具
            </CardTitle>
            <CardDescription>选择智能体可以使用的工具</CardDescription>
          </CardHeader>
          <CardContent>
            {availableTools.length === 0 ? (
              <p className="text-muted-foreground">暂无可用工具</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {availableTools.map(tool => (
                  <div key={tool.id} className="flex items-start space-x-3 rounded-lg border p-3">
                    <Checkbox
                      id={`tool-${tool.id}`}
                      checked={formData.tools?.includes(tool.id) || false}
                      onCheckedChange={(checked: boolean) => handleToolToggle(tool.id, checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`tool-${tool.id}`} className="text-sm font-medium">
                        {tool.name}
                      </Label>
                      <p className="text-muted-foreground text-xs">{tool.description}</p>
                      <span className="bg-secondary mt-1 inline-block rounded-full px-2 py-1 text-xs">
                        {tool.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 知识库配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              知识库
            </CardTitle>
            <CardDescription>选择智能体可以访问的知识库</CardDescription>
          </CardHeader>
          <CardContent>
            {availableKnowledgeBases.length === 0 ? (
              <div className="py-8 text-center">
                <Database className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <p className="text-muted-foreground mb-2">还没有知识库</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/knowledge/create">创建知识库</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableKnowledgeBases.map(kb => (
                  <div key={kb.id} className="flex items-start space-x-3 rounded-lg border p-3">
                    <Checkbox
                      id={`kb-${kb.id}`}
                      checked={formData.knowledgeBases?.includes(kb.id) || false}
                      onCheckedChange={(checked: boolean) => handleKnowledgeBaseToggle(kb.id, checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`kb-${kb.id}`} className="text-sm font-medium">
                        {kb.name}
                      </Label>
                      <p className="text-muted-foreground text-xs">{kb.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/agents">取消</Link>
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
                创建智能体
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
