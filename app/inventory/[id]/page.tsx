'use client';

import { InventoryChecklist } from '@/components/inventory/inventory-checklist';
import { InventoryExecution } from '@/components/inventory/inventory-execution';
import { Loading } from '@/components/loading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InventoryRecord, InventoryRecordListQuery, InventoryTask } from '@/lib/api/inventory';
import { getInventoryRecords, getInventoryTask, updateInventoryTask } from '@/lib/api/inventory';
import { AlertCircle, CheckCircle, FileText, Play, Search, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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

// 资产状态中文映射
const getAssetStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    available: '可用',
    borrowed: '借用中',
    maintenance: '维修中',
    scrapped: '已报废',
  };
  return statusMap[status] || status;
};

const taskTypeLabels = {
  full: '全盘',
  category: '按分类',
  department: '按部门',
};

const resultLabels = {
  normal: '正常',
  surplus: '盘盈',
  deficit: '盘亏',
  damaged: '损坏',
};

const resultColors = {
  normal: 'bg-green-100 text-green-800',
  surplus: 'bg-orange-100 text-orange-800',
  deficit: 'bg-red-100 text-red-800',
  damaged: 'bg-purple-100 text-purple-800',
};

const resultIcons = {
  normal: CheckCircle,
  surplus: AlertCircle,
  deficit: XCircle,
  damaged: AlertCircle,
};

