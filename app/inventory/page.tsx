'use client';

import { Loading } from '@/components/loading';
import { Pagination } from '@/components/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { InventoryTask, InventoryTaskListQuery } from '@/lib/api/inventory';
import { deleteInventoryTask, getInventoryTasks, updateInventoryTask } from '@/lib/api/inventory';
import { Eye, FileText, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusLabels = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成'
};

const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
};

const taskTypeLabels = {
    full: '全盘',
    category: '按分类',
    department: '按部门'
};

export default function InventoryPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<InventoryTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    
    // 筛选条件
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');

    const loadTasks = async () => {
        try {
            setLoading(true);
            const params: InventoryTaskListQuery = {
                page: currentPage,
                page_size: pageSize,
                keyword: keyword || undefined,
                status: (statusFilter && statusFilter !== 'all') ? statusFilter as any : undefined,
                task_type: (taskTypeFilter && taskTypeFilter !== 'all') ? taskTypeFilter as any : undefined,
            };

            const response = await getInventoryTasks(params);
            if (response.code === 'SUCCESS') {
                setTasks(response.data.data);
                setTotal(response.data.total_items);
            } else {
                toast.error(response.message || '获取盘点任务失败');
            }
        } catch (error) {
            console.error('获取盘点任务失败:', error);
            toast.error('获取盘点任务失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [currentPage, keyword, statusFilter, taskTypeFilter]);

    const handleSearch = () => {
        setCurrentPage(1);
        loadTasks();
    };

    const handleStartTask = async (task: InventoryTask) => {
        try {
            const response = await updateInventoryTask(task.id, { status: 'in_progress' });
            if (response.code === 'SUCCESS') {
                toast.success('盘点任务已开始');
                loadTasks();
            } else {
                toast.error(response.message || '启动盘点任务失败');
            }
        } catch (error) {
            console.error('启动盘点任务失败:', error);
            toast.error('启动盘点任务失败');
        }
    };

    const handleDeleteTask = async (task: InventoryTask) => {
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
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">盘点管理</h1>
                    <p className="text-gray-600 mt-1">管理资产盘点任务和记录</p>
                </div>
                <Button onClick={() => router.push('/inventory/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    创建盘点任务
                </Button>
            </div>

            {/* 筛选条件 */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="搜索任务名称或备注..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                            <Search className="w-4 h-4 mr-2" />
                            搜索
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 任务列表 */}
            <div className="grid gap-4">
                {tasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CardTitle className="text-lg">{task.task_name}</CardTitle>
                                        <Badge className={statusColors[task.status]}>
                                            {statusLabels[task.status]}
                                        </Badge>
                                        <Badge variant="outline">
                                            {taskTypeLabels[task.task_type]}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>创建人: {task.created_by || '-'}</div>
                                        <div>创建时间: {formatDate(task.created_at)}</div>
                                        {task.start_date && (
                                            <div>开始时间: {formatDate(task.start_date)}</div>
                                        )}
                                        {task.end_date && (
                                            <div>结束时间: {formatDate(task.end_date)}</div>
                                        )}
                                        {task.notes && (
                                            <div>备注: {task.notes}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/inventory/${task.id}`)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        查看
                                    </Button>
                                    {task.status === 'pending' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStartTask(task)}
                                        >
                                            <Play className="w-4 h-4 mr-1" />
                                            开始
                                        </Button>
                                    )}
                                    {task.status === 'completed' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/inventory/${task.id}/report`)}
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            报告
                                        </Button>
                                    )}
                                    {task.status === 'pending' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    删除
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        确定要删除盘点任务 &quot;{task.task_name}&quot; 吗？此操作不可撤销。
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteTask(task)}>
                                                        删除
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* 进度信息 */}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
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
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>盘点进度</span>
                                    <span>{task.progress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                    <CardContent className="text-center py-12">
                        <div className="text-gray-500">暂无盘点任务</div>
                        <Button 
                            className="mt-4" 
                            onClick={() => router.push('/inventory/new')}
                        >
                            创建第一个盘点任务
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* 分页 */}
            {total > pageSize && (
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
            )}
        </div>
    );
}