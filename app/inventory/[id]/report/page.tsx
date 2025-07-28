'use client';

import { Loading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InventoryReportResponse } from '@/lib/api/inventory';
import { getInventoryReport } from '@/lib/api/inventory';
import { AlertCircle, CheckCircle, Download, Printer, XCircle } from 'lucide-react';
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

export default function InventoryReportPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = parseInt(params.id as string);
    
    const [report, setReport] = useState<InventoryReportResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (taskId) {
            loadReport();
        }
    }, [taskId]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const response = await getInventoryReport(taskId);
            if (response.code === 'SUCCESS') {
                setReport(response.data);
            } else {
                toast.error(response.message || '获取盘点报告失败');
            }
        } catch (error) {
            console.error('获取盘点报告失败:', error);
            toast.error('获取盘点报告失败');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        // TODO: 实现导出功能
        toast.info('导出功能开发中...');
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('zh-CN');
    };

    if (loading) {
        return <Loading />;
    }

    if (!report) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <div className="text-gray-500">盘点报告不存在</div>
                    <Button className="mt-4" onClick={() => router.push('/inventory')}>
                        返回盘点管理
                    </Button>
                </div>
            </div>
        );
    }

    const { task, summary, records, category_stats, department_stats } = report;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">盘点报告</h1>
                            <Badge className={statusColors[task.status]}>
                                {statusLabels[task.status]}
                            </Badge>
                        </div>
                        <p className="text-gray-600 mt-1">{task.task_name}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        打印
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        导出
                    </Button>
                </div>
            </div>

            {/* 打印样式 */}
            <style jsx global>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    .container {
                        max-width: none !important;
                        padding: 0 !important;
                    }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                    }
                }
            `}</style>

            <div className="space-y-6">
                {/* 报告头部 */}
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">资产盘点报告</CardTitle>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>任务名称: {task.task_name}</div>
                            <div>盘点类型: {taskTypeLabels[task.task_type]}</div>
                            <div>报告生成时间: {new Date().toLocaleString('zh-CN')}</div>
                        </div>
                    </CardHeader>
                </Card>

                {/* 任务基本信息 */}
                <Card>
                    <CardHeader>
                        <CardTitle>任务信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">创建人:</span>
                                    <span>{task.created_by || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">创建时间:</span>
                                    <span>{formatDate(task.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">开始时间:</span>
                                    <span>{formatDate(task.start_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">结束时间:</span>
                                    <span>{formatDate(task.end_date)}</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600 mb-2">备注:</div>
                                <div className="text-sm bg-gray-50 p-3 rounded">
                                    {task.notes || '无备注'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 盘点汇总 */}
                <Card>
                    <CardHeader>
                        <CardTitle>盘点汇总</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{summary.total_assets}</div>
                                <div className="text-sm text-gray-600">总资产</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{summary.checked_assets}</div>
                                <div className="text-sm text-gray-600">已盘点</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-600">{summary.normal_assets}</div>
                                <div className="text-sm text-gray-600">正常</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{summary.surplus_assets}</div>
                                <div className="text-sm text-gray-600">盘盈</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">{summary.deficit_assets}</div>
                                <div className="text-sm text-gray-600">盘亏</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">{summary.damaged_assets}</div>
                                <div className="text-sm text-gray-600">损坏</div>
                            </div>
                        </div>
                        
                        {/* 完成率 */}
                        <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>盘点完成率</span>
                                <span>{summary.progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-blue-600 h-3 rounded-full"
                                    style={{ width: `${summary.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="category" className="space-y-6">
                    <TabsList className="print:hidden">
                        <TabsTrigger value="category">分类统计</TabsTrigger>
                        <TabsTrigger value="department">部门统计</TabsTrigger>
                        <TabsTrigger value="records">详细记录</TabsTrigger>
                    </TabsList>

                    {/* 分类统计 */}
                    <TabsContent value="category">
                        <Card>
                            <CardHeader>
                                <CardTitle>分类统计</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>分类名称</TableHead>
                                            <TableHead className="text-center">总资产</TableHead>
                                            <TableHead className="text-center">已盘点</TableHead>
                                            <TableHead className="text-center">正常</TableHead>
                                            <TableHead className="text-center">盘盈</TableHead>
                                            <TableHead className="text-center">盘亏</TableHead>
                                            <TableHead className="text-center">损坏</TableHead>
                                            <TableHead className="text-center">完成率</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {category_stats.map((stat) => {
                                            const completionRate = stat.total_assets > 0 
                                                ? (stat.checked_assets / stat.total_assets * 100).toFixed(1)
                                                : '0.0';
                                            return (
                                                <TableRow key={stat.category_id}>
                                                    <TableCell className="font-medium">{stat.category_name}</TableCell>
                                                    <TableCell className="text-center">{stat.total_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.checked_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.normal_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.surplus_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.deficit_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.damaged_assets}</TableCell>
                                                    <TableCell className="text-center">{completionRate}%</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 部门统计 */}
                    <TabsContent value="department">
                        <Card>
                            <CardHeader>
                                <CardTitle>部门统计</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>部门名称</TableHead>
                                            <TableHead className="text-center">总资产</TableHead>
                                            <TableHead className="text-center">已盘点</TableHead>
                                            <TableHead className="text-center">正常</TableHead>
                                            <TableHead className="text-center">盘盈</TableHead>
                                            <TableHead className="text-center">盘亏</TableHead>
                                            <TableHead className="text-center">损坏</TableHead>
                                            <TableHead className="text-center">完成率</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {department_stats.map((stat) => {
                                            const completionRate = stat.total_assets > 0 
                                                ? (stat.checked_assets / stat.total_assets * 100).toFixed(1)
                                                : '0.0';
                                            return (
                                                <TableRow key={stat.department_id}>
                                                    <TableCell className="font-medium">{stat.department_name}</TableCell>
                                                    <TableCell className="text-center">{stat.total_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.checked_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.normal_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.surplus_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.deficit_assets}</TableCell>
                                                    <TableCell className="text-center">{stat.damaged_assets}</TableCell>
                                                    <TableCell className="text-center">{completionRate}%</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 详细记录 */}
                    <TabsContent value="records">
                        <Card>
                            <CardHeader>
                                <CardTitle>盘点记录详情</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                                            <TableHead>备注</TableHead>
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
                                                    <TableCell>{record.notes || '-'}</TableCell>
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}