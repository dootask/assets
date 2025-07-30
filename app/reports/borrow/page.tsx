'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BorrowReportData, downloadFile, exportBorrowReports, fetchBorrowReports } from '@/lib/api/reports';
import { Activity, AlertTriangle, BarChart3, Calendar, Clock, Download, Filter, Loader2, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BorrowReportsPage() {
  const [reportData, setReportData] = useState<BorrowReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await fetchBorrowReports();
      setReportData(data);
    } catch (error) {
      console.error('Failed to load borrow reports:', error);
      toast.error('加载借用报表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      setExporting(true);
      const blob = await exportBorrowReports(format);
      const filename = `借用统计报表_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      downloadFile(blob, filename);
      toast.success('报表导出成功');
    } catch (error) {
      console.error('Failed to export borrow reports:', error);
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

  const { summary, by_department, by_asset, overdue_analysis, monthly_trend, popular_assets } = reportData;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">借用统计报表</h1>
          <p className="text-muted-foreground">分析借用趋势、超期情况、热门资产等信息</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            时间范围
          </Button>
          <Button onClick={() => handleExport('excel')} disabled={exporting} size="sm">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? '导出中...' : '导出Excel'}
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总借用次数</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_borrows.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">
              活跃: {summary.active_borrows} | 已归还: {summary.returned_borrows}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">超期借用</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdue_borrows}</div>
            <p className="text-muted-foreground text-xs">
              超期率: {summary.active_borrows > 0 ? ((summary.overdue_borrows / summary.active_borrows) * 100).toFixed(1) : '0.0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均借用天数</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.average_return_days.toFixed(1)}</div>
            <p className="text-muted-foreground text-xs">天数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃借用</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.active_borrows}</div>
            <p className="text-muted-foreground text-xs">当前借用中的资产数量</p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="department" className="space-y-4">
        <TabsList className="gap-2">
          <TabsTrigger value="department">按部门统计</TabsTrigger>
          <TabsTrigger value="overdue">超期分析</TabsTrigger>
          <TabsTrigger value="trend">借用趋势</TabsTrigger>
          <TabsTrigger value="popular">热门资产</TabsTrigger>
          <TabsTrigger value="assets">资产借用</TabsTrigger>
        </TabsList>

        <TabsContent value="department" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                按部门统计
              </CardTitle>
              <CardDescription>查看不同部门的借用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {by_department?.map((department, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{department.department_name}</h4>
                      <p className="text-muted-foreground text-sm">
                        总借用: {department.borrow_count} | 活跃: {department.active_count} | 超期:{' '}
                        {department.overdue_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{department.percentage.toFixed(1)}%</Badge>
                      {department.overdue_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {department.overdue_count} 超期
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>超期概况</CardTitle>
                <CardDescription>超期借用的整体情况分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">总超期数量</span>
                    <span className="text-2xl font-bold text-red-600">{overdue_analysis.total_overdue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">超期率</span>
                    <span className="text-lg font-semibold">{overdue_analysis.overdue_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">平均超期天数</span>
                    <span className="text-lg font-semibold">{overdue_analysis.average_overdue_days.toFixed(1)} 天</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>按超期天数分布</CardTitle>
                <CardDescription>不同超期时长的分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdue_analysis.by_overdue_days.map(range => (
                    <div key={range.days_range} className="flex items-center justify-between">
                      <span className="text-sm">{range.days_range}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{range.count}</span>
                        <div className="h-2 w-20 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-red-500"
                            style={{
                              width: `${(range.count / overdue_analysis.total_overdue) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                借用趋势
              </CardTitle>
              <CardDescription>月度借用和归还趋势分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthly_trend.map((month, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{month.month}</h4>
                      <p className="text-muted-foreground text-sm">
                        借用: {month.borrow_count} | 归还: {month.return_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-600">{month.borrow_count}</div>
                          <div className="text-muted-foreground text-xs">借用</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">{month.return_count}</div>
                          <div className="text-muted-foreground text-xs">归还</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>热门资产排行</CardTitle>
              <CardDescription>借用次数最多的资产排行榜</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popular_assets?.map(asset => (
                  <div key={asset.asset_id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <span className="text-primary text-sm font-bold">{asset.rank}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{asset.asset_name}</h4>
                        <p className="text-muted-foreground text-sm">{asset.asset_no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary text-lg font-bold">{asset.borrow_count}</div>
                      <div className="text-muted-foreground text-xs">次借用</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>资产借用统计</CardTitle>
              <CardDescription>各资产的详细借用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {by_asset?.slice(0, 10).map(asset => (
                  <div key={asset.asset_id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{asset.asset_name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {asset.asset_no} • 总借用天数: {asset.total_days} 天
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{asset.borrow_count}</div>
                      <div className="text-muted-foreground text-xs">次借用</div>
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
