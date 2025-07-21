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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppContext } from '@/contexts/app-context';
import { agentsApi } from '@/lib/api/agents';
import { AgentResponse } from '@/lib/types';
import { Bot, Database, Edit, MessageSquare, Settings, Trash2, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { Confirm } = useAppContext();
  const [agent, setAgent] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const agentId = parseInt(params.id as string);
        const response = await agentsApi.get(agentId);
        setAgent(response);
      } catch (error) {
        console.error('获取智能体详情失败:', error);
        setAgent(null);
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [params.id]);

  const handleDelete = async () => {
    if (
      await Confirm({
        title: '确定要删除这个智能体吗？',
        message: '此操作不可撤销。',
        variant: 'destructive',
      })
    ) {
      try {
        await agentsApi.delete(parseInt(params.id as string));
        toast.success('智能体删除成功');
        router.push('/agents');
      } catch (error) {
        console.error('删除智能体失败:', error);
        toast.error('删除智能体失败，请重试');
      }
    }
  };

  // 安全获取工具数组
  const getToolsArray = (tools: unknown): string[] => {
    if (Array.isArray(tools)) return tools;
    return [];
  };

  // 安全获取知识库数组
  const getKnowledgeBasesArray = (knowledgeBases: unknown): string[] => {
    if (Array.isArray(knowledgeBases)) return knowledgeBases;
    return [];
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Bot className="text-muted-foreground mb-4 h-16 w-16" />
        <h2 className="mb-2 text-xl font-semibold">智能体不存在</h2>
        <p className="text-muted-foreground mb-4">请检查 URL 是否正确</p>
        <Button asChild>
          <Link href="/agents">返回列表</Link>
        </Button>
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
            <BreadcrumbPage>{agent.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Bot className="text-primary h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <Badge variant={agent.is_active ? 'default' : 'secondary'}>{agent.is_active ? '活跃' : '停用'}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{agent.description || '暂无描述'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/agents/${agent.id}/edit`}>
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
                <Bot className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">智能体名称</h4>
                  <p className="text-sm">{agent.name}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">AI 模型</h4>
                  <p className="text-sm">{agent.ai_model_name || '未设置'}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">创建时间</h4>
                  <p className="text-sm">{new Date(agent.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">更新时间</h4>
                  <p className="text-sm">{new Date(agent.updated_at).toLocaleString()}</p>
                </div>
              </div>
              {agent.description && (
                <div>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">描述</h4>
                  <p className="text-sm leading-relaxed">{agent.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 系统提示词 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                系统提示词
              </CardTitle>
              <CardDescription>定义智能体的行为和个性</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap">{agent.prompt}</pre>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">Temperature</h4>
                  <p className="text-sm">{agent.temperature}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧配置信息 */}
        <div className="space-y-6">
          {/* 关联工具 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                MCP 工具
              </CardTitle>
              <CardDescription>智能体可以使用的工具</CardDescription>
            </CardHeader>
            <CardContent>
              {getToolsArray(agent.tools).length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">未关联任何工具</p>
              ) : (
                <div className="space-y-3">
                  {getToolsArray(agent.tools).map((tool: string) => (
                    <div key={tool} className="flex items-start space-x-3 rounded-lg border p-3">
                      <Wrench className="text-muted-foreground mt-1 h-4 w-4" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{tool}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 关联知识库 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                知识库
              </CardTitle>
              <CardDescription>智能体可以访问的知识库</CardDescription>
            </CardHeader>
            <CardContent>
              {getKnowledgeBasesArray(agent.knowledge_bases).length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">未关联任何知识库</p>
              ) : (
                <div className="space-y-3">
                  {getKnowledgeBasesArray(agent.knowledge_bases).map((kb: string) => (
                    <div key={kb} className="flex items-start space-x-3 rounded-lg border p-3">
                      <Database className="text-muted-foreground mt-1 h-4 w-4" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{kb}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 使用统计 */}
          <Card>
            <CardHeader>
              <CardTitle>使用统计</CardTitle>
              <CardDescription>智能体的使用情况</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">关联对话</span>
                <span className="text-2xl font-bold">{agent.conversation_count || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">消息总数</span>
                <span className="text-2xl font-bold">{agent.message_count || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token使用量</span>
                <span className="text-2xl font-bold">{(agent.token_usage || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
