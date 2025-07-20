'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MockDataManager } from '@/lib/mock-data';
import { Agent, Conversation, Message } from '@/lib/types';
import { Bot, Calendar, CheckCircle, Clock, Eye, Filter, MessageSquare, Search, TrendingUp, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Mock消息数据 - 为选定对话生成详细消息
  const generateMockMessages = (conversation: Conversation): Message[] => {
    return [
      {
        id: `msg-${conversation.id}-1`,
        conversationId: conversation.id,
        role: 'user',
        content: `请帮我分析一下项目进度`,
        createdAt: new Date(new Date(conversation.createdAt).getTime() + 1000).toISOString(),
      },
      {
        id: `msg-${conversation.id}-2`,
        conversationId: conversation.id,
        role: 'assistant',
        content: `好的，我来帮您分析项目进度。根据当前的任务完成情况，项目整体进展良好。

主要完成项目：
- ✅ 前端界面设计 (100%)
- ✅ 用户认证模块 (100%)
- 🔄 核心功能开发 (80%)
- ⏳ API集成 (30%)
- ⏳ 测试阶段 (10%)

建议下一步重点关注API集成部分，预计还需要2周时间完成。`,
        responseTime: conversation.lastMessage?.responseTime || 2.1,
        createdAt: new Date(new Date(conversation.createdAt).getTime() + 3000).toISOString(),
      },
      {
        id: `msg-${conversation.id}-3`,
        conversationId: conversation.id,
        role: 'user',
        content: `有什么需要注意的风险点吗？`,
        createdAt: new Date(new Date(conversation.createdAt).getTime() + 5000).toISOString(),
      },
      {
        id: `msg-${conversation.id}-4`,
        conversationId: conversation.id,
        role: 'assistant',
        content: `基于当前进展，我识别出以下几个风险点：

🚨 **高风险**
- API集成延期可能影响整体交付时间
- 第三方服务依赖稳定性待确认

⚠️ **中风险**
- 测试资源投入不足
- 性能优化时间预留较少

✅ **建议措施**
- 提前与API提供方确认接口规范
- 制定备用方案
- 增加测试人员投入`,
        responseTime: 1.8,
        createdAt: new Date(new Date(conversation.createdAt).getTime() + 7000).toISOString(),
      },
    ];
  };

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      MockDataManager.initializeData();
      const conversationList = MockDataManager.getConversations();
      const agentList = MockDataManager.getAgents();

      setConversations(conversationList);
      setAgents(agentList);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤对话
  const filteredConversations = conversations.filter(conv => {
    const matchesAgent = selectedAgent === 'all' || conv.agentId === selectedAgent;
    const matchesSearch =
      searchQuery === '' ||
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.agentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesSearch;
  });

  // 计算统计数据
  const stats = {
    total: filteredConversations.length,
    today: filteredConversations.filter(conv => new Date(conv.createdAt).toDateString() === new Date().toDateString())
      .length,
    averageMessages:
      filteredConversations.length > 0
        ? Math.round(
            filteredConversations.reduce((sum, conv) => sum + conv.messagesCount, 0) / filteredConversations.length
          )
        : 0,
    averageResponseTime:
      filteredConversations.length > 0
        ? filteredConversations.reduce((sum, conv) => sum + (conv.lastMessage?.responseTime || 0), 0) /
          filteredConversations.length
        : 0,
  };

  const getResponseTimeBadge = (responseTime?: number) => {
    if (!responseTime) return <Badge variant="outline">-</Badge>;
    if (responseTime < 2)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          快速
        </Badge>
      );
    if (responseTime < 5)
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
          正常
        </Badge>
      );
    return (
      <Badge variant="default" className="bg-red-100 text-red-800">
        较慢
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">对话监控</h1>
            <p className="text-muted-foreground">查看和分析 AI 处理的对话记录</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-4 w-20 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-8 w-16 animate-pulse rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">对话监控</h1>
          <p className="text-muted-foreground">查看和分析 AI 处理的对话记录</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          刷新数据
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">对话总数</CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">今日新增 {stats.today}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均消息数</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMessages}</div>
            <p className="text-muted-foreground text-xs">每个对话</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(1)}s</div>
            <p className="text-muted-foreground text-xs">AI 处理时间</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-muted-foreground text-xs">无错误响应</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="选择智能体" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有智能体</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
                <Input
                  placeholder="搜索用户名或智能体..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 对话列表 */}
      <Card>
        <CardHeader>
          <CardTitle>对话记录</CardTitle>
          <CardDescription>显示 {filteredConversations.length} 条对话记录</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium">暂无对话记录</h3>
              <p className="text-muted-foreground">尚未找到匹配的对话记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">用户</TableHead>
                  <TableHead className="min-w-[100px]">智能体</TableHead>
                  <TableHead className="min-w-[80px] text-center">消息数</TableHead>
                  <TableHead className="min-w-[100px] text-center">响应时间</TableHead>
                  <TableHead className="hidden min-w-[140px] sm:table-cell">开始时间</TableHead>
                  <TableHead className="min-w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map(conversation => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">{conversation.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-500" />
                        <span>{conversation.agentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{conversation.messagesCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getResponseTimeBadge(conversation.lastMessage?.responseTime)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-muted-foreground flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(conversation.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(conversation)}>
                            <Eye className="mr-1 h-4 w-4" />
                            查看详情
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] sm:max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>对话详情</DialogTitle>
                            <DialogDescription>
                              {conversation.userName} 与 {conversation.agentName} 的对话记录
                            </DialogDescription>
                          </DialogHeader>

                          <div className="max-h-[70vh] overflow-y-auto pr-2">
                            {selectedConversation && (
                              <div className="space-y-4">
                                {/* 对话信息 */}
                                <div className="bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-4">
                                  <div>
                                    <p className="text-sm font-medium">用户</p>
                                    <p className="text-muted-foreground text-sm">{selectedConversation.userName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">智能体</p>
                                    <p className="text-muted-foreground text-sm">{selectedConversation.agentName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">消息总数</p>
                                    <p className="text-muted-foreground text-sm">
                                      {selectedConversation.messagesCount}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">开始时间</p>
                                    <p className="text-muted-foreground text-sm">
                                      {new Date(selectedConversation.createdAt).toLocaleString('zh-CN')}
                                    </p>
                                  </div>
                                </div>

                                {/* 消息记录 */}
                                <div className="space-y-3">
                                  <h4 className="font-medium">消息记录</h4>
                                  {generateMockMessages(selectedConversation).map(message => (
                                    <div
                                      key={message.id}
                                      className={`rounded-lg p-3 ${
                                        message.role === 'user'
                                          ? 'border-l-4 border-blue-500 bg-blue-50'
                                          : 'border-l-4 border-green-500 bg-green-50'
                                      }`}
                                    >
                                      <div className="mb-2 flex items-center gap-2">
                                        {message.role === 'user' ? (
                                          <>
                                            <User className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium text-blue-700">用户</span>
                                          </>
                                        ) : (
                                          <>
                                            <Bot className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-medium text-green-700">AI助手</span>
                                          </>
                                        )}
                                        <span className="text-muted-foreground ml-auto text-xs">
                                          {new Date(message.createdAt).toLocaleTimeString('zh-CN')}
                                        </span>
                                        {message.responseTime && (
                                          <Badge variant="outline" className="ml-1">
                                            {message.responseTime}s
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
