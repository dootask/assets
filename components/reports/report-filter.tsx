'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
}

export function ReportFilter({
  reportType,
  onFilterChange,
  onReset,
  initialFilters = {},
  options,
  className,
}: ReportFilterProps) {
  const [filters, setFilters] = useState<ReportFilterParams>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

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

  // 处理筛选条件变化
  const handleFilterChange = useCallback((key: keyof ReportFilterParams, value: string | boolean | undefined) => {
    // 如果值是 "all"，则清除该筛选条件
    const filterValue = value === 'all' ? undefined : value;
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters({});
    onReset();
  }, [onReset]);

  // 清除单个筛选条件
  const handleClearFilter = useCallback((key: keyof ReportFilterParams) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

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
  const renderFilterTags = () => {
    const tags = [];
    
    if (filters.start_date && filters.end_date) {
      tags.push(
        <span key="date-range" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          <Calendar className="h-3 w-3" />
          {filters.start_date} ~ {filters.end_date}
          <button
            onClick={() => handleClearFilter('start_date')}
            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    if (filters.category_id) {
      const category = filterOptions.categories.find(c => c.id === filters.category_id);
      tags.push(
        <span key="category" className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          分类: {category?.name || filters.category_id}
          <button
            onClick={() => handleClearFilter('category_id')}
            className="ml-1 hover:bg-green-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    if (filters.department_id) {
      const department = filterOptions.departments.find(d => d.id === filters.department_id);
      tags.push(
        <span key="department" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
          部门: {department?.name || filters.department_id}
          <button
            onClick={() => handleClearFilter('department_id')}
            className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      );
    }

    if (filters.status) {
      const status = filterOptions.statuses.find(s => s.value === filters.status);
      tags.push(
        <span key="status" className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          状态: {status?.label || filters.status}
          <button
            onClick={() => handleClearFilter('status')}
            className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
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
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-red-600 hover:text-red-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                重置
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '收起' : '展开'}
            </Button>
          </div>
        </div>
        
        {/* 筛选标签 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {renderFilterTags()}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* 时间范围筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">开始日期</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
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
                  onClick={() => {
                    handleFilterChange('start_date', preset.start);
                    handleFilterChange('end_date', preset.end);
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
                onValueChange={(value) => handleFilterChange('category_id', value || undefined)}
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
                onValueChange={(value) => handleFilterChange('department_id', value || undefined)}
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
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
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
                  onValueChange={(value) => handleFilterChange('value_range', value || undefined)}
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
                  onValueChange={(value) => handleFilterChange('warranty_status', value || undefined)}
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
                    onChange={(e) => handleFilterChange('include_sub_categories', e.target.checked)}
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
                  onChange={(e) => handleFilterChange('borrower_name', e.target.value || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_category_id">资产分类</Label>
                <Select
                  value={filters.asset_category_id || 'all'}
                  onValueChange={(value) => handleFilterChange('asset_category_id', value || undefined)}
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
                  onValueChange={(value) => handleFilterChange('borrow_duration', value || undefined)}
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
                    onChange={(e) => handleFilterChange('overdue_only', e.target.checked)}
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
                  onValueChange={(value) => handleFilterChange('task_type', value || undefined)}
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
      )}
    </Card>
  );
}
