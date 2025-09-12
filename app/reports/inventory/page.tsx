'use client';

import { ExportDialog, type ExportOptions } from '@/components/reports/export-dialog';
import { ReportFilter, type FilterOptions, type ReportFilterParams } from '@/components/reports/report-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllCategories } from '@/lib/api/categories';
import { getAllDepartments } from '@/lib/api/departments';
import { downloadFile, exportInventoryReports, fetchInventoryReports, InventoryReportData, ReportQueryParams } from '@/lib/api/reports';
import {
    AlertTriangle,
    BarChart3,
    CheckCircle,
    ClipboardList,
    Download,
    Loader2,
    Target,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function InventoryReportsPage() {
  const [reportData, setReportData] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<ReportFilterParams>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  useEffect(() => {
    loadReportData();
    loadFilterOptions();
  }, []);

  const loadReportData = async (queryParams?: ReportQueryParams) => {
    try {
      setLoading(true);
      const data = await fetchInventoryReports(queryParams);
      setReportData(data);
    } catch (error) {
      console.error('Failed to load inventory reports:', error);
      toast.error('加载盘点报表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // 从API获取筛选选项
      const [categoriesData, departmentsData] = await Promise.all([
        getAllCategories(),
        getAllDepartments()
      ]);
      
      const options: FilterOptions = {
        categories: categoriesData?.map((cat: { id: number; name: string }) => ({ id: cat.id.toString(), name: cat.name })) || [],
        departments: departmentsData.data?.data?.map((dept: { id: number; name: string }) => ({ id: dept.id.toString(), name: dept.name })) || [],
        statuses: [
          { value: 'pending', label: '待开始' },
          { value: 'in_progress', label: '进行中' },
          { value: 'completed', label: '已完成' },
        ],
        valueRanges: [],
        warrantyStatuses: [],
        borrowDurations: [],
        taskTypes: [
          { value: 'full', label: '全盘' },
          { value: 'department', label: '部门盘点' },
          { value: 'category', label: '分类盘点' },
          { value: 'spot', label: '抽查' },
        ],
      };
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
      // 如果API调用失败，使用默认值
      const options: FilterOptions = {
        categories: [],
        departments: [],
        statuses: [
          { value: 'pending', label: '待开始' },
          { value: 'in_progress', label: '进行中' },
          { value: 'completed', label: '已完成' },
        ],
        valueRanges: [],
        warrantyStatuses: [],
        borrowDurations: [],
        taskTypes: [
          { value: 'full', label: '全盘' },
          { value: 'department', label: '部门盘点' },
          { value: 'category', label: '分类盘点' },
          { value: 'spot', label: '抽查' },
        ],
      };
      setFilterOptions(options);
    }
  };

  const handleFilterChange = useCallback((newFilters: ReportFilterParams) => {
    setFilters(newFilters);
    const queryParams: ReportQueryParams = {
      start_date: newFilters.start_date,
      end_date: newFilters.end_date,
      category_id: newFilters.category_id,
      department_id: newFilters.department_id,
      status: newFilters.status,
    };
    loadReportData(queryParams);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({});
    loadReportData();
  }, []);

  const handleExport = async (options: ExportOptions) => {
    try {
      setExporting(true);

      // 转换filters类型以匹配ReportQueryParams
      const filters = (options.filters as Record<string, unknown>) || {};
      const queryParams: ReportQueryParams = {
        start_date: options.dateRange?.start_date,
        end_date: options.dateRange?.end_date,
        category_id: filters.category_id ? String(filters.category_id) : undefined,
        department_id: filters.department_id ? String(filters.department_id) : undefined,
        status: filters.status as string,
      };

      const blob = await exportInventoryReports(options.format, queryParams);
      const filename = `盘点统计报表_${new Date().toISOString().split('T')[0]}.${options.format === 'excel' ? 'xlsx' : 'csv'}`;
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
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground mt-2">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">无法加载报表数据</h3>
          <p className="text-muted-foreground mb-4">请稍后重试</p>
          <Button onClick={loadReportData}>重新加载</Button>
        </div>
      </div>
    );
  }

  const { summary, task_analysis, result_analysis, department_analysis, category_analysis, trend_analysis } =
    reportData;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">盘点统计报表</h1>
          <p className="text-muted-foreground">查看盘点任务执行情况、准确率分析等信息</p>
        </div>
        <div className="flex items-center space-x-2">
          <ExportDialog reportType="inventory" onExport={handleExport}>
            <Button size="sm" disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? '导出中...' : '导出报表'}
            </Button>
          </ExportDialog>
        </div>
      </div>

      {/* 筛选组件 */}
      {filterOptions && (
        <ReportFilter
          reportType="inventory"
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
          initialFilters={filters}
          options={filterOptions}
        />
      )}

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <ClipboardList className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_tasks}</div>
            <p className="text-muted-foreground text-xs">
              已完成: {summary.completed_tasks} | 进行中: {summary.in_progress_tasks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总记录数</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_records.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">盘点记录总数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">整体准确率</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.accuracy_rate.toFixed(1)}%</div>
            <p className="text-muted-foreground text-xs">盘点准确率</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理任务</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending_tasks}</div>
            <p className="text-muted-foreground text-xs">等待开始的盘点任务</p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="gap-2">
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
                <ClipboardList className="mr-2 h-5 w-5" />
                盘点任务分析
              </CardTitle>
              <CardDescription>查看各盘点任务的执行情况和准确率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task_analysis?.map(task => (
                  <div key={task.task_id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{task.task_name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {task.task_type === 'full' && '全盘'}
                          {task.task_type === 'category' && '按分类盘点'}
                          {task.task_type === 'department' && '按部门盘点'}
                          {task.start_date && ` • ${new Date(task.start_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'in_progress'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {task.status === 'completed' && '已完成'}
                          {task.status === 'in_progress' && '进行中'}
                          {task.status === 'pending' && '待开始'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
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
                        <div className="text-primary font-medium">{task.accuracy_rate.toFixed(1)}%</div>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>盘点结果分布</CardTitle>
                <CardDescription>各种盘点结果的数量分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{result_analysis.normal_count}</div>
                    <div className="mt-1 text-sm font-medium">正常</div>
                    <div className="text-muted-foreground mt-1 text-xs">{result_analysis.normal_rate.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{result_analysis.surplus_count}</div>
                    <div className="mt-1 text-sm font-medium">盘盈</div>
                    <div className="text-muted-foreground mt-1 text-xs">{result_analysis.surplus_rate.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{result_analysis.deficit_count}</div>
                    <div className="mt-1 text-sm font-medium">盘亏</div>
                    <div className="text-muted-foreground mt-1 text-xs">{result_analysis.deficit_rate.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{result_analysis.damaged_count}</div>
                    <div className="mt-1 text-sm font-medium">损坏</div>
                    <div className="text-muted-foreground mt-1 text-xs">{result_analysis.damaged_rate.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>准确率分析</CardTitle>
                <CardDescription>盘点准确率的详细分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">整体准确率</span>
                    <span className="text-2xl font-bold text-green-600">{result_analysis.normal_rate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-green-500"
                      style={{ width: `${result_analysis.normal_rate}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-blue-600">{result_analysis.surplus_rate.toFixed(1)}%</div>
                      <div className="text-muted-foreground">盘盈率</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-600">{result_analysis.deficit_rate.toFixed(1)}%</div>
                      <div className="text-muted-foreground">盘亏率</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-red-600">{result_analysis.damaged_rate.toFixed(1)}%</div>
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
                <BarChart3 className="mr-2 h-5 w-5" />
                按部门分析
              </CardTitle>
              <CardDescription>各部门的盘点情况和准确率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {department_analysis?.map((department, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{department.department_name}</h4>
                      <p className="text-muted-foreground text-sm">
                        总资产: {department.total_assets} | 已检查: {department.checked_assets} | 问题:{' '}
                        {department.issue_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary text-lg font-bold">{department.accuracy_rate.toFixed(1)}%</div>
                      <div className="text-muted-foreground text-xs">准确率</div>
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
              <CardDescription>各分类的盘点情况和准确率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category_analysis?.map(category => (
                  <div key={category.category_id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{category.category_name}</h4>
                      <p className="text-muted-foreground text-sm">
                        总资产: {category.total_assets} | 已检查: {category.checked_assets} | 问题:{' '}
                        {category.issue_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary text-lg font-bold">{category.accuracy_rate.toFixed(1)}%</div>
                      <div className="text-muted-foreground text-xs">准确率</div>
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
                <TrendingUp className="mr-2 h-5 w-5" />
                趋势分析
              </CardTitle>
              <CardDescription>盘点任务数量和准确率的月度趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trend_analysis?.map(trend => (
                  <div key={trend.month} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{trend.month}</h4>
                      <p className="text-muted-foreground text-sm">盘点任务: {trend.task_count} 个</p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary text-lg font-bold">{trend.accuracy_rate.toFixed(1)}%</div>
                      <div className="text-muted-foreground text-xs">准确率</div>
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
