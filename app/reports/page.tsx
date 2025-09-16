'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchAssetReports, fetchBorrowReports, fetchInventoryReports, ReportQueryParams } from '@/lib/api/reports';
import { AxiosError } from 'axios';
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Loader2,
  Package,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ReportSummary {
  assetSummary: {
    total_assets: number;
    available_assets: number;
    borrowed_assets: number;
    maintenance_assets: number;
    total_value: number;
  };
  borrowSummary: {
    active_borrows: number;
    overdue_borrows: number;
    total_borrows: number;
  };
  inventorySummary: {
    completed_tasks: number;
    active_tasks: number;
    accuracy_rate: number;
  };
}

interface RecentReport {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  downloadUrl?: string;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [tempDateRange, setTempDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isCustomRange, setIsCustomRange] = useState(false);

  const buildQueryParams = useCallback((): ReportQueryParams => {
    const params: ReportQueryParams = {};
    
    // 如果设置了自定义时间范围，优先使用自定义时间范围
    if (customDateRange.startDate && customDateRange.endDate) {
      params.start_date = customDateRange.startDate;
      params.end_date = customDateRange.endDate;
    } else {
      // 否则根据统计周期设置时间范围
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      params.start_date = startDate.toISOString().split('T')[0];
      params.end_date = now.toISOString().split('T')[0];
    }
    
    return params;
  }, [selectedPeriod, customDateRange.startDate, customDateRange.endDate]);