export default function InventoryTaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = parseInt(params.id as string);

  const [task, setTask] = useState<InventoryTask | null>(null);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // 记录筛选条件
  const [resultFilter, setResultFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (taskId) {
      loadTask();
      loadRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, currentPage, resultFilter, keyword]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await getInventoryTask(taskId);
      if (response.code === 'SUCCESS') {
        setTask(response.data);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Failed to load task:', error);
      toast.error('加载盘点任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      setRecordsLoading(true);
      const params: InventoryRecordListQuery = {
        page: currentPage,
        page_size: pageSize,
        task_id: taskId,
        result:
          resultFilter && resultFilter !== 'all'
            ? (resultFilter as 'normal' | 'surplus' | 'deficit' | 'damaged')
            : undefined,
        keyword: keyword || undefined,
      };

      const response = await getInventoryRecords(params);
      if (response.code === 'SUCCESS') {
        setRecords(response.data.data);
        setTotal(response.data.total_items);
      } else {
        toast.error(response.message || '获取盘点记录失败');
      }
    } catch (error) {
      console.error('获取盘点记录失败:', error);
      toast.error('获取盘点记录失败');
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!task) return;

    try {
      const response = await updateInventoryTask(task.id, { status: 'in_progress' });
      if (response.code === 'SUCCESS') {
        toast.success('盘点任务已开始');
        setTask({ ...task, status: 'in_progress' });
      } else {
        toast.error(response.message || '启动盘点任务失败');
      }
    } catch (error) {
      console.error('启动盘点任务失败:', error);
      toast.error('启动盘点任务失败');
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;

    try {
      const response = await updateInventoryTask(task.id, { status: 'completed' });
      if (response.code === 'SUCCESS') {
        toast.success('盘点任务已完成');
        setTask({ ...task, status: 'completed' });
      } else {
        toast.error(response.message || '完成盘点任务失败');
      }
    } catch (error) {
      console.error('完成盘点任务失败:', error);
      toast.error('完成盘点任务失败');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return <Loading />;
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <div className="py-12 text-center">
          <div className="text-gray-500">盘点任务不存在</div>
          <Button className="mt-4" onClick={() => router.push('/inventory')}>
            返回盘点管理
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{task.task_name}</h1>
              <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
              <Badge variant="outline">{taskTypeLabels[task.task_type]}</Badge>
            </div>
            <p className="mt-1 text-gray-600">盘点任务详情和执行</p>
          </div>
        </div>
        <div className="flex gap-2">
          {task.status === 'pending' && (
            <Button onClick={handleStartTask}>
              <Play className="mr-2 h-4 w-4" />
              开始盘点
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button onClick={handleCompleteTask}>
              <CheckCircle className="mr-2 h-4 w-4" />
              完成盘点
            </Button>
          )}
          {task.status === 'completed' && (
            <Button onClick={() => router.push(`/inventory/${task.id}/report`)}>
              <FileText className="mr-2 h-4 w-4" />
              查看报告
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="gap-2">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="checklist">盘点清单</TabsTrigger>
          {task.status === 'in_progress' && <TabsTrigger value="execution">盘点执行</TabsTrigger>}
          <TabsTrigger value="records">盘点记录</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 任务信息 */}
          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">创建人:</span>
                    <span className="ml-2">{task.created_by || '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">创建时间:</span>
                    <span className="ml-2">{formatDate(task.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">开始时间:</span>
                    <span className="ml-2">{formatDate(task.start_date)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">结束时间:</span>
                    <span className="ml-2">{formatDate(task.end_date)}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="mb-2 text-sm text-gray-600">备注:</div>
                  <div className="flex-1 rounded bg-gray-50 p-2 text-sm">{task.notes || '无备注'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <Card>
            <CardHeader>
              <CardTitle>盘点统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{task.total_assets}</div>
                  <div className="text-sm text-gray-600">总资产</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{task.checked_assets}</div>
                  <div className="text-sm text-gray-600">已盘点</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{task.normal_assets}</div>
                  <div className="text-sm text-gray-600">正常</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{task.surplus_assets}</div>
                  <div className="text-sm text-gray-600">盘盈</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{task.deficit_assets}</div>
                  <div className="text-sm text-gray-600">盘亏</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{task.damaged_assets}</div>
                  <div className="text-sm text-gray-600">损坏</div>
                </div>
              </div>

              {/* 进度条 */}
              <div>
                <div className="mb-2 flex justify-between text-sm text-gray-600">
                  <span>盘点进度</span>
                  <span>{task.progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <InventoryChecklist task={task} />
        </TabsContent>

        {task.status === 'in_progress' && (
          <TabsContent value="execution" className="space-y-6">
            <InventoryExecution
              task={task}
              onRecordCreated={() => {
                loadTask();
                loadRecords();
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="records" className="space-y-6">
          {/* 筛选条件 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="min-w-[200px] flex-1">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      placeholder="搜索资产编号或名称..."
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="盘点结果" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部结果</SelectItem>
                    <SelectItem value="normal">正常</SelectItem>
                    <SelectItem value="surplus">盘盈</SelectItem>
                    <SelectItem value="deficit">盘亏</SelectItem>
                    <SelectItem value="damaged">损坏</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 盘点记录表格 */}
          <Card>
            <CardHeader>
              <CardTitle>盘点记录</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="py-8 text-center">
                  <Loading />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>资产编号</TableHead>
                        <TableHead>资产名称</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>部门</TableHead>
                        <TableHead>预期状态</TableHead>
                        <TableHead>实际状态</TableHead>
                        <TableHead>盘点结果</TableHead>
                        <TableHead>盘点人</TableHead>
                        <TableHead>盘点时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map(record => {
                        const ResultIcon = resultIcons[record.result];
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.asset?.asset_no}</TableCell>
                            <TableCell>{record.asset?.name}</TableCell>
                            <TableCell>{record.asset?.category?.name || '-'}</TableCell>
                            <TableCell>{record.asset?.department?.name || '-'}</TableCell>
                            <TableCell>{getAssetStatusLabel(record.expected_status)}</TableCell>
                            <TableCell>{getAssetStatusLabel(record.actual_status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ResultIcon className="h-4 w-4" />
                                <Badge className={resultColors[record.result]}>{resultLabels[record.result]}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>{record.checked_by}</TableCell>
                            <TableCell>{formatDate(record.checked_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {records.length === 0 && <div className="py-8 text-center text-gray-500">暂无盘点记录</div>}

                  {/* 分页 */}
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(total / pageSize)}
                      pageSize={pageSize}
                      totalItems={total}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={() => {
                        // pageSize 是常量，不支持修改
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
