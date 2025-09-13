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
  completed: '已完成',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

// 资产状态中文映射
const getAssetStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    available: '可用',
    borrowed: '借用中',
    maintenance: '维修中',
    scrapped: '已报废',
  };
  return statusMap[status] || status;
};

const taskTypeLabels = {
  full: '全盘',
  category: '按分类',
  department: '按部门',
};

const resultLabels = {
  normal: '正常',
  surplus: '盘盈',
  deficit: '盘亏',
  damaged: '损坏',
};

const resultColors = {
  normal: 'bg-green-100 text-green-800',
  surplus: 'bg-orange-100 text-orange-800',
  deficit: 'bg-red-100 text-red-800',
  damaged: 'bg-purple-100 text-purple-800',
};

const resultIcons = {
  normal: CheckCircle,
  surplus: AlertCircle,
  deficit: XCircle,
  damaged: AlertCircle,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleExport = async (format: 'excel' | 'csv' = 'excel') => {
    if (!report) {
      toast.error('报告数据不可用');
      return;
    }

    try {
      // 动态导入导出相关函数
      const { downloadFile } = await import('@/lib/api/reports');
      
      if (format === 'csv') {
        // CSV导出
        const csvData = generateCSVData();
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const filename = `盘点报告_${report.task.task_name}_${new Date().toISOString().split('T')[0]}.csv`;
        downloadFile(blob, filename);
        toast.success('CSV报告导出成功');
        return;
      }
      
      // Excel导出
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // 添加工作表
      const worksheet = workbook.addWorksheet('盘点报告');
      
      // 设置表头样式
      const headerStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      };
      
      // 1. 报告标题
      worksheet.mergeCells('A1:J1');
      worksheet.getCell('A1').value = `盘点报告 - ${report.task.task_name}`;
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      
      // 2. 任务基本信息
      worksheet.mergeCells('A3:J3');
      worksheet.getCell('A3').value = '任务信息';
      worksheet.getCell('A3').font = { bold: true, size: 14 };
      
      const taskInfo = [
        ['任务名称', report.task.task_name],
        ['任务类型', taskTypeLabels[report.task.task_type] || report.task.task_type],
        ['任务状态', statusLabels[report.task.status] || report.task.status],
        ['创建人', report.task.created_by || '-'],
        ['创建时间', formatDate(report.task.created_at)],
        ['开始时间', formatDate(report.task.start_date)],
        ['结束时间', formatDate(report.task.end_date)],
        ['备注', report.task.notes || '无备注']
      ];
      
      taskInfo.forEach(([label, value], index) => {
        worksheet.getCell(`A${4 + index}`).value = label;
        worksheet.getCell(`B${4 + index}`).value = value;
        worksheet.getCell(`A${4 + index}`).font = { bold: true };
      });
      
      // 3. 盘点汇总
      const summaryRow = 13;
      worksheet.mergeCells(`A${summaryRow}:J${summaryRow}`);
      worksheet.getCell(`A${summaryRow}`).value = '盘点汇总';
      worksheet.getCell(`A${summaryRow}`).font = { bold: true, size: 14 };
      
      const summaryData = [
        ['总资产', report.summary.total_assets],
        ['已盘点', report.summary.checked_assets],
        ['正常', report.summary.normal_assets],
        ['盘盈', report.summary.surplus_assets],
        ['盘亏', report.summary.deficit_assets],
        ['损坏', report.summary.damaged_assets],
        ['完成率', `${report.summary.progress.toFixed(1)}%`]
      ];
      
      summaryData.forEach(([label, value], index) => {
        worksheet.getCell(`A${summaryRow + 1 + index}`).value = label;
        worksheet.getCell(`B${summaryRow + 1 + index}`).value = value;
        worksheet.getCell(`A${summaryRow + 1 + index}`).font = { bold: true };
      });
      
      // 4. 详细记录
      const recordsStartRow = summaryRow + 9;
      worksheet.mergeCells(`A${recordsStartRow}:J${recordsStartRow}`);
      worksheet.getCell(`A${recordsStartRow}`).value = '详细记录';
      worksheet.getCell(`A${recordsStartRow}`).font = { bold: true, size: 14 };
      
      // 设置详细记录表头
      const headers = ['资产编号', '资产名称', '分类', '部门', '预期状态', '实际状态', '盘点结果', '盘点人', '盘点时间', '备注'];
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(recordsStartRow + 2, index + 1);
        cell.value = header;
        cell.style = {
          font: headerStyle.font,
          fill: {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: 'FFE6E6FA' }
          },
          alignment: {
            horizontal: 'center' as const,
            vertical: 'middle' as const
          }
        };
      });
      
      // 填充详细记录数据
      report.records.forEach((record, index) => {
        const row = recordsStartRow + 3 + index;
        const data = [
          record.asset?.asset_no || '-',
          record.asset?.name || '-',
          record.asset?.category?.name || '-',
          record.asset?.department?.name || '-',
          getAssetStatusLabel(record.expected_status),
          getAssetStatusLabel(record.actual_status),
          resultLabels[record.result] || record.result,
          record.checked_by || '-',
          formatDate(record.checked_at),
          record.notes || '-'
        ];
        
        data.forEach((value, colIndex) => {
          worksheet.getCell(row, colIndex + 1).value = value;
        });
      });
      
      // 设置列宽
      worksheet.columns = [
        { width: 15 }, // 资产编号
        { width: 20 }, // 资产名称
        { width: 15 }, // 分类
        { width: 15 }, // 部门
        { width: 12 }, // 预期状态
        { width: 12 }, // 实际状态
        { width: 12 }, // 盘点结果
        { width: 12 }, // 盘点人
        { width: 20 }, // 盘点时间
        { width: 20 }  // 备注
      ];
      
      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // 下载文件
      const filename = `盘点报告_${report.task.task_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(blob, filename);
      
      toast.success('报告导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请稍后重试');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const generateCSVData = () => {
    if (!report) return '';
    
    const lines: string[] = [];
    
    // 报告标题
    lines.push(`盘点报告 - ${report.task.task_name}`);
    lines.push('');
    
    // 任务信息
    lines.push('任务信息');
    lines.push(`任务名称,${report.task.task_name}`);
    lines.push(`任务类型,${taskTypeLabels[report.task.task_type] || report.task.task_type}`);
    lines.push(`任务状态,${statusLabels[report.task.status] || report.task.status}`);
    lines.push(`创建人,${report.task.created_by || '-'}`);
    lines.push(`创建时间,${formatDate(report.task.created_at)}`);
    lines.push(`开始时间,${formatDate(report.task.start_date)}`);
    lines.push(`结束时间,${formatDate(report.task.end_date)}`);
    lines.push(`备注,${report.task.notes || '无备注'}`);
    lines.push('');
    
    // 盘点汇总
    lines.push('盘点汇总');
    lines.push(`总资产,${report.summary.total_assets}`);
    lines.push(`已盘点,${report.summary.checked_assets}`);
    lines.push(`正常,${report.summary.normal_assets}`);
    lines.push(`盘盈,${report.summary.surplus_assets}`);
    lines.push(`盘亏,${report.summary.deficit_assets}`);
    lines.push(`损坏,${report.summary.damaged_assets}`);
    lines.push(`完成率,${report.summary.progress.toFixed(1)}%`);
    lines.push('');
    
    // 详细记录
    lines.push('详细记录');
    lines.push('资产编号,资产名称,分类,部门,预期状态,实际状态,盘点结果,盘点人,盘点时间,备注');
    
    report.records.forEach(record => {
      const row = [
        record.asset?.asset_no || '-',
        record.asset?.name || '-',
        record.asset?.category?.name || '-',
        record.asset?.department?.name || '-',
        getAssetStatusLabel(record.expected_status),
        getAssetStatusLabel(record.actual_status),
        resultLabels[record.result] || record.result,
        record.checked_by || '-',
        formatDate(record.checked_at),
        record.notes || '-'
      ];
      lines.push(row.map(field => `"${field}"`).join(','));
    });
    
    return lines.join('\n');
  };

  if (loading) {
    return <Loading />;
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="py-12 text-center">
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
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">盘点报告</h1>
              <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
            </div>
            <p className="mt-1 text-gray-600">{task.task_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            打印
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="mr-2 h-4 w-4" />
            导出Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            导出CSV
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
          <CardHeader>
            <CardTitle className="text-xl">资产盘点报告</CardTitle>
            <div className="space-y-1 text-sm text-gray-600">
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <div className="flex flex-col">
                <div className="mb-2 shrink-0 text-gray-600">备注:</div>
                <div className="flex-1 rounded bg-gray-50 p-2 text-sm">{task.notes || '无备注'}</div>
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
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
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
              <div className="mb-2 flex justify-between text-sm text-gray-600">
                <span>盘点完成率</span>
                <span>{summary.progress.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div className="h-3 rounded-full bg-blue-600" style={{ width: `${summary.progress}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="category" className="space-y-6">
          <TabsList className="gap-2 print:hidden">
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
                    {category_stats.map(stat => {
                      const completionRate =
                        stat.total_assets > 0 ? ((stat.checked_assets / stat.total_assets) * 100).toFixed(1) : '0.0';
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
                    {department_stats?.map(stat => {
                      const completionRate =
                        stat.total_assets > 0 ? ((stat.checked_assets / stat.total_assets) * 100).toFixed(1) : '0.0';
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
                    {records.map(record => {
                      const ResultIcon = resultIcons[record.result];
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.asset?.asset_no}</TableCell>
                          <TableCell>{record.asset?.name}</TableCell>
                          <TableCell>{record.asset?.category?.name || '-'}</TableCell>
                          <TableCell>{record.asset?.department?.name || '-'}</TableCell>
                          <TableCell>{getAssetStatusLabel(record.expected_status)}</TableCell>
                          <TableCell>{getAssetStatusLabel(record.actual_status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ResultIcon className="h-4 w-4" />
                              <Badge className={resultColors[record.result]}>{resultLabels[record.result]}</Badge>
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

                {records.length === 0 && <div className="py-8 text-center text-gray-500">暂无盘点记录</div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
