'use client';

import { BorrowDialog } from '@/components/borrow/borrow-dialog';
import { ReturnDialog } from '@/components/borrow/return-dialog';
import { CommandSelect } from '@/components/command-select';
import { Loading } from '@/components/loading';
import { Pagination, defaultPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/app-context';
import { deleteBorrowRecord, getBorrowRecords } from '@/lib/api/borrow';
import type { BorrowFilters, BorrowResponse, BorrowStatus, PaginationRequest } from '@/lib/types';
import { AxiosError } from 'axios';
import { AlertTriangle, CheckCircle, Clock, Edit, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BorrowPage() {
  const { Confirm } = useAppContext();

  const [borrowRecords, setBorrowRecords] = useState<BorrowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BorrowStatus | 'all'>('all');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [pagination, setPagination] = useState(defaultPagination);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState<BorrowResponse | null>(null);
  const [returningBorrow, setReturningBorrow] = useState<BorrowResponse | null>(null);

  // 加载借用记录列表
  const loadBorrowRecords = async (page = 1, search = '', status: BorrowStatus | 'all' = 'all', overdue = false) => {
    try {
      setLoading(true);

      const filters: BorrowFilters = {};
      if (search.trim()) {
        filters.borrower_name = search.trim();
      }
      if (status !== 'all') {
        filters.status = status;
      }
      if (overdue) {
        filters.overdue_only = true;
      }

      const params: PaginationRequest & { filters?: BorrowFilters } = {
        page,
        page_size: pagination.page_size,
        sorts: [{ key: 'created_at', desc: true }],
        filters,
      };

      const response = await getBorrowRecords(params);

      if (response.code === 'SUCCESS') {
        setBorrowRecords(response.data.data);
        setPagination(response.data);
      } else {
        toast.error(response.message || '加载借用记录失败');
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.status !== 403) {
          toast.error('加载借用记录失败');
        }
      }
      console.error('加载借用记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBorrowRecords(1, '', 'all', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 搜索处理
  const handleSearch = () => {
    loadBorrowRecords(1, searchTerm, statusFilter, overdueFilter);
  };

  // 筛选处理
  const handleFilter = (newStatus: BorrowStatus | 'all', newOverdue: boolean) => {
    setStatusFilter(newStatus);
    setOverdueFilter(newOverdue);
    loadBorrowRecords(1, searchTerm, newStatus, newOverdue);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    loadBorrowRecords(page, searchTerm, statusFilter, overdueFilter);
  };

  // 新增借用
  const handleCreate = () => {
    setEditingBorrow(null);
    setBorrowDialogOpen(true);
  };

  // 编辑借用
  const handleEdit = (borrow: BorrowResponse) => {
    setEditingBorrow(borrow);
    setBorrowDialogOpen(true);
  };

  // 归还资产
  const handleReturn = (borrow: BorrowResponse) => {
    setReturningBorrow(borrow);
    setReturnDialogOpen(true);
  };

  // 删除借用记录
  const handleDelete = async (borrow: BorrowResponse) => {
    // 检查是否可以删除
    if (borrow.status === 'borrowed') {
      await Confirm({
        title: '无法删除',
        message: '该记录状态为借用中，无法删除。请先归还资产。',
        confirmText: '知道了',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = await Confirm({
      title: '确认删除',
      message: '确定要删除这条借用记录吗？此操作不可撤销。',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      const response = await deleteBorrowRecord(borrow.id);

      if (response.code === 'SUCCESS') {
        toast.success('借用记录删除成功');
        loadBorrowRecords(pagination.current_page, searchTerm, statusFilter, overdueFilter);
      } else {
        toast.error(response.message || '删除借用记录失败');
      }
    } catch (error) {
      console.error('删除借用记录失败:', error);
      toast.error('删除借用记录失败');
    }
  };

  // 对话框成功回调
  const handleDialogSuccess = () => {
    setBorrowDialogOpen(false);
    setReturnDialogOpen(false);
    setEditingBorrow(null);
    setReturningBorrow(null);
    loadBorrowRecords(pagination.current_page, searchTerm, statusFilter, overdueFilter);
  };

  // 获取状态徽章
  const getStatusBadge = (borrow: BorrowResponse) => {
    if (borrow.is_overdue) {
      return <Badge variant="destructive">超期 ({borrow.overdue_days}天)</Badge>;
    }

    switch (borrow.status) {
      case 'borrowed':
        return <Badge variant="default">借用中</Badge>;
      case 'returned':
        return <Badge variant="secondary">已归还</Badge>;
      case 'overdue':
        return <Badge variant="destructive">超期</Badge>;
      default:
        return <Badge variant="outline">{borrow.status}</Badge>;
    }
  };

  if (loading && borrowRecords.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">借用管理</h1>
          <p className="text-muted-foreground">管理企业资产借用记录</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增借用
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总借用数</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total_items}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">借用中</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{borrowRecords.filter(b => b.status === 'borrowed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">超期</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{borrowRecords.filter(b => b.is_overdue).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已归还</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {borrowRecords.filter(b => b.status === 'returned').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="搜索借用人..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <CommandSelect
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'borrowed', label: '借用中' },
                { value: 'returned', label: '已归还' },
                { value: 'overdue', label: '超期' },
              ]}
              value={statusFilter}
              onValueChange={value => handleFilter(value as BorrowStatus | 'all', overdueFilter)}
              placeholder="状态"
            />
            <Button
              variant={overdueFilter ? 'default' : 'outline'}
              onClick={() => handleFilter(statusFilter, !overdueFilter)}
            >
              仅超期
            </Button>
            <Button onClick={handleSearch} variant="outline">
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 借用记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>借用记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : borrowRecords.length === 0 ? (
            <div className="py-8 text-center text-gray-500">暂无借用记录</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资产信息</TableHead>
                    <TableHead>借用人</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>借用时间</TableHead>
                    <TableHead>预期归还</TableHead>
                    <TableHead>实际归还</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowRecords.map(borrow => (
                    <TableRow key={borrow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{borrow.asset?.name}</div>
                          <div className="text-muted-foreground text-sm">{borrow.asset?.asset_no}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{borrow.borrower_name}</div>
                          {borrow.borrower_contact && (
                            <div className="text-muted-foreground text-sm">{borrow.borrower_contact}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{borrow.department?.name || '-'}</TableCell>
                      <TableCell>{new Date(borrow.borrow_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {borrow.expected_return_date ? new Date(borrow.expected_return_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {borrow.actual_return_date ? new Date(borrow.actual_return_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(borrow)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {borrow.can_return && (
                            <Button variant="ghost" size="sm" onClick={() => handleReturn(borrow)}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(borrow)}
                            disabled={borrow.status === 'returned'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(borrow)}
                            disabled={borrow.status === 'borrowed'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* 借用对话框 */}
      <BorrowDialog
        open={borrowDialogOpen}
        onOpenChange={setBorrowDialogOpen}
        borrow={editingBorrow}
        onSuccess={handleDialogSuccess}
      />

      {/* 归还对话框 */}
      <ReturnDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        borrow={returningBorrow}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
