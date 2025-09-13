'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { Calendar, Filter, RotateCcw, Settings, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// 筛选参数接口
export interface ReportFilterParams {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  department_id?: string;
  status?: string;
  value_range?: string;
  warranty_status?: string;
  include_sub_categories?: boolean;
  borrower_name?: string;
  asset_category_id?: string;
  overdue_only?: boolean;
  borrow_duration?: string;
  task_type?: string;
}

// 筛选选项接口
export interface FilterOptions {
  categories: Array<{ id: string; name: string; parent_id?: string }>;
  departments: Array<{ id: string; name: string }>;
  statuses: Array<{ value: string; label: string }>;
  valueRanges: Array<{ value: string; label: string }>;
  warrantyStatuses: Array<{ value: string; label: string }>;
  borrowDurations: Array<{ value: string; label: string }>;
  taskTypes: Array<{ value: string; label: string }>;
}

interface ReportFilterProps {
  reportType: 'asset' | 'borrow' | 'inventory';
  onFilterChange: (filters: ReportFilterParams) => void;
  onReset: () => void;
  initialFilters?: ReportFilterParams;
  options?: FilterOptions;
  className?: string;
  useDialog?: boolean; // 是否使用弹窗模式
}

export function ReportFilter({
  reportType,
  onFilterChange,
  onReset,
  initialFilters = {},
  options,
  className,
  useDialog = false,
}: ReportFilterProps) {
  const [filters, setFilters] = useState<ReportFilterParams>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<ReportFilterParams>(initialFilters); // 弹窗中的临时筛选条件

  // 只有在非弹窗模式下才使用防抖
  const debouncedFilters = useDebounce(filters, useDialog ? 0 : 500);
  const isInitialMount = useRef(true);

  // 默认选项
  const defaultOptions: FilterOptions = {
    categories: [
      { id: '1', name: '电脑设备' },
      { id: '2', name: '办公设备' },
      { id: '3', name: '网络设备' },
      { id: '4', name: '音响设备' },
      { id: '5', name: '其他设备' },
    ],
    departments: [
      { id: '1', name: 'IT部门' },
      { id: '2', name: '财务部门' },
      { id: '3', name: '人事部门' },
      { id: '4', name: '市场部门' },
      { id: '5', name: '行政部门' },
    ],
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
    borrowDurations: [
      { value: 'short', label: '短期 (1-7天)' },
      { value: 'medium', label: '中期 (8-30天)' },
      { value: 'long', label: '长期 (31-90天)' },
      { value: 'very_long', label: '超长期 (90天以上)' },
    ],
    taskTypes: [
      { value: 'full', label: '全盘' },
      { value: 'department', label: '部门盘点' },
      { value: 'category', label: '分类盘点' },
      { value: 'spot', label: '抽查' },
    ],
  };

  const filterOptions = options || defaultOptions;

  // 检查是否有活跃的筛选条件
  useEffect(() => {
    const hasFilters = Object.values(filters).some(value => 
      value !== undefined && value !== '' && value !== false
    );
    setHasActiveFilters(hasFilters);
  }, [filters]);

  // 防抖筛选效果（仅在非弹窗模式下使用）
  useEffect(() => {
    if (useDialog) return; // 弹窗模式下不使用防抖

    // 跳过初始挂载，避免不必要的API调用
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 只有当筛选条件真正改变时才触发
    const hasChanges = JSON.stringify(debouncedFilters) !== JSON.stringify(initialFilters);
    if (hasChanges) {
      setIsLoading(true);
      onFilterChange(debouncedFilters);
      // 模拟加载完成
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [debouncedFilters, onFilterChange, initialFilters, useDialog]);

  // 处理筛选条件变化
  const handleFilterChange = useCallback((key: keyof ReportFilterParams, value: string | boolean | undefined, isTemp = false) => {
    // 如果值是 "all"，则清除该筛选条件
    const filterValue = value === 'all' ? undefined : value;

    if (useDialog && isTemp) {
      // 弹窗模式下的临时筛选
      const newFilters = { ...tempFilters, [key]: filterValue };
      setTempFilters(newFilters);
    } else {
      // 非弹窗模式或直接应用
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    // 不再立即调用 onFilterChange，而是通过防抖效果触发
    }
  }, [filters, tempFilters, useDialog]);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters({});
    setIsLoading(true);
    onReset();
    // 模拟加载完成
    setTimeout(() => setIsLoading(false), 300);
  }, [onReset]);

  // 弹窗相关处理函数
  const handleOpenDialog = useCallback(() => {
    setTempFilters({ ...filters }); // 将当前筛选条件复制到临时筛选
    setIsDialogOpen(true);
  }, [filters]);

  const handleApplyFilters = useCallback(() => {
    setFilters({ ...tempFilters }); // 应用临时筛选条件
    setIsDialogOpen(false);
    setIsLoading(true);
    onFilterChange(tempFilters);
    // 模拟加载完成
    setTimeout(() => setIsLoading(false), 300);
  }, [tempFilters, onFilterChange]);

  const handleResetTempFilters = useCallback(() => {
    setTempFilters({});
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    if (open) {
      // 打开时设置临时筛选为当前筛选条件
      setTempFilters({ ...filters });
    } else {
      // 关闭时恢复临时筛选为当前筛选条件
      setTempFilters({ ...filters });
    }
    setIsDialogOpen(open);
  }, [filters]);

  // 清除单个筛选条件
  const handleClearFilter = useCallback((key: keyof ReportFilterParams, isTemp = false) => {
    if (useDialog && isTemp) {
      // 弹窗模式下的临时清除
      const newFilters = { ...tempFilters };
      delete newFilters[key];
      setTempFilters(newFilters);
    } else {
      // 非弹窗模式或直接清除
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    // 通过防抖效果触发筛选
    }
  }, [filters, tempFilters, useDialog]);

  // 获取日期范围预设
  const getDatePresets = () => [
    { label: '今天', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: '昨天', start: new Date(Date.now() - 86400000).toISOString().split('T')[0], end: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    { label: '本周', start: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: '上周', start: new Date(Date.now() - 13 * 86400000).toISOString().split('T')[0], end: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] },
    { label: '本月', start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: '上月', start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0], end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0] },
    { label: '本年', start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
  ];

  // 渲染筛选标签
  const renderFilterTags = (useTempFilters = false) => {
    const currentFilters = useTempFilters ? tempFilters : filters;
    const tags = [];

    if (currentFilters.start_date && currentFilters.end_date) {
      tags.push(
        <span key="date-range" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          <Calendar className="h-3 w-3" />
          {currentFilters.start_date} ~ {currentFilters.end_date}
          <button
            onClick={() => handleClearFilter('start_date', useTempFilters)}
            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    if (currentFilters.category_id) {
      const category = filterOptions.categories.find(c => c.id === currentFilters.category_id);
      tags.push(
        <span key="category" className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          分类: {category?.name || currentFilters.category_id}
          <button
            onClick={() => handleClearFilter('category_id', useTempFilters)}
            className="ml-1 hover:bg-green-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    if (currentFilters.department_id) {
      const department = filterOptions.departments.find(d => d.id === currentFilters.department_id);
      tags.push(
        <span key="department" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
          部门: {department?.name || currentFilters.department_id}
          <button
            onClick={() => handleClearFilter('department_id', useTempFilters)}
            className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    if (currentFilters.status) {
      const status = filterOptions.statuses.find(s => s.value === currentFilters.status);
      tags.push(
        <span key="status" className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          状态: {status?.label || currentFilters.status}
          <button
            onClick={() => handleClearFilter('status', useTempFilters)}
            className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 价值范围标签
    if (currentFilters.value_range) {
      const valueRange = filterOptions.valueRanges.find(v => v.value === currentFilters.value_range);
      tags.push(
        <span key="value_range" className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
          价值: {valueRange?.label || currentFilters.value_range}
          <button
            onClick={() => handleClearFilter('value_range', useTempFilters)}
            className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 保修状态标签
    if (currentFilters.warranty_status) {
      const warrantyStatus = filterOptions.warrantyStatuses.find(w => w.value === currentFilters.warranty_status);
      tags.push(
        <span key="warranty_status" className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
          保修: {warrantyStatus?.label || currentFilters.warranty_status}
          <button
            onClick={() => handleClearFilter('warranty_status', useTempFilters)}
            className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 包含子分类标签
    if (currentFilters.include_sub_categories) {
      tags.push(
        <span key="include_sub_categories" className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
          包含子分类
          <button
            onClick={() => handleClearFilter('include_sub_categories', useTempFilters)}
            className="ml-1 hover:bg-teal-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 借用人标签
    if (currentFilters.borrower_name) {
      tags.push(
        <span key="borrower_name" className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
          借用人: {currentFilters.borrower_name}
          <button
            onClick={() => handleClearFilter('borrower_name', useTempFilters)}
            className="ml-1 hover:bg-cyan-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 资产分类标签（借用报表专用）
    if (currentFilters.asset_category_id) {
      const assetCategory = filterOptions.categories.find(c => c.id === currentFilters.asset_category_id);
      tags.push(
        <span key="asset_category" className="inline-flex items-center gap-1 px-2 py-1 bg-lime-100 text-lime-800 text-xs rounded-full">
          资产分类: {assetCategory?.name || currentFilters.asset_category_id}
          <button
            onClick={() => handleClearFilter('asset_category_id', useTempFilters)}
            className="ml-1 hover:bg-lime-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 借用时长标签
    if (currentFilters.borrow_duration) {
      const duration = filterOptions.borrowDurations.find(d => d.value === currentFilters.borrow_duration);
      tags.push(
        <span key="borrow_duration" className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-800 text-xs rounded-full">
          时长: {duration?.label || currentFilters.borrow_duration}
          <button
            onClick={() => handleClearFilter('borrow_duration', useTempFilters)}
            className="ml-1 hover:bg-rose-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 仅显示超期借用标签
    if (currentFilters.overdue_only) {
      tags.push(
        <span key="overdue_only" className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          仅显示超期借用
          <button
            onClick={() => handleClearFilter('overdue_only', useTempFilters)}
            className="ml-1 hover:bg-red-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // 任务类型标签
    if (currentFilters.task_type) {
      const taskType = filterOptions.taskTypes.find(t => t.value === currentFilters.task_type);
      tags.push(
        <span key="task_type" className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded-full">
          任务类型: {taskType?.label || currentFilters.task_type}
          <button
            onClick={() => handleClearFilter('task_type', useTempFilters)}
            className="ml-1 hover:bg-violet-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    return tags;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选条件
            </CardTitle>
            <CardDescription>
              设置报表筛选条件，支持多维度数据筛选
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                筛选中...
              </div>
            )}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-red-600 hover:text-red-700"
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                重置
              </Button>
            )}
            {!useDialog && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={isLoading}
            >
              {isExpanded ? '收起' : '展开'}
            </Button>
            )}
          </div>
        </div>
        
        {/* 筛选标签 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {renderFilterTags(false)}
          </div>
        )}
      </CardHeader>

      {/* 弹窗模式 */}
      {useDialog ? (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              <Settings className="mr-2 h-4 w-4" />
              筛选条件
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== false).length}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>设置筛选条件</DialogTitle>
              <DialogDescription>
                选择您要应用的筛选条件，点击应用按钮确认筛选。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* 筛选标签预览 */}
              {renderFilterTags(true).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">当前筛选条件</Label>
                  <div className="flex flex-wrap gap-2">
                    {renderFilterTags(true)}
                  </div>
                </div>
              )}

              {/* 筛选表单 */}
              <div className="space-y-6">
                {/* 时间范围筛选 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dialog_start_date">开始日期</Label>
                    <Input
                      id="dialog_start_date"
                      type="date"
                      value={tempFilters.start_date || ''}
                      onChange={(e) => handleFilterChange('start_date', e.target.value || undefined, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog_end_date">结束日期</Label>
                    <Input
                      id="dialog_end_date"
                      type="date"
                      value={tempFilters.end_date || ''}
                      onChange={(e) => handleFilterChange('end_date', e.target.value || undefined, true)}
                    />
                  </div>
                </div>

                {/* 日期预设 */}
                <div className="space-y-2">
                  <Label>快速选择</Label>
                  <div className="flex flex-wrap gap-2">
                    {getDatePresets().map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const newFilters = {
                            ...tempFilters,
                            start_date: preset.start,
                            end_date: preset.end
                          };
                          setTempFilters(newFilters);
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 基础筛选条件 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 分类筛选 */}
                  <div className="space-y-2">
                    <Label htmlFor="dialog_category_id">资产分类</Label>
                    <Select
                      value={tempFilters.category_id || 'all'}
                      onValueChange={(value) => handleFilterChange('category_id', value || undefined, true)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部分类</SelectItem>
                        {filterOptions.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 部门筛选 */}
                  <div className="space-y-2">
                    <Label htmlFor="dialog_department_id">部门</Label>
                    <Select
                      value={tempFilters.department_id || 'all'}
                      onValueChange={(value) => handleFilterChange('department_id', value || undefined, true)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部部门</SelectItem>
                        {filterOptions.departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 状态筛选 */}
                  <div className="space-y-2">
                    <Label htmlFor="dialog_status">状态</Label>
                    <Select
                      value={tempFilters.status || 'all'}
                      onValueChange={(value) => handleFilterChange('status', value || undefined, true)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        {filterOptions.statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 资产报表专用筛选 */}
                {reportType === 'asset' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog_value_range">价值范围</Label>
                      <Select
                        value={tempFilters.value_range || 'all'}
                        onValueChange={(value) => handleFilterChange('value_range', value || undefined, true)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择价值范围" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部价值</SelectItem>
                          {filterOptions.valueRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dialog_warranty_status">保修状态</Label>
                      <Select
                        value={tempFilters.warranty_status || 'all'}
                        onValueChange={(value) => handleFilterChange('warranty_status', value || undefined, true)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择保修状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部保修状态</SelectItem>
                          {filterOptions.warrantyStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tempFilters.include_sub_categories || false}
                          onChange={(e) => handleFilterChange('include_sub_categories', e.target.checked, true)}
                          className="rounded"
                        />
                        包含子分类
                      </Label>
                    </div>
                  </div>
                )}

                {/* 借用报表专用筛选 */}
                {reportType === 'borrow' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog_borrower_name">借用人</Label>
                      <Input
                        id="dialog_borrower_name"
                        placeholder="输入借用人姓名"
                        value={tempFilters.borrower_name || ''}
                        onChange={(e) => handleFilterChange('borrower_name', e.target.value || undefined, true)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dialog_asset_category_id">资产分类</Label>
                      <Select
                        value={tempFilters.asset_category_id || 'all'}
                        onValueChange={(value) => handleFilterChange('asset_category_id', value || undefined, true)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择资产分类" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部分类</SelectItem>
                          {filterOptions.categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dialog_borrow_duration">借用时长</Label>
                      <Select
                        value={tempFilters.borrow_duration || 'all'}
                        onValueChange={(value) => handleFilterChange('borrow_duration', value || undefined, true)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择借用时长" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部时长</SelectItem>
                          {filterOptions.borrowDurations.map((duration) => (
                            <SelectItem key={duration.value} value={duration.value}>
                              {duration.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={tempFilters.overdue_only || false}
                          onChange={(e) => handleFilterChange('overdue_only', e.target.checked, true)}
                          className="rounded"
                        />
                        仅显示超期借用
                      </Label>
                    </div>
                  </div>
                )}

                {/* 盘点报表专用筛选 */}
                {reportType === 'inventory' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog_task_type">任务类型</Label>
                      <Select
                        value={tempFilters.task_type || 'all'}
                        onValueChange={(value) => handleFilterChange('task_type', value || undefined, true)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择任务类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类型</SelectItem>
                          {filterOptions.taskTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleResetTempFilters}
                disabled={isLoading}
              >
                重置
              </Button>
              <Button
                onClick={handleApplyFilters}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    应用中...
                  </>
                ) : (
                  '应用筛选'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        isExpanded && (
        <CardContent className="space-y-6">
          {/* 时间范围筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">开始日期</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value || undefined, false)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value || undefined, false)}
              />
            </div>
          </div>

          {/* 日期预设 */}
          <div className="space-y-2">
            <Label>快速选择</Label>
            <div className="flex flex-wrap gap-2">
              {getDatePresets().map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    // 非弹窗模式下直接设置
                    const newFilters = {
                      ...filters,
                      start_date: preset.start,
                      end_date: preset.end
                    };
                    setFilters(newFilters);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 基础筛选条件 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 分类筛选 */}
            <div className="space-y-2">
              <Label htmlFor="category_id">资产分类</Label>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => handleFilterChange('category_id', value || undefined, false)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 部门筛选 */}
            <div className="space-y-2">
              <Label htmlFor="department_id">部门</Label>
              <Select
                value={filters.department_id || 'all'}
                onValueChange={(value) => handleFilterChange('department_id', value || undefined, false)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {filterOptions.departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 状态筛选 */}
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value || undefined, false)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {filterOptions.statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 资产报表专用筛选 */}
          {reportType === 'asset' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value_range">价值范围</Label>
                <Select
                  value={filters.value_range || 'all'}
                  onValueChange={(value) => handleFilterChange('value_range', value || undefined, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择价值范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部价值</SelectItem>
                    {filterOptions.valueRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_status">保修状态</Label>
                <Select
                  value={filters.warranty_status || 'all'}
                  onValueChange={(value) => handleFilterChange('warranty_status', value || undefined, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择保修状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部保修状态</SelectItem>
                    {filterOptions.warrantyStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.include_sub_categories || false}
                    onChange={(e) => handleFilterChange('include_sub_categories', e.target.checked, false)}
                    className="rounded"
                  />
                  包含子分类
                </Label>
              </div>
            </div>
          )}

          {/* 借用报表专用筛选 */}
          {reportType === 'borrow' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="borrower_name">借用人</Label>
                <Input
                  id="borrower_name"
                  placeholder="输入借用人姓名"
                  value={filters.borrower_name || ''}
                  onChange={(e) => handleFilterChange('borrower_name', e.target.value || undefined, false)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_category_id">资产分类</Label>
                <Select
                  value={filters.asset_category_id || 'all'}
                  onValueChange={(value) => handleFilterChange('asset_category_id', value || undefined, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择资产分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {filterOptions.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="borrow_duration">借用时长</Label>
                <Select
                  value={filters.borrow_duration || 'all'}
                  onValueChange={(value) => handleFilterChange('borrow_duration', value || undefined, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择借用时长" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时长</SelectItem>
                    {filterOptions.borrowDurations.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.overdue_only || false}
                    onChange={(e) => handleFilterChange('overdue_only', e.target.checked, false)}
                    className="rounded"
                  />
                  仅显示超期借用
                </Label>
              </div>
            </div>
          )}

          {/* 盘点报表专用筛选 */}
          {reportType === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task_type">任务类型</Label>
                <Select
                  value={filters.task_type || 'all'}
                  onValueChange={(value) => handleFilterChange('task_type', value || undefined, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择任务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {filterOptions.taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
        )
      )}
    </Card>
  );
}