  const loadReportSummary = useCallback(async () => {
    try {
      setLoading(true);
      
      // 根据选择的统计周期和时间范围构建查询参数
      const queryParams = buildQueryParams();
      
      const [assetData, borrowData, inventoryData] = await Promise.all([
        fetchAssetReports(queryParams),
        fetchBorrowReports(queryParams),
        fetchInventoryReports(queryParams),
        // fetchDashboardReports() // 这个API不支持参数，暂时不使用
      ]);

      setReportSummary({
        assetSummary: {
          total_assets: assetData.summary.total_assets,
          available_assets: assetData.summary.available_assets,
          borrowed_assets: assetData.summary.borrowed_assets,
          maintenance_assets: assetData.summary.maintenance_assets,
          total_value: assetData.summary.total_value,
        },
        borrowSummary: {
          active_borrows: borrowData.summary.active_borrows,
          overdue_borrows: borrowData.summary.overdue_borrows,
          total_borrows: borrowData.summary.total_borrows,
        },
        inventorySummary: {
          completed_tasks: inventoryData.summary.completed_tasks,
          active_tasks: inventoryData.summary.in_progress_tasks,
          accuracy_rate: inventoryData.summary.accuracy_rate,
        },
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.status !== 403) {
          toast.error('加载报表概览失败');
        }
      }
      console.error('Failed to load report summary:', error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    loadReportSummary();
    loadRecentReports();
  }, [selectedPeriod, loadReportSummary]); // 只在统计周期变化时触发

  const loadRecentReports = async () => {
    try {
      // 这里应该从API获取最近生成的报表列表
      // 暂时使用空数组，实际项目中需要实现相应的API接口
      const response = await fetch('/api/reports/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentReports(data.data || []);
      } else {
        // 如果API不存在，使用空数组
        setRecentReports([]);
      }
    } catch (error) {
      console.error('Failed to load recent reports:', error);
      // 如果API调用失败，使用空数组
      setRecentReports([]);
    }
  };

  const reportCategories = [
    {
      title: '资产统计报表',
      description: '查看资产分布、价值分析、状态统计等信息',
      icon: Package,
      href: '/reports/assets',
      color: 'bg-blue-500',
      stats: reportSummary ? [
        { label: '总资产', value: reportSummary.assetSummary.total_assets.toLocaleString() },
        { label: '总价值', value: reportSummary.assetSummary.total_value >= 1000000 
          ? `¥${(reportSummary.assetSummary.total_value / 1000000).toFixed(1)}M`
          : reportSummary.assetSummary.total_value >= 10000
          ? `¥${(reportSummary.assetSummary.total_value / 10000).toFixed(1)}万`
          : `¥${reportSummary.assetSummary.total_value.toFixed(1)}` },
        { label: '可用率', value: reportSummary.assetSummary.total_assets > 0 
          ? `${((reportSummary.assetSummary.available_assets / reportSummary.assetSummary.total_assets) * 100).toFixed(1)}%`
          : '0%' },
      ] : [
        { label: '总资产', value: '-' },
        { label: '总价值', value: '-' },
        { label: '可用率', value: '-' },
      ],
    },
    {
      title: '借用统计报表',
      description: '分析借用趋势、超期情况、热门资产等',
      icon: Users,
      href: '/reports/borrow',
      color: 'bg-green-500',
      stats: reportSummary ? [
        { label: '活跃借用', value: reportSummary.borrowSummary.active_borrows.toString() },
        { label: '超期数量', value: reportSummary.borrowSummary.overdue_borrows.toString() },
        { label: '超期率', value: reportSummary.borrowSummary.active_borrows > 0 
          ? `${((reportSummary.borrowSummary.overdue_borrows / reportSummary.borrowSummary.active_borrows) * 100).toFixed(1)}%`
          : '0%' },
      ] : [
        { label: '活跃借用', value: '-' },
        { label: '超期数量', value: '-' },
        { label: '超期率', value: '-' },
      ],
    },
    {
      title: '盘点统计报表',
      description: '查看盘点任务执行情况、准确率分析等',
      icon: ClipboardList,
      href: '/reports/inventory',
      color: 'bg-purple-500',
      stats: reportSummary ? [
        { label: '完成任务', value: reportSummary.inventorySummary.completed_tasks.toString() },
        { label: '准确率', value: `${reportSummary.inventorySummary.accuracy_rate.toFixed(1)}%` },
        { label: '进行中', value: reportSummary.inventorySummary.active_tasks.toString() },
      ] : [
        { label: '完成任务', value: '-' },
        { label: '准确率', value: '-' },
        { label: '进行中', value: '-' },
      ],
    },
  ];

  const quickActions = [
    {
      title: '导出资产清单',
      description: '导出完整的资产清单Excel文件',
      action: 'export-assets',
      icon: Download,
    },
    {
      title: '生成月度报告',
      description: '生成本月的综合统计报告',
      action: 'monthly-report',
      icon: FileText,
    },
    {
      title: '自定义报表',
      description: '创建个性化的数据分析报表',
      action: 'custom-report',
      icon: BarChart3,
    },
  ];

  const handleDateRangeApply = () => {
    if (tempDateRange.startDate && tempDateRange.endDate) {
      // 验证日期范围
      const startDate = new Date(tempDateRange.startDate);
      const endDate = new Date(tempDateRange.endDate);
      
      if (startDate > endDate) {
        toast.error('开始日期不能晚于结束日期');
        return;
      }
      
      // 应用时间范围并重新加载数据
      setCustomDateRange({ ...tempDateRange });
      setIsCustomRange(true);
      toast.success(`已设置时间范围: ${tempDateRange.startDate} 至 ${tempDateRange.endDate}`);
      setIsDateRangeOpen(false);
      // 手动触发数据重新加载
      loadReportSummary();
    } else {
      toast.error('请选择开始和结束日期');
    }
  };

  const handleDateRangeReset = () => {
    setTempDateRange({
      startDate: '',
      endDate: '',
    });
    setCustomDateRange({
      startDate: '',
      endDate: '',
    });
    setIsCustomRange(false);
    toast.success('已重置时间范围，将使用当前统计周期');
    setIsDateRangeOpen(false);
    // 手动触发数据重新加载
    loadReportSummary();
  };

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'export-assets':
        try {
          // 使用动态导入避免循环依赖
          const { exportAssetInventory, downloadFile } = await import('@/lib/api/reports');
          const blob = await exportAssetInventory();
          const filename = `资产清单_${new Date().toISOString().split('T')[0]}.xlsx`;
          downloadFile(blob, filename);
          toast.success('资产清单导出成功');
        } catch (error) {
          console.error('导出资产清单失败:', error);
        }
        break;
      case 'monthly-report':
        try {
          // 使用动态导入避免循环依赖
          const { generateMonthlyReport, downloadFile } = await import('@/lib/api/reports');
          const currentMonth = new Date().toISOString().slice(0, 7);
          const blob = await generateMonthlyReport(currentMonth);
          const filename = `月度报告_${currentMonth}.pdf`;
          downloadFile(blob, filename);
          toast.success('月度报告生成成功');
        } catch (error) {
          console.error('生成月度报告失败:', error);
        }
        break;
      case 'custom-report':
        // 跳转到自定义报表页面
        window.location.href = '/reports/custom';
        break;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载报表数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">报表统计</h1>
          <p className="text-muted-foreground">查看和分析资产管理系统的各项统计数据</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadReportSummary}>
            <Filter className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Dialog open={isDateRangeOpen} onOpenChange={(open) => {
            setIsDateRangeOpen(open);
            if (open) {
              // 打开弹窗时，将当前的自定义时间范围复制到临时状态
              setTempDateRange({ ...customDateRange });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                时间范围
                {customDateRange.startDate && customDateRange.endDate && (
                  <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {customDateRange.startDate} ~ {customDateRange.endDate}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>设置时间范围</DialogTitle>
                <DialogDescription>
                  选择自定义的时间范围来筛选报表数据，点击应用按钮确认筛选。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">
                    开始日期
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={tempDateRange.startDate}
                    onChange={(e) => setTempDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end-date" className="text-right">
                    结束日期
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={tempDateRange.endDate}
                    onChange={(e) => setTempDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDateRangeReset}>
                  重置
                </Button>
                <Button onClick={handleDateRangeApply}>
                  应用
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 时间周期选择 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">统计周期:</span>
        {isCustomRange ? (
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              className="bg-primary"
            >
              自定义: {customDateRange.startDate} ~ {customDateRange.endDate}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCustomRange(false);
                setCustomDateRange({ startDate: '', endDate: '' });
                loadReportSummary();
              }}
            >
              清除自定义
            </Button>
          </div>
        ) : (
          ['week', 'month', 'quarter', 'year'].map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedPeriod(period);
                setIsCustomRange(false);
                setCustomDateRange({ startDate: '', endDate: '' });
              }}
            >
              {period === 'week' && '本周'}
              {period === 'month' && '本月'}
              {period === 'quarter' && '本季度'}
              {period === 'year' && '本年'}
            </Button>
          ))
        )}
      </div>

      {/* 报表分类卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCategories.map(category => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${category.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary">
                    {isCustomRange ? `自定义: ${customDateRange.startDate} ~ ${customDateRange.endDate}` : (
                      <>
                        {selectedPeriod === 'week' && '本周'}
                        {selectedPeriod === 'month' && '本月'}
                        {selectedPeriod === 'quarter' && '本季度'}
                        {selectedPeriod === 'year' && '本年'}
                      </>
                    )}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-3 gap-4">
                  {category.stats.map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="text-primary text-2xl font-bold">{stat.value}</div>
                      <div className="text-muted-foreground text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <Link href={category.href}>
                  <Button className="w-full">
                    查看详细报表
                    <TrendingUp className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用的报表生成和导出功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-colors"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="text-muted-foreground text-sm">{action.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 最近生成的报表 */}
      <Card>
        <CardHeader>
          <CardTitle>最近生成的报表</CardTitle>
          <CardDescription>查看最近生成的报表文件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-muted-foreground h-5 w-5" />
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {report.type} • {report.date} • {report.size}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // API返回的是 download_url，但JavaScript会自动转换为 downloadUrl
                      const downloadUrl = report.downloadUrl;
                      if (downloadUrl) {
                        try {
                          // 使用fetch进行下载，这样可以更好地处理错误
                          fetch(downloadUrl)
                            .then(response => {
                              if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                              }
                              return response.blob();
                            })
                            .then(blob => {
                              // 创建下载链接
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.style.display = 'none';
                              a.href = url;
                              a.download = report.name;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                              toast.success('报表下载成功');
                            })
                            .catch(error => {
                              console.error('Download failed:', error);
                              toast.error('下载失败，请稍后重试');
                            });
                        } catch (error) {
                          console.error('Download error:', error);
                          toast.error('下载失败，请稍后重试');
                        }
                      } else {
                        toast.info('下载链接不可用');
                        console.log('Report data:', report); // 调试信息
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center">
                <div className="text-center">
                  <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground">暂无最近生成的报表</p>
                  <p className="text-muted-foreground text-sm">生成报表后将显示在这里</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
