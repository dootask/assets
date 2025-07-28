'use client';

import {
  AssetCategoryChart,
  AssetDepartmentChart,
  AssetPurchaseTrendChart,
  AssetStatusChart,
  AssetValueAnalysisChart,
} from '@/components/charts/asset-charts';
import { ExportDialog, type ExportOptions } from '@/components/reports/export-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AssetReportData,
  downloadFile,
  exportAssetReports,
  fetchAssetReports,
  ReportQueryParams,
} from '@/lib/api/reports';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Package,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AssetReportsPage() {
  const [reportData, setReportData] = useState<AssetReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await fetchAssetReports();
      setReportData(data);
    } catch (error) {
      console.error('Failed to load asset reports:', error);
      toast.error('加载资产报表失败');
    } finally {
      setLoading(false);
    }
  };

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

      const blob = await exportAssetReports(options.format, queryParams);
      const filename = `资产统计报表_${new Date().toISOString().split('T')[0]}.${options.format === 'excel' ? 'xlsx' : 'csv'}`;
      downloadFile(blob, filename);
      toast.success('报表导出成功');
    } catch (error) {
      console.error('Failed to export asset reports:', error);
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
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
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
          <AlertCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">无法加载报表数据</h3>
          <p className="text-muted-foreground mb-4">请稍后重试</p>
          <Button onClick={loadReportData}>重新加载</Button>
        </div>
      </div>
    );
  }

  const { summary, by_category, by_department, by_status, by_purchase_year, value_analysis, warranty_status } =
    reportData;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">资产统计报表</h1>
          <p className="text-muted-foreground">查看资产分布、价值分析、状态统计等详细信息</p>
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
          <ExportDialog reportType="asset" onExport={handleExport}>
            <Button size="sm" disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? '导出中...' : '导出报表'}
            </Button>
          </ExportDialog>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产数</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_assets.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">
              可用: {summary.available_assets} | 借用中: {summary.borrowed_assets}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总价值</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{(summary.total_value / 10000).toFixed(1)}万</div>
            <p className="text-muted-foreground text-xs">平均价值: ¥{value_analysis.average_value.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用率</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((summary.available_assets / summary.total_assets) * 100).toFixed(1)}%
            </div>
            <p className="text-muted-foreground text-xs">
              维护中: {summary.maintenance_assets} | 已报废: {summary.scrapped_assets}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保修状态</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warranty_status.in_warranty}</div>
            <p className="text-muted-foreground text-xs">保修期内资产数量</p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="category" className="space-y-4">
        <TabsList className="gap-2">
          <TabsTrigger value="category">按分类统计</TabsTrigger>
          <TabsTrigger value="department">按部门统计</TabsTrigger>
          <TabsTrigger value="status">按状态统计</TabsTrigger>
          <TabsTrigger value="value">价值分析</TabsTrigger>
          <TabsTrigger value="trend">采购趋势</TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AssetCategoryChart data={by_category} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  分类详细数据
                </CardTitle>
                <CardDescription>查看不同分类的资产分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {by_category.map(category => (
                    <div key={category.category_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{category.category_name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {category.asset_count} 个资产 • ¥{category.total_value.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <AssetDepartmentChart data={by_department} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                部门详细数据
              </CardTitle>
              <CardDescription>查看不同部门的资产分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {by_department.map((department, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{department.department_name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {department.asset_count} 个资产 • ¥{department.total_value.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{department.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AssetStatusChart data={by_status} />
            <Card>
              <CardHeader>
                <CardTitle>状态详细数据</CardTitle>
                <CardDescription>查看不同状态的资产分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {by_status.map(status => (
                    <div key={status.status} className="rounded-lg border p-4 text-center">
                      <div className="text-primary text-2xl font-bold">{status.count}</div>
                      <div className="mt-1 text-sm font-medium">
                        {status.status === 'available' && '可用'}
                        {status.status === 'borrowed' && '借用中'}
                        {status.status === 'maintenance' && '维护中'}
                        {status.status === 'scrapped' && '已报废'}
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">{status.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="value" className="space-y-4">
          <AssetValueAnalysisChart data={value_analysis} />
          <Card>
            <CardHeader>
              <CardTitle>价值分析详细数据</CardTitle>
              <CardDescription>按价值区间分析资产分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{value_analysis.high_value}</div>
                  <div className="mt-1 text-sm font-medium">高价值资产</div>
                  <div className="text-muted-foreground mt-1 text-xs">&gt; ¥10,000</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{value_analysis.medium_value}</div>
                  <div className="mt-1 text-sm font-medium">中等价值资产</div>
                  <div className="text-muted-foreground mt-1 text-xs">¥1,000 - ¥10,000</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{value_analysis.low_value}</div>
                  <div className="mt-1 text-sm font-medium">低价值资产</div>
                  <div className="text-muted-foreground mt-1 text-xs">&lt; ¥1,000</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{value_analysis.no_value}</div>
                  <div className="mt-1 text-sm font-medium">无价值信息</div>
                  <div className="text-muted-foreground mt-1 text-xs">未录入价格</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <AssetPurchaseTrendChart data={by_purchase_year} />
          <Card>
            <CardHeader>
              <CardTitle>采购趋势详细数据</CardTitle>
              <CardDescription>按年份查看资产采购情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {by_purchase_year.map(year => (
                  <div key={year.year} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{year.year}年</h4>
                      <p className="text-muted-foreground text-sm">采购 {year.count} 个资产</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">¥{year.total_value.toLocaleString()}</div>
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
