'use client';

import { ReturnDialog } from '@/components/borrow/return-dialog';
import Loading from '@/components/loading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getBorrowRecords } from '@/lib/api/borrow';
import type { BorrowFilters, BorrowResponse, PaginationRequest } from '@/lib/types';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ReturnPage() {
  const router = useRouter();
  const [borrowRecords, setBorrowRecords] = useState<BorrowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningBorrow, setReturningBorrow] = useState<BorrowResponse | null>(null);

  const pageSize = 20;

  // 加载待归还的借用记录
  const loadBorrowRecords = async (page = 1) => {
    try {
      setLoading(true);
      
      // 只查询借用中的记录
      const filters: BorrowFilters = {
        status: 'borrowed',
      };

      const params: PaginationRequest & { filters?: BorrowFilters } = {
        page,
        page_size: pageSize,
        sorts: [{ key: 'borrow_date', desc: false }], // 按借用时间升序，优先显示借用时间较早的
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
  }, []);

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadBorrowRecords(page);
  };

  // 归还资产
  const handleReturn = (borrow: BorrowResponse) => {
    setReturningBorrow(borrow);
    setReturnDialogOpen(true);
  };

  // 对话框成功回调
  const handleDialogSuccess = () => {
    setReturnDialogOpen(false);
    setReturningBorrow(null);
    loadBorrowRecords(currentPage);
  };

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 获取状态徽章
  const getStatusBadge = (borrow: BorrowResponse) => {
    if (borrow.is_overdue) {
      return <Badge variant="destructive">超期 ({borrow.overdue_days}天)</Badge>;
    }
    return <Badge variant="default">借用中</Badge>;
  };

  // 计算借用天数
  const getBorrowDays = (borrowDate: string) => {
    const borrow = new Date(borrowDate);
    const today = new Date();
    return Math.ceil((today.getTime() - borrow.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading && borrowRecords.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div className="flex items-center space-x-2">
          <RotateCcw className="h-6 w-6" />
          <h1 className="text-2xl font-bold">资产归还</h1>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待归还资产</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">超期资产</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {borrowRecords.filter(b => b.is_overdue).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均借用天数</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {borrowRecords.length > 0 
                ? Math.round(borrowRecords.reduce((sum, b) => sum + getBorrowDays(b.borrow_date), 0) / borrowRecords.length)
                : 0
              } 天
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 待归还列表 */}
      <Card>
        <CardHeader>
          <CardTitle>待归还资产列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : borrowRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无待归还资产
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
                    <TableHead>借用天数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowRecords.map((borrow) => (
                    <TableRow key={borrow.id} className={borrow.is_overdue ? 'bg-red-50' : ''}>
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
                        <span className={borrow.is_overdue ? 'text-red-600 font-medium' : ''}>
                          {getBorrowDays(borrow.borrow_date)} 天
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(borrow)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(borrow)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          归还
                        </Button>
                      </TableCell>
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
        </CardContent>
      </Card>

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