'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Printer,
    Settings
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportDialogProps {
  reportType: 'asset' | 'borrow' | 'inventory';
  onExport: (options: ExportOptions) => Promise<void>;
  children: React.ReactNode;
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  dateRange?: {
    start_date?: string;
    end_date?: string;
  };
  filters?: Record<string, any>;
  includeCharts?: boolean;
  includeSummary?: boolean;
  customFields?: string[];
}

export function ExportDialog({ reportType, onExport, children }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('month');

  const formatOptions = [
    {
      value: 'excel',
      label: 'Excel 文件',
      description: '包含多个工作表的详细报表',
      icon: FileSpreadsheet,
      recommended: true
    },
    {
      value: 'csv',
      label: 'CSV 文件',
      description: '纯数据格式，便于数据分析',
      icon: FileText,
      recommended: false
    },
    {
      value: 'pdf',
      label: 'PDF 文件',
      description: '包含图表的打印友好格式',
      icon: Printer,
      recommended: false
    }
  ];

  const getReportTitle = () => {
    switch (reportType) {
      case 'asset': return '资产统计报表';
      case 'borrow': return '借用统计报表';
      case 'inventory': return '盘点统计报表';
      default: return '统计报表';
    }
  };

  const getAvailableFields = () => {
    switch (reportType) {
      case 'asset':
        return [
          { id: 'basic_info', label: '基本信息', description: '资产编号、名称、分类等' },
          { id: 'financial_info', label: '财务信息', description: '采购价格、供应商等' },
          { id: 'location_info', label: '位置信息', description: '存放位置、责任人等' },
          { id: 'status_info', label: '状态信息', description: '当前状态、保修信息等' }
        ];
      case 'borrow':
        return [
          { id: 'borrow_info', label: '借用信息', description: '借用人、借用时间等' },
          { id: 'asset_info', label: '资产信息', description: '资产编号、名称等' },
          { id: 'return_info', label: '归还信息', description: '归还时间、超期情况等' },
          { id: 'department_info', label: '部门信息', description: '借用部门等' }
        ];
      case 'inventory':
        return [
          { id: 'task_info', label: '任务信息', description: '盘点任务、执行人等' },
          { id: 'asset_info', label: '资产信息', description: '资产编号、名称等' },
          { id: 'result_info', label: '盘点结果', description: '盘点状态、差异等' },
          { id: 'analysis_info', label: '分析信息', description: '准确率、问题分析等' }
        ];
      default:
        return [];
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const options: ExportOptions = {
        format,
        includeCharts: format === 'pdf' ? includeCharts : false,
        includeSummary,
        dateRange: dateRange === 'all' ? undefined : {
          start_date: getDateRangeStart(),
          end_date: getDateRangeEnd()
        }
      };

      await onExport(options);
      setOpen(false);
      toast.success('报表导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('报表导出失败');
    } finally {
      setExporting(false);
    }
  };

  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      default:
        return undefined;
    }
  };

  const getDateRangeEnd = () => {
    const now = new Date();
    switch (dateRange) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      case 'quarter':
        const quarterEnd = Math.floor(now.getMonth() / 3) * 3 + 2;
        return new Date(now.getFullYear(), quarterEnd + 1, 0).toISOString().split('T')[0];
      case 'year':
        return new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      default:
        return undefined;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            导出{getReportTitle()}
          </DialogTitle>
          <DialogDescription>
            选择导出格式和内容选项，生成您需要的报表文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 格式选择 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">导出格式</Label>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Card 
                    key={option.value}
                    className={`cursor-pointer transition-colors ${
                      format === option.value ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setFormat(option.value as any)}
                  >
                    <CardContent className="flex items-center space-x-3 p-4">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{option.label}</span>
                          {option.recommended && (
                            <Badge variant="secondary" className="text-xs">推荐</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        format === option.value 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground'
                      }`} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 时间范围 */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              时间范围
            </Label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季度</SelectItem>
                <SelectItem value="year">本年</SelectItem>
                <SelectItem value="custom">自定义范围</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 内容选项 */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              内容选项
            </Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="summary" 
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                />
                <Label htmlFor="summary" className="text-sm">
                  包含汇总信息
                </Label>
              </div>
              
              {format === 'pdf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="charts" 
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <Label htmlFor="charts" className="text-sm">
                    包含图表
                  </Label>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 数据字段 */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              包含字段
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {getAvailableFields().map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox id={field.id} defaultChecked />
                  <div className="flex-1">
                    <Label htmlFor={field.id} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                导出报表
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}