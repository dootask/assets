'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { downloadFile, exportInventoryReports, fetchInventoryReports, InventoryReportData } from '@/lib/api/reports';
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
    ClipboardList,
    Download,
    Filter,
    Target,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function InventoryReportsPage() {
  const [reportData, setReportData] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await fetchInventoryReports();
      setReportData(data);
    } catch (error) {
      console.error('Failed to load inventory reports:', error);
      toast.error('加载盘点报表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      setExporting(true);
      const blob = await exportInventoryReports(format);
      const filename = `盘点统计报表_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      downloadFile(blob, filename);
      toast.success('报表导出成功');
    } catch (error) {
      console.error('Failed to export inventory reports:', error);
      toast.error('报表导出失败');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">无法加载报表数据</h3>
          <p className="text-muted-foreground mb-4">请稍后重试</p>
          <Button onClick={loadReportData}>重新加载</Button>
        </div>
      </div>
    );
  }

  const { summary, task_analysis, result_analysis, department_analysis, category_analysis, trend_analysis } = reportData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">盘点统计报表</h1>
          <p className="text-muted-foreground">
            查看盘点任务执行情况、准确率分析等信息
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            时间范围
          </Button>
          <Button 
            onClick={() => handleExport('excel')} 
            disabled={exporting}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? '导出中...' : '导出Excel'}
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_tasks}</div>
            <p className="text-xs text-muted-foreground">
              已完成: {summary.completed_tasks} | 进行中: {summary.in_progress_tasks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总记录数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_records.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              盘点记录总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">整体准确率</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.accuracy_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              盘点准确率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理任务</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending_tasks}</div>
            <p className="text-xs text-muted-foreground">
              等待开始的盘点任务
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">任务分析</TabsTrigger>
          <TabsTrigger value="results">结果分析</TabsTrigger>
          <TabsTrigger value="department">按部门分析</TabsTrigger>
          <TabsTrigger value="category">按分类分析</TabsTrigger>
          <TabsTrigger value="trend">趋势分析</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                盘点任务分析
              </CardTitle>
              <CardDescription>
                查看各盘点任务的执行情况和准确率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task_analysis.map((task) => (
                  <div key={task.task_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{task.task_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.task_type === 'full' && '全盘'}
                          {task.task_type === 'category' && '按分类盘点'}
                          {task.task_type === 'department' && '按部门盘点'}
                          {task.start_date && ` • ${new Date(task.start_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            task.status === 'completed' ? 'default' : 
                            task.status === 'in_progress' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {task.status === 'completed' && '已完成'}
                          {task.status === 'in_progress' && '进行中'}
                          {task.status === 'pending' && '待开始'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{task.total_assets}</div>
                        <div className="text-muted-foreground">总资产</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{task.checked_assets}</div>
                        <div className="text-muted-foreground">已检查</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{task.normal_count}</div>
                        <div className="text-muted-foreground">正常</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">
                          {task.surplus_count + task.deficit_count + task.damaged_count}
                        </div>
                        <div className="text-muted-foreground">异常</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-primary">{task.accuracy_rate.toFixed(1)}%</div>
                        <div className="text-muted-foreground">准确率</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>盘点结果分布</CardTitle>
                <CardDescription>
                  各种盘点结果的数量分布
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result_analysis.normal_count}
                    </div>
                    <div className="text-sm font-medium mt-1">正常</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result_analysis.normal_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result_analysis.surplus_count}
                    </div>
                    <div className="text-sm font-medium mt-1">盘盈</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result_analysis.surplus_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {result_analysis.deficit_count}
                    </div>
                    <div className="text-sm font-medium mt-1">盘亏</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result_analysis.deficit_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {result_analysis.damaged_count}
                    </div>
                    <div className="text-sm font-medium mt-1">损坏</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result_analysis.damaged_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>准确率分析</CardTitle>
                <CardDescription>
                  盘点准确率的详细分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">整体准确率</span>
                    <span className="text-2xl font-bold text-green-600">
                      {result_analysis.normal_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full" 
                      style={{ width: `${result_analysis.normal_rate}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">
                        {result_analysis.surplus_rate.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground">盘盈率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-medium">
                        {result_analysis.deficit_rate.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground">盘亏率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-medium">
                        {result_analysis.damaged_rate.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground">损坏率</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                按部门分析
              </CardTitle>
              <CardDescription>
                各部门的盘点情况和准确率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {department_analysis.map((department, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{department.department_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        总资产: {department.total_assets} | 已检查: {department.checked_assets} | 问题: {department.issue_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {department.accuracy_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        准确率
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>按分类分析</CardTitle>
              <CardDescription>
                各分类的盘点情况和准确率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category_analysis.map((category) => (
                  <div key={category.category_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{category.category_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        总资产: {category.total_assets} | 已检查: {category.checked_assets} | 问题: {category.issue_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {category.accuracy_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        准确率
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                趋势分析
              </CardTitle>
              <CardDescription>
                盘点任务数量和准确率的月度趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trend_analysis.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{trend.month}</h4>
                      <p className="text-sm text-muted-foreground">
                        盘点任务: {trend.task_count} 个
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {trend.accuracy_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        准确率
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}