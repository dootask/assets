'use client';

import { BorrowDialog } from '@/components/borrow/borrow-dialog';
import { ReturnDialog } from '@/components/borrow/return-dialog';
import { Loading } from '@/components/loading';
import { Pagination } from '@/components/pagination';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { deleteBorrowRecord, getBorrowRecords } from '@/lib/api/borrow';
import type { BorrowFilters, BorrowResponse, PaginationRequest } from '@/lib/types';
import { Edit, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BorrowListProps {
  filters?: BorrowFilters;
  showActions?: boolean;
  pageSize?: number;
  onBorrowUpdate?: () => void;
}

export function BorrowList({ 
  filters = {}, 
  showActions = true, 
  pageSize = 10,
  onBorrowUpdate 
}: BorrowListProps) {
  const [borrowRecords, setBorrowRecords] = useState<BorrowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [editingBorrow, setEditingBorrow] = useState<BorrowResponse | null>(null);
  const [returningBorrow, setReturningBorrow] = useState<BorrowResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [borrowToDelete, setBorrowToDelete] = useState<BorrowResponse | null>(null);

  // 加载借用记录列表
  const loadBorrowRecords = async (page = 1) => {
    try {
      setLoading(true);

      const params: PaginationRequest & { filters?: BorrowFilters } = {
        page,
        page_size: pageSize,
        sorts: [{ key: 'created_at', desc: true }],
        filters,
      };

      const response = await getBorrowRecords(params);
      
      if (response.code === 'SUCCESS') {
        setBorrowRecords(response.data.data);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.total_pages);
        setTotalItems(response.data.total_items);
      } else {
        toast.error(response.message || '加载借用记录失败');
      }
    } catch (error) {
      console.error('加载借用记录失败:', error);
      toast.error('加载借用记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBorrowRecords(1);
  }, [filters, pageSize]);

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadBorrowRecords(page);
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
  const handleDelete = (borrow: BorrowResponse) => {
    setBorrowToDelete(borrow);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!borrowToDelete) return;

    try {
      const response = await deleteBorrowRecord(borrowToDelete.id);
      
      if (response.code === 'SUCCESS') {
        toast.success('借用记录删除成功');
        loadBorrowRecords(currentPage);
        onBorrowUpdate?.();
      } else {
        toast.error(response.message || '删除借用记录失败');
      }
    } catch (error) {
      console.error('删除借用记录失败:', error);
      toast.error('删除借用记录失败');
    } finally {
      setDeleteDialogOpen(false);
      setBorrowToDelete(null);
    }
  };

  // 对话框成功回调
  const handleDialogSuccess = () => {
    setBorrowDialogOpen(false);
    setReturnDialogOpen(false);
    setEditingBorrow(null);
    setReturningBorrow(null);
    loadBorrowRecords(currentPage);
    onBorrowUpdate?.();
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
    <div className="space-y-4">
      {borrowRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无借用记录
        </div>
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
                {showActions && <TableHead className="text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrowRecords.map((borrow) => (
                <TableRow key={borrow.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{borrow.asset?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {borrow.asset?.asset_no}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{borrow.borrower_name}</div>
                      {borrow.borrower_contact && (
                        <div className="text-sm text-muted-foreground">
                          {borrow.borrower_contact}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {borrow.department?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(borrow.borrow_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {borrow.expected_return_date 
                      ? new Date(borrow.expected_return_date).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {borrow.actual_return_date 
                      ? new Date(borrow.actual_return_date).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(borrow)}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {borrow.can_return && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReturn(borrow)}
                          >
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

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

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条借用记录吗？此操作不可撤销。
              {borrowToDelete?.status === 'borrowed' && (
                <div className="mt-2 text-red-600">
                  该记录状态为借用中，无法删除。请先归还资产。
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={borrowToDelete?.status === 'borrowed'}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}