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
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Play, Search, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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

const resultLabels = {
    normal: '正常',
    surplus: '盘盈',
    deficit: '盘亏',
    damaged: '损坏'
};

const resultColors = {
    normal: 'bg-green-100 text-green-800',
    surplus: 'bg-orange-100 text-orange-800',
    deficit: 'bg-red-100 text-red-800',
    damaged: 'bg-purple-100 text-purple-800'
};

const resultIcons = {
    normal: CheckCircle,
    surplus: AlertCircle,
    deficit: XCircle,
    damaged: AlertCircle
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
    }, [taskId, currentPage, resultFilter, keyword]);

    const loadTask = async () => {
        try {
            setLoading(true);
            const response = await getInventoryTask(taskId);
            if (response.code === 'SUCCESS') {
                setTask(response.data);
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

    const loadRecords = async () => {
        try {
            setRecordsLoading(true);
            const params: InventoryRecordListQuery = {
                page: currentPage,
                page_size: pageSize,
                task_id: taskId,
                result: resultFilter as any || undefined,
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
                <div className="text-center py-12">
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
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{task.task_name}</h1>
                            <Badge className={statusColors[task.status]}>
                                {statusLabels[task.status]}
                            </Badge>
                            <Badge variant="outline">
                                {taskTypeLabels[task.task_type]}
                            </Badge>
                        </div>
                        <p className="text-gray-600 mt-1">盘点任务详情和执行</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {task.status === 'pending' && (
                        <Button onClick={handleStartTask}>
                            <Play className="w-4 h-4 mr-2" />
                            开始盘点
                        </Button>
                    )}
                    {task.status === 'in_progress' && (
                        <Button onClick={handleCompleteTask}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            完成盘点
                        </Button>
                    )}
                    {task.status === 'completed' && (
                        <Button onClick={() => router.push(`/inventory/${task.id}/report`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            查看报告
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="checklist">盘点清单</TabsTrigger>
                    {task.status === 'in_progress' && (
                        <TabsTrigger value="execution">盘点执行</TabsTrigger>
                    )}
                    <TabsTrigger value="records">盘点记录</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* 任务信息 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>任务信息</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <div>
                                    <div className="text-sm text-gray-600 mb-2">备注:</div>
                                    <div className="text-sm bg-gray-50 p-3 rounded">
                                        {task.notes || '无备注'}
                                    </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>盘点进度</span>
                                    <span>{task.progress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
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
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="搜索资产编号或名称..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={resultFilter} onValueChange={setResultFilter}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="盘点结果" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">全部结果</SelectItem>
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
                                <div className="text-center py-8">
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
                                            {records.map((record) => {
                                                const ResultIcon = resultIcons[record.result];
                                                return (
                                                    <TableRow key={record.id}>
                                                        <TableCell className="font-medium">
                                                            {record.asset?.asset_no}
                                                        </TableCell>
                                                        <TableCell>{record.asset?.name}</TableCell>
                                                        <TableCell>{record.asset?.category?.name || '-'}</TableCell>
                                                        <TableCell>{record.asset?.department?.name || '-'}</TableCell>
                                                        <TableCell>{record.expected_status}</TableCell>
                                                        <TableCell>{record.actual_status}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <ResultIcon className="w-4 h-4" />
                                                                <Badge className={resultColors[record.result]}>
                                                                    {resultLabels[record.result]}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{record.checked_by}</TableCell>
                                                        <TableCell>{formatDate(record.checked_at)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    {records.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            暂无盘点记录
                                        </div>
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
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}