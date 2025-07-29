'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart3,
    Calendar,
    ClipboardList,
    Download,
    FileText,
    Filter,
    Package,
    TrendingUp,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reportCategories = [
    {
      title: '资产统计报表',
      description: '查看资产分布、价值分析、状态统计等信息',
      icon: Package,
      href: '/reports/assets',
      color: 'bg-blue-500',
      stats: [
        { label: '总资产', value: '1,234' },
        { label: '总价值', value: '¥2.5M' },
        { label: '可用率', value: '85%' },
      ],
    },
    {
      title: '借用统计报表',
      description: '分析借用趋势、超期情况、热门资产等',
      icon: Users,
      href: '/reports/borrow',
      color: 'bg-green-500',
      stats: [
        { label: '活跃借用', value: '156' },
        { label: '超期数量', value: '12' },
        { label: '超期率', value: '7.7%' },
      ],
    },
    {
      title: '盘点统计报表',
      description: '查看盘点任务执行情况、准确率分析等',
      icon: ClipboardList,
      href: '/reports/inventory',
      color: 'bg-purple-500',
      stats: [
        { label: '完成任务', value: '8' },
        { label: '准确率', value: '96.5%' },
        { label: '待处理', value: '2' },
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

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'export-assets':
        try {
          // 使用动态导入避免循环依赖
          const { exportAssetInventory, downloadFile } = await import('@/lib/api/reports');
          const blob = await exportAssetInventory();
          const filename = `资产清单_${new Date().toISOString().split('T')[0]}.xlsx`;
          downloadFile(blob, filename);
          // 临时使用toast模拟，实际项目中应使用toast库
          console.log('资产清单导出成功');
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
          console.log('月度报告生成成功');
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

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">报表统计</h1>
          <p className="text-muted-foreground">查看和分析资产管理系统的各项统计数据</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            时间范围
          </Button>
        </div>
      </div>

      {/* 时间周期选择 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">统计周期:</span>
        {['week', 'month', 'quarter', 'year'].map(period => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'week' && '本周'}
            {period === 'month' && '本月'}
            {period === 'quarter' && '本季度'}
            {period === 'year' && '本年'}
          </Button>
        ))}
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
                    {selectedPeriod === 'week' && '本周'}
                    {selectedPeriod === 'month' && '本月'}
                    {selectedPeriod === 'quarter' && '本季度'}
                    {selectedPeriod === 'year' && '本年'}
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
            {[
              {
                name: '2024年1月资产统计报表.xlsx',
                type: '资产报表',
                date: '2024-01-28 14:30',
                size: '2.3 MB',
              },
              {
                name: '借用情况月度分析.pdf',
                type: '借用报表',
                date: '2024-01-27 09:15',
                size: '1.8 MB',
              },
              {
                name: '盘点结果汇总.xlsx',
                type: '盘点报表',
                date: '2024-01-26 16:45',
                size: '3.1 MB',
              },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center space-x-3">
                  <FileText className="text-muted-foreground h-5 w-5" />
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-muted-foreground text-sm">
                      {report.type} • {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
