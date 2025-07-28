'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface Column {
  key: string;
  title: string | React.ReactNode;
  render?: (value: any, record: any) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean; // 在移动端隐藏的列
}

interface Action {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (record: any) => void;
  variant?: 'default' | 'destructive';
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  actions?: Action[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function ResponsiveTable({
  columns,
  data,
  actions,
  loading = false,
  emptyText = '暂无数据',
  className,
}: ResponsiveTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 桌面端表格 */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                      column.className
                    )}
                  >
                    {column.title}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(record[column.key], record)
                        : record[column.key]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => (
                            <DropdownMenuItem
                              key={action.key}
                              onClick={() => action.onClick(record)}
                              className={cn(
                                action.variant === 'destructive' && 'text-red-600'
                              )}
                            >
                              {action.icon && (
                                <action.icon className="mr-2 h-4 w-4" />
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 移动端卡片视图 */}
      <div className="md:hidden space-y-3">
        {data.map((record, index) => {
          const recordId = record.id || index;
          const isExpanded = expandedRows.has(recordId.toString());
          const visibleColumns = columns.filter(col => !col.mobileHidden);
          const hiddenColumns = columns.filter(col => col.mobileHidden);

          return (
            <Card key={recordId} className="overflow-hidden">
              <CardContent className="p-4">
                {/* 主要信息 */}
                <div className="space-y-2">
                  {visibleColumns.slice(0, 2).map((column) => (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">
                        {column.title}:
                      </span>
                      <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                        {column.render
                          ? column.render(record[column.key], record)
                          : record[column.key]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 展开的详细信息 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {visibleColumns.slice(2).map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">
                          {column.title}:
                        </span>
                        <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                          {column.render
                            ? column.render(record[column.key], record)
                            : record[column.key]}
                        </span>
                      </div>
                    ))}
                    {hiddenColumns.map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">
                          {column.title}:
                        </span>
                        <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                          {column.render
                            ? column.render(record[column.key], record)
                            : record[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="mt-4 flex justify-between items-center">
                  {(visibleColumns.length > 2 || hiddenColumns.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion(recordId.toString())}
                    >
                      {isExpanded ? '收起' : '展开详情'}
                    </Button>
                  )}
                  
                  {actions && actions.length > 0 && (
                    <div className="flex space-x-2">
                      {actions.slice(0, 2).map((action) => (
                        <Button
                          key={action.key}
                          variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => action.onClick(record)}
                        >
                          {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                          {action.label}
                        </Button>
                      ))}
                      {actions.length > 2 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.slice(2).map((action) => (
                              <DropdownMenuItem
                                key={action.key}
                                onClick={() => action.onClick(record)}
                                className={cn(
                                  action.variant === 'destructive' && 'text-red-600'
                                )}
                              >
                                {action.icon && (
                                  <action.icon className="mr-2 h-4 w-4" />
                                )}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// 状态徽章渲染器
export function StatusBadge({ status, statusMap }: { 
  status: string; 
  statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> 
}) {
  const config = statusMap[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// 日期格式化渲染器
export function DateRenderer({ date }: { date: string | Date }) {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('zh-CN');
}

// 货币格式化渲染器
export function CurrencyRenderer({ amount }: { amount: number }) {
  if (amount == null) return '-';
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}