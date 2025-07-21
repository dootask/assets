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
import { Agent } from '@/lib/types';
import { Activity, Bot, Clock, Edit, MessageSquare, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AgentsPage() {
  const { Confirm } = useAppContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAgents = () => {
    setIsLoading(true);
    // 模拟异步加载
    setTimeout(() => {
      MockDataManager.initializeData();
      const agentList = MockDataManager.getAgents();
      setAgents(agentList);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleToggleActive = (agentId: string, isActive: boolean) => {
    const updatedAgent = MockDataManager.updateAgent(agentId, { isActive });
    if (updatedAgent) {
      setAgents(agents.map(agent => (agent.id === agentId ? updatedAgent : agent)));
      toast.success(isActive ? '智能体已启用' : '智能体已停用');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (
      await Confirm({
        title: '确认删除智能体',
        message: '此操作将永久删除该智能体及其相关配置。此操作无法撤销。',
        variant: 'destructive',
      })
    ) {
      const success = MockDataManager.deleteAgent(agentId);
      if (success) {
        setAgents(agents.filter(agent => agent.id !== agentId));
        toast.success('智能体已删除');
      } else {
        toast.error('删除失败');
      }
    }
  };

  const getModelBadgeVariant = (model: string) => {
    switch (model) {
      case 'gpt-4':
        return 'default';
      case 'gpt-3.5-turbo':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">智能体管理</h1>
            <p className="text-muted-foreground">管理和配置 AI 智能体</p>
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
          <h1 className="text-3xl font-bold tracking-tight">智能体管理</h1>
          <p className="text-muted-foreground">管理和配置 AI 智能体</p>
        </div>
        <Button asChild>
          <Link href="/agents/create">
            <Plus className="mr-2 h-4 w-4" />
            创建智能体
          </Link>
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="p-12 text-center">
          <Bot className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">还没有智能体</h3>
          <p className="text-muted-foreground mb-4">创建您的第一个 AI 智能体来开始</p>
          <Button asChild>
            <Link href="/agents/create">
              <Plus className="mr-2 h-4 w-4" />
              创建智能体
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <Card
              key={agent.id}
              className={`transition-all ${agent.isActive ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${agent.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                      <Bot
                        className={`h-5 w-5 ${agent.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge variant={getModelBadgeVariant(agent.model)} className="mt-1 text-xs">
                        {agent.model}
                      </Badge>
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
                        <Link href={`/agents/${agent.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteAgent(agent.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-sm">{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* 启用/禁用开关 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">状态</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${agent.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {agent.isActive ? '运行中' : '已停用'}
                    </span>
                    <Switch
                      checked={agent.isActive}
                      onCheckedChange={(checked: boolean) => handleToggleActive(agent.id, checked)}
                    />
                  </div>
                </div>

                {/* 统计信息 */}
                {agent.statistics && (
                  <div className="grid grid-cols-2 gap-4 border-t pt-2">
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs">今日消息</span>
                      </div>
                      <p className="text-lg font-semibold">{agent.statistics.todayMessages}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">响应时间</span>
                      </div>
                      <p className="text-lg font-semibold">{agent.statistics.averageResponseTime.toFixed(1)}s</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span className="text-xs">成功率</span>
                      </div>
                      <p className="text-lg font-semibold">{(agent.statistics.successRate * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                )}

                {/* 工具和知识库 */}
                <div className="space-y-2">
                  {agent.tools.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">MCP工具 ({agent.tools.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.slice(0, 2).map(tool => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {agent.tools.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.tools.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {agent.knowledgeBases.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">知识库 ({agent.knowledgeBases.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.knowledgeBases.slice(0, 2).map(kb => (
                          <Badge key={kb} variant="outline" className="text-xs">
                            {kb}
                          </Badge>
                        ))}
                        {agent.knowledgeBases.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.knowledgeBases.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
