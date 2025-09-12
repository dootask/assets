'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  dateRange?: {
    start_date: string;
    end_date: string;
  };
  filters?: Record<string, string | number | boolean>;
}

interface ExportDialogProps {
  reportType: 'asset' | 'borrow' | 'inventory';
  onExport: (options: ExportOptions) => Promise<void>;
  children: React.ReactNode;
}

export function ExportDialog({ reportType, onExport, children }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const options: ExportOptions = {
        format,
        dateRange: startDate && endDate ? {
          start_date: startDate,
          end_date: endDate,
        } : undefined,
        filters: {
          ...(categoryFilter && categoryFilter !== 'all' && { category_id: categoryFilter }),
          ...(departmentFilter && departmentFilter !== 'all' && { department_id: departmentFilter }),
          ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        },
      };

      await onExport(options);
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'asset':
        return '资产统计报表';
      case 'borrow':
        return '借用统计报表';
      case 'inventory':
        return '盘点统计报表';
      default:
        return '统计报表';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            导出{getReportTitle()}
          </DialogTitle>
          <DialogDescription>
            选择导出格式和筛选条件，生成定制化的报表文件
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 导出格式选择 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              导出格式
            </Label>
            <div className="col-span-3">
              <Select value={format} onValueChange={(value: 'excel' | 'csv' | 'pdf') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择导出格式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 日期范围 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="flex items-center text-right">
              <CalendarDays className="mr-1 h-4 w-4" />
              日期范围
            </Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                  开始日期
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                  结束日期
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 筛选条件 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">筛选条件</Label>
            
            {reportType === 'asset' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category" className="text-sm text-muted-foreground">
                      资产分类
                    </Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部分类</SelectItem>
                        <SelectItem value="1">电脑设备</SelectItem>
                        <SelectItem value="2">办公设备</SelectItem>
                        <SelectItem value="3">网络设备</SelectItem>
                        <SelectItem value="4">音响设备</SelectItem>
                        <SelectItem value="5">其他设备</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm text-muted-foreground">
                      资产状态
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="available">可用</SelectItem>
                        <SelectItem value="borrowed">借用中</SelectItem>
                        <SelectItem value="maintenance">维护中</SelectItem>
                        <SelectItem value="scrapped">已报废</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {reportType === 'borrow' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="borrow-status" className="text-sm text-muted-foreground">
                    借用状态
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">进行中</SelectItem>
                      <SelectItem value="returned">已归还</SelectItem>
                      <SelectItem value="overdue">已超期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {reportType === 'inventory' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="task-status" className="text-sm text-muted-foreground">
                    任务状态
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="pending">待开始</SelectItem>
                      <SelectItem value="in_progress">进行中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="department" className="text-sm text-muted-foreground">
                部门筛选
              </Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  <SelectItem value="1">IT部门</SelectItem>
                  <SelectItem value="2">财务部门</SelectItem>
                  <SelectItem value="3">人事部门</SelectItem>
                  <SelectItem value="4">市场部门</SelectItem>
                  <SelectItem value="5">行政部门</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {getFormatIcon(format)}
            <span className="ml-2">
              {isExporting ? '导出中...' : `导出${format.toUpperCase()}`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
