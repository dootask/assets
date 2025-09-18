'use client';

import { AdvancedBarChart } from '@/components/charts/advanced-charts';
import {
  AssetCategoryChart,
  AssetDepartmentChart,
  AssetPurchaseTrendChart,
  AssetStatusChart,
  AssetValueAnalysisChart,
} from '@/components/charts/asset-charts';
import {
  InteractiveAreaChart,
  InteractiveBarChart,
  InteractiveLineChart,
} from '@/components/charts/interactive-charts';
import { ExportDialog, type ExportOptions } from '@/components/reports/export-dialog';
import { ReportFilter, type FilterOptions, type ReportFilterParams } from '@/components/reports/report-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTreeNode, getAllCategories } from '@/lib/api/categories';
import { getAllDepartments } from '@/lib/api/departments';
import {
  AssetReportData,
  downloadFileFromUrl,
  exportAssetReports,
  fetchAssetReports,
  ReportQueryParams,
} from '@/lib/api/reports';
import {
  AlertCircle,
  BarChart3,
  Building2,
  Clock,
  DollarSign,
  Download,
  Loader2,
  MapPin,
  Package,
  PieChart,
  Zap
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AssetReportsPage() {
  const [reportData, setReportData] = useState<AssetReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<ReportFilterParams>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    loadReportData();
    loadFilterOptions();
  }, []);

  const loadReportData = async (queryParams?: ReportQueryParams) => {
    try {
      setLoading(true);
      const data = await fetchAssetReports(queryParams);
      setReportData(data);
    } catch (error) {
      console.error('Failed to load asset reports:', error);
      toast.error('加载资产报表失败');
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
        categories: categoriesData?.map((cat: CategoryTreeNode) => ({ id: cat.id.toString(), name: cat.name })) || [],
        departments: departmentsData.data?.data?.map((dept: { id: number; name: string }) => ({ id: dept.id.toString(), name: dept.name })) || [],
        statuses: [
          { value: 'available', label: '可用' },
          { value: 'borrowed', label: '借用中' },
          { value: 'maintenance', label: '维护中' },
          { value: 'scrapped', label: '已报废' },
        ],
        valueRanges: [
          { value: 'high', label: '高价值 (>¥10,000)' },
          { value: 'medium', label: '中等价值 (¥1,000-¥10,000)' },
          { value: 'low', label: '低价值 (<¥1,000)' },
          { value: 'no_value', label: '无价值信息' },
        ],
        warrantyStatuses: [
          { value: 'in_warranty', label: '保修期内' },
          { value: 'expired', label: '保修期外' },
          { value: 'no_warranty', label: '无保修信息' },
        ],
        borrowDurations: [],
        taskTypes: [],
      };
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
      // 如果API调用失败，使用默认值
      const options: FilterOptions = {
        categories: [],
        departments: [],
        statuses: [
          { value: 'available', label: '可用' },
          { value: 'borrowed', label: '借用中' },
          { value: 'maintenance', label: '维护中' },
          { value: 'scrapped', label: '已报废' },
        ],
        valueRanges: [
          { value: 'high', label: '高价值 (>¥10,000)' },
          { value: 'medium', label: '中等价值 (¥1,000-¥10,000)' },
          { value: 'low', label: '低价值 (<¥1,000)' },
          { value: 'no_value', label: '无价值信息' },
        ],
        warrantyStatuses: [
          { value: 'in_warranty', label: '保修期内' },
          { value: 'expired', label: '保修期外' },
          { value: 'no_warranty', label: '无保修信息' },
        ],
        borrowDurations: [],
        taskTypes: [],
      };
      setFilterOptions(options);
    }
  };

  const handleFilterChange = useCallback((newFilters: ReportFilterParams) => {
    setFilters(newFilters);
    setIsFiltering(true);
    const queryParams: ReportQueryParams = {
      start_date: newFilters.start_date,
      end_date: newFilters.end_date,
      category_id: newFilters.category_id,
      department_id: newFilters.department_id,
      status: newFilters.status,
      value_range: newFilters.value_range,
      warranty_status: newFilters.warranty_status,
      include_sub_categories: newFilters.include_sub_categories,
    };
    loadReportData(queryParams).finally(() => {
      setIsFiltering(false);
    });
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({});
    setIsFiltering(true);
    loadReportData().finally(() => {
      setIsFiltering(false);
    });
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

      const response = await exportAssetReports(options.format, queryParams);
      downloadFileFromUrl(response.data.download_url, response.data.filename);
      toast.success(response.data.message);
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground mt-2">加载报表数据中...</p>
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
          <Button onClick={() => loadReportData()}>重新加载</Button>
        </div>
      </div>
    );
  }

  const { 
    summary, 
    by_category, 
    by_department, 
    by_status, 
    by_purchase_year, 
    value_analysis, 
    warranty_status,
    by_location,
    by_supplier,
    by_purchase_month,
    utilization_rate
  } = reportData;

  // 调试信息
  console.log('Report data:', reportData);
  console.log('Value analysis:', value_analysis);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">资产统计报表</h1>
          <p className="text-muted-foreground">查看资产分布、价值分析、状态统计等详细信息</p>
        </div>
        <div className="flex items-center space-x-2">
          <ExportDialog reportType="asset" onExport={handleExport}>
            <Button size="sm" disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? '导出中...' : '导出报表'}
            </Button>
          </ExportDialog>
        </div>
      </div>

      {/* 筛选组件 */}
      {filterOptions && (
        <div className="relative">
          <ReportFilter
            reportType="asset"
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            initialFilters={filters}
            options={filterOptions}
            useDialog={true}
          />
          {isFiltering && (
            <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在筛选...
            </div>
          )}
        </div>
      )}

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
            <div className="text-2xl font-bold">
              {summary.total_value >= 1000000 
                ? `¥${(summary.total_value / 1000000).toFixed(1)}M`
                : summary.total_value >= 10000
                ? `¥${(summary.total_value / 10000).toFixed(1)}万`
                : `¥${summary.total_value.toFixed(1)}`}
            </div>
            <p className="text-muted-foreground text-xs">平均价值: ¥{value_analysis.average_value.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">利用率</CardTitle>
            <Zap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {utilization_rate.utilization_rate.toFixed(1)}%
            </div>
            <p className="text-muted-foreground text-xs">
              借用率: {utilization_rate.borrow_rate.toFixed(1)}%
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

      {/* 新增统计卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">位置分布</CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{by_location?.length || 0}</div>
            <p className="text-muted-foreground text-xs">不同位置数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">供应商</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{by_supplier?.length || 0}</div>
            <p className="text-muted-foreground text-xs">不同供应商数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">采购月份</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{by_purchase_month?.length || 0}</div>
            <p className="text-muted-foreground text-xs">有采购记录的月份</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">状态分布</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{by_status?.length || 0}</div>
            <p className="text-muted-foreground text-xs">不同状态数量</p>
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
          <TabsTrigger value="location">位置分析</TabsTrigger>
          <TabsTrigger value="supplier">供应商分析</TabsTrigger>
          <TabsTrigger value="interactive">交互图表</TabsTrigger>
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
                  {by_category?.map(category => (
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
                {by_department?.map((department, index) => (
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
                  {by_status?.map(status => (
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
                  <div className="text-2xl font-bold text-red-600">{value_analysis?.high_value || 0}</div>
                  <div className="mt-1 text-sm font-medium">高价值资产</div>
                  <div className="text-muted-foreground mt-1 text-xs">&gt; ¥10,000</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{value_analysis?.medium_value || 0}</div>
                  <div className="mt-1 text-sm font-medium">中等价值资产</div>
                  <div className="text-muted-foreground mt-1 text-xs">¥1,000 - ¥10,000</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{value_analysis?.low_value || 0}</div>
                  <div className="mt-1 text-sm font-medium">低价值资产</div>
                  <div className="text-muted-foreground mt-1 text-xs">&lt; ¥1,000</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{value_analysis?.no_value || 0}</div>
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
                {by_purchase_year?.map(year => (
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

        <TabsContent value="location" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AdvancedBarChart
              data={by_location || []}
              title="按位置统计"
              description="资产在不同位置的分布情况"
              dataKey="asset_count"
              xAxisKey="location"
              height={300}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  位置详细数据
                </CardTitle>
                <CardDescription>查看不同位置的资产分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {by_location?.map((location, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{location.location}</h4>
                        <p className="text-muted-foreground text-sm">
                          {location.count} 个资产 • ¥{location.total_value.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{location.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supplier" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AdvancedBarChart
              data={by_supplier || []}
              title="按供应商统计"
              description="不同供应商的资产分布情况"
              dataKey="asset_count"
              xAxisKey="supplier"
              height={300}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  供应商详细数据
                </CardTitle>
                <CardDescription>查看不同供应商的资产分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {by_supplier?.map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{supplier.supplier}</h4>
                        <p className="text-muted-foreground text-sm">
                          {supplier.count} 个资产 • ¥{supplier.total_value.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{supplier.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <InteractiveLineChart
              data={by_purchase_month || []}
              title="采购趋势分析"
              description="按月份查看资产采购趋势"
              dataKeys={[
                { key: 'asset_count', name: '采购数量', color: '#0088FE' },
                { key: 'total_value', name: '采购价值', color: '#00C49F' }
              ]}
              xAxisKey="month"
              height={400}
              showBrush={true}
            />
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <InteractiveAreaChart
                data={by_purchase_year || []}
                title="年度采购面积图"
                description="按年份的采购价值分布"
                dataKeys={[
                  { key: 'total_value', name: '采购价值', color: '#FFBB28' }
                ]}
                xAxisKey="year"
                height={300}
              />
              
              <InteractiveBarChart
                data={by_category || []}
                title="分类统计柱状图"
                description="按分类的资产数量对比"
                dataKeys={[
                  { key: 'asset_count', name: '资产数量', color: '#FF8042' }
                ]}
                xAxisKey="category_name"
                height={300}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
