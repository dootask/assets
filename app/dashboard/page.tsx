'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MockDataManager } from '@/lib/mock-data';
import { Agent, Conversation, DashboardStats } from '@/lib/types';
import { Activity, Bot, Database, MessageSquare, RefreshCcw, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    // 模拟异步加载
    setTimeout(() => {
      // 初始化Mock数据
      MockDataManager.initializeData();

      // 获取统计数据
      const dashboardStats = MockDataManager.getDashboardStats();
      setStats(dashboardStats);

      // 获取最近的智能体
      const agents = MockDataManager.getAgents();
      setRecentAgents(agents.slice(0, 3));

      // 获取最近的对话
      const conversations = MockDataManager.getConversations();
      setRecentConversations(conversations.slice(0, 3));

      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
            <p className="text-muted-foreground">DooTask AI 智能体管理系统概览</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-4 w-20 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted mb-2 h-8 w-16 animate-pulse rounded"></div>
                <div className="bg-muted h-3 w-24 animate-pulse rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
          <p className="text-muted-foreground">DooTask AI 智能体管理系统概览</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCcw className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">智能体数量</CardTitle>
            <Bot className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agents.total}</div>
            <p className="text-muted-foreground text-xs">
              活跃: {stats.agents.active} | 已停用: {stats.agents.inactive}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日消息</CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.today}</div>
            <p className="text-muted-foreground text-xs">
              总计: {stats.messages.total} | 平均响应: {stats.messages.averageResponseTime.toFixed(1)}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">知识库</CardTitle>
            <Database className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.knowledgeBases.total}</div>
            <p className="text-muted-foreground text-xs">文档总数: {stats.knowledgeBases.documentsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃对话</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations.active}</div>
            <p className="text-muted-foreground text-xs">今日新增: {stats.conversations.today}</p>
          </CardContent>
        </Card>
      </div>

      {/* 系统状态和最近活动 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              系统状态
            </CardTitle>
            <CardDescription>AI服务和组件运行状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Go API 服务</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${stats.systemStatus.goService === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-muted-foreground text-xs">
                  {stats.systemStatus.goService === 'online' ? '运行正常' : '服务异常'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Python AI 服务</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${stats.systemStatus.pythonService === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-muted-foreground text-xs">
                  {stats.systemStatus.pythonService === 'online' ? '运行正常' : '服务异常'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">DooTask Webhook</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${stats.systemStatus.webhook === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-muted-foreground text-xs">
                  {stats.systemStatus.webhook === 'connected' ? '连接正常' : '连接异常'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">数据库连接</span>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${stats.systemStatus.database === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-muted-foreground text-xs">
                  {stats.systemStatus.database === 'online' ? '连接正常' : '连接异常'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>智能体和对话活动记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {recentAgents.map(agent => (
                <div key={agent.id} className="bg-muted/50 flex items-start gap-3 rounded-lg p-3">
                  <Bot className={`mt-0.5 h-4 w-4 ${agent.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {agent.isActive ? '运行中' : '已停用'} • 今日处理 {agent.statistics?.todayMessages || 0} 条消息
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {recentConversations.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-muted-foreground mb-2 text-xs font-medium">最近对话</p>
                {recentConversations.map(conv => (
                  <div key={conv.id} className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-2">
                    <MessageSquare className="mt-1 h-3 w-3 text-blue-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs">
                        {conv.userName} 与 {conv.agentName}
                      </p>
                      <p className="text-muted-foreground text-xs">{conv.messagesCount} 条消息</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
