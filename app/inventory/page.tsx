'use client';

import { Loading } from '@/components/loading';
import { Pagination, defaultPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/app-context';
import type { InventoryTask } from '@/lib/api/inventory';
import { deleteInventoryTask, getInventoryTasks, updateInventoryTask } from '@/lib/api/inventory';
import { AxiosError } from 'axios';
import { Eye, FileText, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusLabels = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const taskTypeLabels = {
  full: '全盘',
  category: '按分类',
  department: '按部门',
};

export default function InventoryPage() {
  const router = useRouter();
  const { Confirm } = useAppContext();
  const [tasks, setTasks] = useState<InventoryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(defaultPagination);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');

  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      
      // 构建查询参数
      const queryParams: {
        page: number;
        page_size: number;
        status?: 'pending' | 'in_progress' | 'completed';
        task_type?: 'full' | 'category' | 'department';
        keyword?: string;
      } = {
        page,
        page_size: pagination.page_size,
      };

      if (keyword.trim()) {
        queryParams.keyword = keyword.trim();
      }
      if (statusFilter && statusFilter !== 'all') {
        queryParams.status = statusFilter as 'pending' | 'in_progress' | 'completed';
      }
      if (taskTypeFilter && taskTypeFilter !== 'all') {
        queryParams.task_type = taskTypeFilter as 'full' | 'category' | 'department';
      }

      const response = await getInventoryTasks(queryParams);

      if (response.code === 'SUCCESS') {
        setTasks(response.data.data || []);
        setPagination(response.data);
      } else {
        toast.error(response.message || '获取盘点任务失败');
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.status !== 403) {
          toast.error('获取盘点任务失败');
        }
      }
      console.error('获取盘点任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, statusFilter, taskTypeFilter]);

  const handleSearch = () => {
    loadTasks(1);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    loadTasks(page);
  };

  const handleStartTask = async (task: InventoryTask) => {
    try {
      const response = await updateInventoryTask(task.id, { status: 'in_progress' });
      if (response.code === 'SUCCESS') {
        toast.success('盘点任务已开始');
        loadTasks(pagination.current_page);
      } else {
        toast.error(response.message || '启动盘点任务失败');
      }
    } catch (error) {
      console.error('启动盘点任务失败:', error);
      toast.error('启动盘点任务失败');
    }
  };

  const handleDeleteTask = async (task: InventoryTask) => {
    // 检查任务状态
    if (task.status !== 'pending') {
      const statusMessages = {
        in_progress: '进行中的盘点任务不能删除，请先完成或暂停任务',
        completed: '已完成的盘点任务不能删除，如需清理请联系管理员',
      };
      toast.error(statusMessages[task.status] || '当前状态的任务不能删除');
      return;
    }

    const confirmed = await Confirm({
      title: '确认删除',
      message: `确定要删除盘点任务 "${task.task_name}" 吗？此操作不可撤销。`,
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      const response = await deleteInventoryTask(task.id);
      if (response.code === 'SUCCESS') {
        toast.success('盘点任务删除成功');
        loadTasks();
      } else {
        toast.error(response.message || '删除盘点任务失败');
      }
    } catch (error) {
      console.error('删除盘点任务失败:', error);
      toast.error('删除盘点任务失败');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading && tasks.length === 0) {
    return <Loading />;
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">盘点管理</h1>
            <p className="text-muted-foreground">管理资产盘点任务和记录</p>
          </div>
          <Button onClick={() => router.push('/inventory/new')}>
            <Plus className="mr-2 h-4 w-4" />
            创建盘点任务
          </Button>
        </div>

        {/* 筛选条件 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px] flex-1">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="搜索任务名称或备注..."
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待开始</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="full">全盘</SelectItem>
                  <SelectItem value="category">按分类</SelectItem>
                  <SelectItem value="department">按部门</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} variant="outline">
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 任务列表 */}
        <div className="grid gap-4">
          {tasks.map(task => (
            <Card key={task.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <CardTitle className="text-lg">{task.task_name}</CardTitle>
                      <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                      <Badge variant="outline">{taskTypeLabels[task.task_type]}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>创建人: {task.created_by || '-'}</div>
                      <div>创建时间: {formatDate(task.created_at)}</div>
                      {task.start_date && <div>开始时间: {formatDate(task.start_date)}</div>}
                      {task.end_date && <div>结束时间: {formatDate(task.end_date)}</div>}
                      {task.notes && <div>备注: {task.notes}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${task.id}`)}>
                      <Eye className="mr-1 h-4 w-4" />
                      查看
                    </Button>
                    {task.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => handleStartTask(task)}>
                        <Play className="mr-1 h-4 w-4" />
                        开始
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${task.id}/report`)}>
                        <FileText className="mr-1 h-4 w-4" />
                        报告
                      </Button>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTask(task)}
                          disabled={task.status !== 'pending'}
                          className={task.status !== 'pending' ? 'cursor-not-allowed opacity-50' : ''}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          删除
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.status === 'pending' ? '删除此盘点任务' : '仅可删除待开始的盘点任务'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 进度信息 */}
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{task.total_assets}</div>
                    <div className="text-gray-600">总资产</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{task.checked_assets}</div>
                    <div className="text-gray-600">已盘点</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600">{task.normal_assets}</div>
                    <div className="text-gray-600">正常</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{task.surplus_assets}</div>
                    <div className="text-gray-600">盘盈</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{task.deficit_assets}</div>
                    <div className="text-gray-600">盘亏</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{task.damaged_assets}</div>
                    <div className="text-gray-600">损坏</div>
                  </div>
                </div>
                {/* 进度条 */}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm text-gray-600">
                    <span>盘点进度</span>
                    <span>{task.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tasks.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">暂无盘点任务</div>
              <Button className="mt-4" onClick={() => router.push('/inventory/new')}>
                创建第一个盘点任务
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 分页 */}
        <div className="mt-6">
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            pageSize={pagination.page_size}
            totalItems={pagination.total_items}
            onPageChange={handlePageChange}
            onPageSizeChange={() => {
              // pageSize 是常量，不支持修改
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
