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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { agentsApi, formatUpdateRequestForAPI } from '@/lib/api/agents';
import { aiModelsApi } from '@/lib/api/ai-models';
import { knowledgeBasesApi } from '@/lib/api/knowledge-bases';
import { mcpToolsApi } from '@/lib/api/mcp-tools';
import { AIModelConfig, CreateAgentRequest, KnowledgeBase, MCPTool } from '@/lib/types';
import { Bot, Database, Save, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { toolCategories, toolTypes } from '../../../../lib/ai';

interface FormData extends CreateAgentRequest {
  maxTokens: number;
  selectedToolIds: string[];
  selectedKnowledgeBaseIds: number[];
}

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [knowledgeBasesLoading, setKnowledgeBasesLoading] = useState(true);
  const [availableModels, setAvailableModels] = useState<CommandSelectOption[]>([]);
  const [availableTools, setAvailableTools] = useState<MCPTool[]>([]);
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: null,
    prompt: '',
    ai_model_id: null,
    temperature: 0.7,
    maxTokens: 2000,
    tools: '[]',
    knowledge_bases: '[]',
    selectedToolIds: [],
    selectedKnowledgeBaseIds: [],
  });

  // 加载AI模型、工具、知识库和智能体数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 并行加载基础数据
        const [modelsResponse, toolsResponse, kbResponse] = await Promise.all([
          aiModelsApi.getAIModels({ enabled: true }),
          mcpToolsApi.list({ page: 1, page_size: 100, is_active: true }),
          knowledgeBasesApi.list({ page: 1, page_size: 100 }),
        ]);

        // 处理AI模型
        const modelOptions = modelsResponse.models.map((model: AIModelConfig) => ({
          value: model.id.toString(),
          label: model.name,
          description: `${model.provider} - ${model.model_name}`,
        }));
        setAvailableModels(modelOptions);
        setModelsLoading(false);

        // 处理工具和知识库
        setAvailableTools(toolsResponse.items);
        setToolsLoading(false);

        setAvailableKnowledgeBases(kbResponse.items);
        setKnowledgeBasesLoading(false);

        // 加载智能体数据
        const agentId = parseInt(params.id as string);
        const agent = await agentsApi.get(agentId);

        // 解析工具和知识库ID
        let selectedToolIds: string[] = [];
        let selectedKnowledgeBaseIds: number[] = [];

        try {
          if (typeof agent.tools === 'string') {
            selectedToolIds = JSON.parse(agent.tools);
          } else if (Array.isArray(agent.tools)) {
            selectedToolIds = agent.tools.map(tool => (typeof tool === 'string' ? tool : tool.toString()));
          }
        } catch (error) {
          console.error('解析工具数据失败:', error);
          selectedToolIds = [];
        }

        try {
          if (typeof agent.knowledge_bases === 'string') {
            selectedKnowledgeBaseIds = JSON.parse(agent.knowledge_bases);
          } else if (Array.isArray(agent.knowledge_bases)) {
            selectedKnowledgeBaseIds = agent.knowledge_bases.map(kb =>
              typeof kb === 'number' ? kb : parseInt(kb.toString())
            );
          }
        } catch (error) {
          console.error('解析知识库数据失败:', error);
          selectedKnowledgeBaseIds = [];
        }

        setFormData({
          name: agent.name || '',
          description: agent.description,
          prompt: agent.prompt || '',
          ai_model_id: agent.ai_model_id,
          temperature: agent.temperature || 0.7,
          maxTokens: 2000, // 默认值
          tools: typeof agent.tools === 'string' ? agent.tools : JSON.stringify(agent.tools || []),
          knowledge_bases:
            typeof agent.knowledge_bases === 'string'
              ? agent.knowledge_bases
              : JSON.stringify(agent.knowledge_bases || []),
          selectedToolIds,
          selectedKnowledgeBaseIds,
        });
      } catch (error) {
        console.error('加载数据失败:', error);
        toast.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsLoading(true);

    try {
      const apiData = formatUpdateRequestForAPI({
        name: formData.name,
        description: formData.description || undefined,
        prompt: formData.prompt,
        ai_model_id: formData.ai_model_id,
        temperature: formData.temperature,
        tools: formData.selectedToolIds,
        knowledgeBases: formData.selectedKnowledgeBaseIds,
        metadata: {},
      });

      const updatedAgent = await agentsApi.update(parseInt(params.id as string), apiData);
      toast.success(`智能体 "${updatedAgent.name}" 更新成功！`);
      router.push(`/agents/${params.id}`);
    } catch (error) {
      console.error('更新智能体失败:', error);
      toast.error('更新智能体失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolToggle = (toolId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedToolIds: checked ? [...prev.selectedToolIds, toolId] : prev.selectedToolIds.filter(id => id !== toolId),
    }));
  };

  const handleKnowledgeBaseToggle = (kbId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedKnowledgeBaseIds: checked
        ? [...prev.selectedKnowledgeBaseIds, kbId]
        : prev.selectedKnowledgeBaseIds.filter(id => id !== kbId),
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
              <Link href="/agents">智能体管理</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/agents/${params.id}`}>智能体详情</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">编辑智能体</h1>
          <p className="text-muted-foreground">修改智能体的配置和设置</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/agents/${params.id}`}>取消</Link>
          </Button>
          <Button type="submit" form="agent-form" disabled={isLoading}>
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

      <form id="agent-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧主要内容 */}
        <div className="space-y-6 lg:col-span-2">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  {modelsLoading ? (
                    <div className="bg-muted h-10 animate-pulse rounded"></div>
                  ) : (
                    <CommandSelect
                      options={availableModels}
                      value={formData.ai_model_id?.toString() || ''}
                      onValueChange={value => setFormData(prev => ({ ...prev, ai_model_id: parseInt(value) }))}
                      placeholder="选择 AI 模型"
                      searchPlaceholder="搜索模型..."
                      emptyMessage="没有找到相关模型"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  placeholder="智能体的简短描述"
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* 系统提示词 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统提示词
              </CardTitle>
              <CardDescription>定义智能体的行为和个性</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">提示词内容 *</Label>
                <Textarea
                  id="prompt"
                  placeholder="你是一个专业的AI助手..."
                  className="min-h-32"
                  value={formData.prompt}
                  onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  required
                />
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
              <CardDescription>调整智能体的行为参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
                <div className="flex h-9 items-center">
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[formData.temperature]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
                    className="w-full"
                  />
                </div>
                <p className="text-muted-foreground text-xs">控制输出的随机性，值越高输出越有创意</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧配置 */}
        <div className="space-y-6">
          {/* MCP 工具配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                MCP 工具
                {formData.selectedToolIds.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                    {formData.selectedToolIds.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription>选择智能体可以使用的工具</CardDescription>
            </CardHeader>
            <CardContent>
              {toolsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-muted h-12 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : availableTools.length === 0 ? (
                <div className="py-6 text-center">
                  <Wrench className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground mb-3">还没有可用的工具</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tools/create">创建工具</Link>
                  </Button>
                </div>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {availableTools.map(tool => (
                    <div key={tool.id} className="flex items-start space-x-3 rounded-lg border p-3">
                      <Checkbox
                        id={`tool-${tool.id}`}
                        checked={formData.selectedToolIds.includes(tool.id)}
                        onCheckedChange={checked => handleToolToggle(tool.id, Boolean(checked))}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`tool-${tool.id}`} className="cursor-pointer text-sm font-medium">
                          {tool.name}
                        </label>
                        <p className="text-muted-foreground mt-1 text-xs">{tool.description}</p>
                        <div className="mt-1 flex gap-1">
                          <span className="bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs">
                            {toolCategories.find(category => category.value === tool.category)?.label || tool.category}
                          </span>
                          <span className="bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs">
                            {toolTypes.find(type => type.value === tool.type)?.label || tool.type}
                          </span>
                        </div>
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
                {formData.selectedKnowledgeBaseIds.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                    {formData.selectedKnowledgeBaseIds.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription>选择智能体可以访问的知识库</CardDescription>
            </CardHeader>
            <CardContent>
              {knowledgeBasesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-muted h-12 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : availableKnowledgeBases.length === 0 ? (
                <div className="py-6 text-center">
                  <Database className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground mb-3">还没有知识库</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/knowledge/create">创建知识库</Link>
                  </Button>
                </div>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {availableKnowledgeBases.map(kb => (
                    <div key={kb.id} className="flex items-start space-x-3 rounded-lg border p-3">
                      <Checkbox
                        id={`kb-${kb.id}`}
                        checked={formData.selectedKnowledgeBaseIds.includes(kb.id)}
                        onCheckedChange={checked => handleKnowledgeBaseToggle(kb.id, Boolean(checked))}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`kb-${kb.id}`} className="cursor-pointer text-sm font-medium">
                          {kb.name}
                        </label>
                        <p className="text-muted-foreground mt-1 text-xs">{kb.description}</p>
                        <div className="text-muted-foreground mt-1 text-xs">
                          文档数: {kb.documentsCount || kb.documents_count || 0} | 模型:{' '}
                          {kb.embeddingModel || kb.embedding_model}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
