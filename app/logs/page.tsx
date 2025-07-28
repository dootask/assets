'use client';

import { Activity, Calendar, Database, Eye, Filter, Search, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { Pagination } from '@/components/pagination';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { getOperationLogs, getOperationLogStats } from '@/lib/api/logs';
import type {
    OperationLogFilters,
    OperationLogResponse,
    OperationLogStats,
    OperationType,
    PaginationRequest
} from '@/lib/types';

// 操作类型映射
const operationMap: Record<OperationType, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  create: { label: '创建', variant: 'default' },
  update: { label: '更新', variant: 'secondary' },
  delete: { label: '删除', variant: 'destructive' },
};

// 表名映射
const tableMap: Record<string, string> = {
  assets: '资产',
  categories: '分类',
  departments: '部门',
  borrow_records: '借用记录',
  inventory_tasks: '盘点任务',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLogResponse[]>([]);
  const [stats, setStats] = useState<OperationLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
  });
  
  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OperationLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // 加载操作日志列表
  const loadLogs = useCallback(async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      
      const params: PaginationRequest & { filters?: OperationLogFilters } = {
        page,
        page_size: pageSize,
        sorts: [{ key: 'created_at', desc: true }],
        filters: {
          ...filters,
          ...(searchTerm && { operator: searchTerm }),
        },
      };
      
      const response = await getOperationLogs(params);
      setLogs(response.data.data);
      setPagination(response.data);
    } catch (error) {
      console.error('加载操作日志失败:', error);
      toast.error('加载操作日志失败');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await getOperationLogStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      toast.error('加载统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadLogs();
    loadStats();
  }, [loadLogs, loadStats]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    loadLogs(1);
  }, [loadLogs]);

  // 筛选处理
  const handleFilterChange = (key: keyof OperationLogFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // 应用筛选
  const applyFilters = () => {
    loadLogs(1);
    setShowFilters(false);
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    loadLogs(1);
    setShowFilters(false);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    loadLogs(page, pagination.page_size);
  };

  // 格式化日期时间
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('zh-CN');
  };

  // 格式化JSON数据
  const formatJsonData = (data: Record<string, unknown> | undefined) => {
    if (!data) return '-';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">操作日志</h1>
        <p className="text-muted-foreground">查看系统操作记录和审计信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总日志数</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats?.total_logs.toLocaleString() || 0
                  )}
                </p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">今日日志</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats?.today_logs.toLocaleString() || 0
                  )}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">活跃操作者</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats?.top_operators.length || 0
                  )}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">操作类型</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    Object.keys(stats?.operation_stats || {}).length
                  )}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索操作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">表名</label>
                  <Select
                    value={filters.table || ''}
                    onValueChange={(value) => handleFilterChange('table', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择表名" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部表</SelectItem>
                      {Object.entries(tableMap).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">操作类型</label>
                  <Select
                    value={filters.operation || ''}
                    onValueChange={(value) => handleFilterChange('operation', value as OperationType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择操作类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部操作</SelectItem>
                      {Object.entries(operationMap).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">记录ID</label>
                  <Input
                    type="number"
                    placeholder="输入记录ID"
                    value={filters.record_id || ''}
                    onChange={(e) => handleFilterChange('record_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">IP地址</label>
                  <Input
                    placeholder="输入IP地址"
                    value={filters.ip_address || ''}
                    onChange={(e) => handleFilterChange('ip_address', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters}>应用筛选</Button>
                <Button variant="outline" onClick={clearFilters}>
                  清除筛选
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            操作日志 ({pagination.total_items} 条)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无操作日志</p>
            </div>
          ) : (
            <ResponsiveTable
              columns={[
                {
                  key: 'id',
                  title: 'ID',
                  render: (value) => <span className="font-mono text-sm">{value}</span>,
                  className: 'w-16'
                },
                {
                  key: 'table_label',
                  title: '表名',
                  render: (value) => <Badge variant="outline">{value}</Badge>
                },
                {
                  key: 'operation_label',
                  title: '操作',
                  render: (_, record) => (
                    <Badge variant={operationMap[record.operation as OperationType]?.variant || 'default'}>
                      {record.operation_label}
                    </Badge>
                  )
                },
                {
                  key: 'record_id',
                  title: '记录ID',
                  render: (value) => <span className="font-mono text-sm">{value}</span>,
                  mobileHidden: true
                },
                {
                  key: 'operator',
                  title: '操作者',
                  render: (value) => value || '-',
                  mobileHidden: true
                },
                {
                  key: 'ip_address',
                  title: 'IP地址',
                  render: (value) => <span className="font-mono text-sm">{value}</span>,
                  mobileHidden: true
                },
                {
                  key: 'created_at',
                  title: '操作时间',
                  render: (value) => (
                    <span className="text-sm">{formatDateTime(value)}</span>
                  )
                }
              ]}
              data={logs}
              actions={[
                {
                  key: 'view',
                  label: '查看详情',
                  icon: Eye,
                  onClick: (record) => {
                    // 这里可以打开详情对话框
                    console.log('查看日志详情:', record);
                  }
                }
              ]}
              loading={loading}
              emptyText="暂无操作日志"
            />
          )}

          {/* 分页 */}
          {!loading && logs.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                pageSize={pagination.page_size}
                totalItems={pagination.total_items}
                onPageChange={handlePageChange}
                onPageSizeChange={() => {
                  // 默认不支持修改每页大小
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}