'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CustomReportRequest,
  CustomReportResponse,
  downloadFileFromUrl,
  exportCustomReports,
  fetchCustomReports,
} from '@/lib/api/reports';
import {
  BarChart3,
  Calendar,
  Database,
  Download,
  FileText,
  Filter,
  Loader2,
  Play,
  Settings,
  X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CustomReportsPage() {
  const [reportType, setReportType] = useState<'asset' | 'borrow' | 'inventory'>('asset');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: '',
    order: 'asc',
  });
  const [dateRange, setDateRange] = useState<{ start_date: string; end_date: string }>({
    start_date: '',
    end_date: '',
  });
  const [reportData, setReportData] = useState<CustomReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 可用字段配置
  const availableFields = {
    asset: [
      { key: 'asset_no', label: '资产编号', type: 'string' },
      { key: 'name', label: '资产名称', type: 'string' },
      { key: 'category_name', label: '分类', type: 'string' },
      { key: 'department_name', label: '部门', type: 'string' },
      { key: 'brand', label: '品牌', type: 'string' },
      { key: 'model', label: '型号', type: 'string' },
      { key: 'purchase_price', label: '采购价格', type: 'number' },
      { key: 'purchase_date', label: '采购日期', type: 'date' },
      { key: 'status', label: '状态', type: 'string' },
      { key: 'location', label: '存放位置', type: 'string' },
      { key: 'warranty_end_date', label: '保修到期日', type: 'date' },
    ],
    borrow: [
      { key: 'asset_no', label: '资产编号', type: 'string' },
      { key: 'asset_name', label: '资产名称', type: 'string' },
      { key: 'borrower_name', label: '借用人', type: 'string' },
      { key: 'department_name', label: '借用部门', type: 'string' },
      { key: 'borrow_date', label: '借用日期', type: 'date' },
      { key: 'expected_return_date', label: '预期归还日期', type: 'date' },
      { key: 'actual_return_date', label: '实际归还日期', type: 'date' },
      { key: 'status', label: '借用状态', type: 'string' },
      { key: 'overdue_days', label: '超期天数', type: 'number' },
      { key: 'purpose', label: '借用用途', type: 'string' },
    ],
    inventory: [
      { key: 'task_name', label: '盘点任务', type: 'string' },
      { key: 'asset_no', label: '资产编号', type: 'string' },
      { key: 'asset_name', label: '资产名称', type: 'string' },
      { key: 'category_name', label: '分类', type: 'string' },
      { key: 'department_name', label: '部门', type: 'string' },
      { key: 'result', label: '盘点结果', type: 'string' },
      { key: 'check_date', label: '盘点日期', type: 'date' },
      { key: 'checker_name', label: '盘点人', type: 'string' },
      { key: 'notes', label: '备注', type: 'string' },
    ],
  };

  // 处理字段选择
  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey) ? prev.filter(f => f !== fieldKey) : [...prev, fieldKey]
    );
  };

  // 处理筛选条件
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 移除筛选条件
  const removeFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // 处理分组条件
  const handleGroupByToggle = (fieldKey: string) => {
    setGroupBy(prev =>
      prev.includes(fieldKey) ? prev.filter(f => f !== fieldKey) : [...prev, fieldKey]
    );
  };

  // 执行查询
  const handleQuery = async () => {
    if (selectedFields.length === 0) {
      toast.error('请至少选择一个字段');
      return;
    }

    try {
      setLoading(true);
      const request: CustomReportRequest = {
        type: reportType,
        fields: selectedFields,
        filters: filters,
        date_range: dateRange.start_date && dateRange.end_date ? dateRange : undefined,
        group_by: groupBy.length > 0 ? groupBy : undefined,
        sort_by: sortBy.field ? sortBy : undefined,
      };

      const data = await fetchCustomReports(request);
      setReportData(data);
      toast.success('查询完成');
    } catch (error) {
      console.error('Query failed:', error);
      toast.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出报表
  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    if (!reportData) {
      toast.error('请先执行查询');
      return;
    }

    try {
      setExporting(true);
      const request = {
        type: reportType,
        fields: selectedFields,
        filters: filters,
        date_range: dateRange.start_date && dateRange.end_date ? dateRange : undefined,
        group_by: groupBy.length > 0 ? groupBy : undefined,
        sort_by: sortBy.field ? sortBy : undefined,
        format,
      };

      const response = await exportCustomReports(request);
      downloadFileFromUrl(response.data.download_url, response.data.filename);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">自定义报表</h1>
          <p className="text-muted-foreground">灵活配置数据查询条件，生成个性化报表</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            返回
          </Button>
          {reportData && (
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                disabled={exporting}
              >
                <Download className="mr-1 h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                <Download className="mr-1 h-4 w-4" />
                CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 查询配置面板 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                查询配置
              </CardTitle>
              <CardDescription>配置数据源、字段和筛选条件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 数据源选择 */}
              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium">
                  <Database className="mr-1 h-4 w-4" />
                  数据源
                </Label>
                <Select
                  value={reportType}
                  onValueChange={(value: 'asset' | 'borrow' | 'inventory') => {
                    setReportType(value);
                    setSelectedFields([]);
                    setFilters({});
                    setGroupBy([]);
                    setReportData(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">资产数据</SelectItem>
                    <SelectItem value="borrow">借用数据</SelectItem>
                    <SelectItem value="inventory">盘点数据</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 字段选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">选择字段</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {availableFields[reportType].map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <Label htmlFor={field.key} className="flex-1 text-sm">
                        {field.label}
                        <Badge variant="outline" className="ml-1 text-xs">
                          {field.type}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">已选择 {selectedFields.length} 个字段</p>
              </div>

              <Separator />

              {/* 筛选条件 */}
              <div className="space-y-3">
                <Label className="flex items-center text-sm font-medium">
                  <Filter className="mr-1 h-4 w-4" />
                  筛选条件
                </Label>
                <div className="space-y-2">
                  <Select
                    onValueChange={value => {
                      if (value && !filters[value]) {
                        handleFilterChange(value, '');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="添加筛选条件" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields[reportType]
                        .filter(field => !filters[field.key])
                        .map(field => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {Object.entries(filters).map(([key, value]) => {
                    const field = availableFields[reportType].find(f => f.key === key);
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">{field?.label}</Label>
                          <Input
                            type={field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={e => handleFilterChange(key, e.target.value)}
                            placeholder="输入筛选值"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* 日期范围 */}
              <div className="space-y-3">
                <Label className="flex items-center text-sm font-medium">
                  <Calendar className="mr-1 h-4 w-4" />
                  日期范围
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">开始日期</Label>
                    <Input
                      type="date"
                      value={dateRange.start_date}
                      onChange={e => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">结束日期</Label>
                    <Input
                      type="date"
                      value={dateRange.end_date}
                      onChange={e => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 分组和排序 */}
              <Tabs defaultValue="group" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="group">分组</TabsTrigger>
                  <TabsTrigger value="sort">排序</TabsTrigger>
                </TabsList>
                <TabsContent value="group" className="space-y-2">
                  {availableFields[reportType].map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${field.key}`}
                        checked={groupBy.includes(field.key)}
                        onCheckedChange={() => handleGroupByToggle(field.key)}
                      />
                      <Label htmlFor={`group-${field.key}`} className="text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="sort" className="space-y-2">
                  <Select
                    value={sortBy.field}
                    onValueChange={value => setSortBy(prev => ({ ...prev, field: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择排序字段" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields[reportType].map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortBy.order}
                    onValueChange={(value: 'asc' | 'desc') => setSortBy(prev => ({ ...prev, order: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">升序</SelectItem>
                      <SelectItem value="desc">降序</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>

              {/* 查询按钮 */}
              <Button onClick={handleQuery} disabled={loading || selectedFields.length === 0} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    查询中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    执行查询
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 查询结果 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                查询结果
              </CardTitle>
              <CardDescription>
                {reportData ? `共 ${reportData.total} 条记录` : '请配置查询条件并执行查询'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground mt-2">查询中...</p>
                  </div>
                </div>
              ) : reportData ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {reportData.columns.map(column => (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.data.slice(0, 50).map((row, index) => (
                        <TableRow key={index}>
                          {reportData.columns.map(column => (
                            <TableCell key={column.key}>
                              {row[column.key]?.toString() || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {reportData.data.length > 50 && (
                    <div className="border-t p-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        显示前 50 条记录，共 {reportData.total} 条
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                    <p className="text-muted-foreground">暂无数据</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 