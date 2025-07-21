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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/app-context';
import { mcpToolsApi, type MCPToolQueryParams } from '@/lib/api/mcp-tools';
import { MCPTool } from '@/lib/types';
import { getAllAgents } from '@/lib/utils';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ToolsPage() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [filteredTools, setFilteredTools] = useState<MCPTool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { Confirm } = useAppContext();

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const params: MCPToolQueryParams = {
        page: 1,
        page_size: 100, // 加载所有工具用于前端筛选
        order_by: 'created_at',
        order_dir: 'desc',
      };
      const response = await mcpToolsApi.list(params);
      setTools(response.items);
      setFilteredTools(response.items);
    } catch (error) {
      console.error('Failed to load tools:', error);
      toast.error('加载工具列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    let filtered = tools;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        tool =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTools(filtered);
  }, [tools, selectedCategory, searchQuery]);

  const handleToggleActive = async (toolId: string, isActive: boolean) => {
    try {
      const updatedTool = await mcpToolsApi.toggle(toolId, isActive);
      setTools(prevTools => prevTools.map(tool => (tool.id === toolId ? updatedTool : tool)));
      toast.success(isActive ? '工具已启用' : '工具已停用');
    } catch (error) {
      console.error('Failed to toggle tool status:', error);
      toast.error('更新工具状态失败');
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    try {
      // 使用getAllAgents确保检查所有智能体的关联关系
      const allAgents = await getAllAgents();
      const usingAgents = allAgents.filter(agent => {
        try {
          let toolIds: string[] = [];
          if (typeof agent.tools === 'string') {
            toolIds = JSON.parse(agent.tools);
          } else if (Array.isArray(agent.tools)) {
            toolIds = agent.tools.map(tool => (typeof tool === 'string' ? tool : tool.toString()));
          }
          return toolIds.includes(toolId);
        } catch {
          return false;
        }
      });

      if (usingAgents.length > 0) {
        const agentNames = usingAgents.map(agent => agent.name).join('、');
        const confirmed = await Confirm({
          title: '确认删除MCP工具',
          message: `该工具正在被 ${usingAgents.length} 个智能体使用：${agentNames}。\n\n删除后这些智能体将无法使用该工具的功能。是否继续删除？`,
          variant: 'destructive',
        });

        if (!confirmed) {
          return;
        }
      } else {
        const confirmed = await Confirm({
          title: '确认删除MCP工具',
          message: '此操作将永久删除该工具及其配置。此操作无法撤销。',
          variant: 'destructive',
        });

        if (!confirmed) {
          return;
        }
      }

      await mcpToolsApi.delete(toolId);
      setTools(prevTools => prevTools.filter(tool => tool.id !== toolId));

      if (usingAgents.length > 0) {
        toast.success(`工具已删除，${usingAgents.length} 个智能体的关联已自动解除`);
      } else {
        toast.success('工具已删除');
      }
    } catch (error) {
      console.error('删除工具失败:', error);
      toast.error('删除工具失败，请重试');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'dootask':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            DooTask
          </Badge>
        );
      case 'external':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            外部工具
          </Badge>
        );
      case 'custom':
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            自定义
          </Badge>
        );
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'dootask':
        return 'DooTask';
      case 'external':
        return '外部工具';
      case 'custom':
        return '自定义';
      default:
        return category;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'internal':
        return '内部工具';
      case 'external':
        return '外部工具';
      default:
        return type;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'internal' ? <Badge variant="outline">内部</Badge> : <Badge variant="secondary">外部</Badge>;
  };

  const getSuccessRateBadge = (successRate: number) => {
    if (successRate >= 0.95) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          优秀
        </Badge>
      );
    } else if (successRate >= 0.8) {
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
          良好
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-red-100 text-red-800">
          需优化
        </Badge>
      );
    }
  };

  // 统计数据
  const stats = {
    total: filteredTools.length,
    active: filteredTools.filter(tool => tool.isActive).length,
    totalCalls: filteredTools.reduce((sum, tool) => sum + (tool.statistics?.totalCalls || 0), 0),
    avgResponseTime:
      filteredTools.length > 0
        ? filteredTools.reduce((sum, tool) => sum + (tool.statistics?.averageResponseTime || 0), 0) /
          filteredTools.length
        : 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MCP 工具管理</h1>
            <p className="text-muted-foreground">管理智能体可使用的 MCP 工具</p>
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
          <h1 className="text-3xl font-bold tracking-tight">MCP 工具管理</h1>
          <p className="text-muted-foreground">管理智能体可使用的 MCP 工具</p>
        </div>
        <Button asChild>
          <Link href="/tools/create">
            <Plus className="mr-2 h-4 w-4" />
            添加工具
          </Link>
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">工具总数</CardTitle>
            <Wrench className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">活跃: {stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总调用次数</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">所有工具累计</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(1)}s</div>
            <p className="text-muted-foreground text-xs">工具处理时间</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">整体状态</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">正常</div>
            <p className="text-muted-foreground text-xs">所有工具运行正常</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选工具
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <Label htmlFor="category">工具类别</Label>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mt-2">
                <TabsList className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="dootask">DooTask</TabsTrigger>
                  <TabsTrigger value="external">外部工具</TabsTrigger>
                  <TabsTrigger value="custom">自定义</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="min-w-0 flex-1 sm:min-w-[200px]">
              <Label htmlFor="search">搜索工具</Label>
              <div className="relative mt-2">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="搜索工具名称或描述..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工具列表 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map(tool => (
          <Card
            key={tool.id}
            className={`transition-all ${tool.isActive ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' : 'opacity-75'}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${tool.isActive ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                    <Wrench
                      className={`h-5 w-5 ${tool.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <div className="mt-1 flex gap-2">
                      {getCategoryBadge(tool.category)}
                      {getTypeBadge(tool.type)}
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
                      <Link href={`/tools/${tool.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        配置
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tools/${tool.id}`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        查看统计
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tools/${tool.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        修改
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDeleteTool(tool.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="mt-2 text-sm">{tool.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* 启用/禁用开关 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">状态</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${tool.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {tool.isActive ? '运行中' : '已停用'}
                  </span>
                  <Switch
                    checked={tool.isActive}
                    onCheckedChange={(checked: boolean) => handleToggleActive(tool.id, checked)}
                  />
                </div>
              </div>

              {/* 统计信息 */}
              {tool.statistics && tool.isActive && (
                <div className="grid grid-cols-2 gap-4 border-t pt-2">
                  <div className="text-center">
                    <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span className="text-xs">今日调用</span>
                    </div>
                    <p className="text-lg font-semibold">{tool.statistics.todayCalls}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">响应时间</span>
                    </div>
                    <p className="text-lg font-semibold">{tool.statistics.averageResponseTime}s</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">成功率</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-lg font-semibold">{(tool.statistics.successRate * 100).toFixed(0)}%</p>
                      {getSuccessRateBadge(tool.statistics.successRate)}
                    </div>
                  </div>
                </div>
              )}

              {/* 权限信息 */}
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">权限等级</p>
                <div className="flex flex-wrap gap-1">
                  {tool.permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission === 'read'
                        ? '只读'
                        : permission === 'write'
                          ? '读写'
                          : permission === 'execute'
                            ? '执行'
                            : permission === 'admin'
                              ? '管理员'
                              : permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 详细信息对话框 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="mr-2 h-3 w-3" />
                    查看详情
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      {tool.name}
                    </DialogTitle>
                    <DialogDescription>MCP 工具详细信息和使用统计</DialogDescription>
                  </DialogHeader>

                  <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {/* 基本信息 */}
                      <div className="bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-4">
                        <div>
                          <p className="text-sm font-medium">工具类别</p>
                          <p className="text-muted-foreground text-sm">{getCategoryText(tool.category)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">工具类型</p>
                          <p className="text-muted-foreground text-sm">{getTypeText(tool.type)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">创建时间</p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(tool.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">更新时间</p>
                          <p className="text-muted-foreground text-sm">
                            {new Date(tool.updatedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>

                      {/* 统计信息 */}
                      {tool.statistics && (
                        <div>
                          <h4 className="mb-3 font-medium">使用统计</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{tool.statistics.totalCalls}</p>
                                <p className="text-muted-foreground text-xs">总调用次数</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{tool.statistics.todayCalls}</p>
                                <p className="text-muted-foreground text-xs">今日调用</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{tool.statistics.averageResponseTime}s</p>
                                <p className="text-muted-foreground text-xs">平均响应时间</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold">{(tool.statistics.successRate * 100).toFixed(1)}%</p>
                                <p className="text-muted-foreground text-xs">成功率</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}

                      {/* 配置信息 */}
                      <div>
                        <h4 className="mb-3 font-medium">配置信息</h4>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <pre className="text-muted-foreground overflow-x-auto text-sm">
                            {JSON.stringify(tool.config, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <Card className="p-12 text-center">
          <Wrench className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">没有找到工具</h3>
          <p className="text-muted-foreground">请尝试调整筛选条件或搜索关键词</p>
        </Card>
      )}
    </div>
  );
}
