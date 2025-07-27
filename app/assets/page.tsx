'use client';

import { Download, Edit, Eye, Filter, MoreHorizontal, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Pagination } from '@/components/pagination';
import { deleteAsset, exportAssets, getAssets } from '@/lib/api/assets';
import type { AssetFilters, AssetResponse, AssetStatus, PaginationRequest } from '@/lib/types';

// 资产状态映射
const statusMap: Record<AssetStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: '可用', variant: 'default' },
  borrowed: { label: '借用中', variant: 'secondary' },
  maintenance: { label: '维护中', variant: 'outline' },
  scrapped: { label: '已报废', variant: 'destructive' },
};

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    page_size: 12,
    total_items: 0,
    total_pages: 0,
  });
  
  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<AssetResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载资产列表
  const loadAssets = useCallback(async (page = 1, pageSize = 12) => {
    try {
      setLoading(true);
      
      const params: PaginationRequest & { filters?: AssetFilters } = {
        page,
        page_size: pageSize,
        sorts: [{ key: 'created_at', desc: true }],
        filters: {
          ...filters,
          ...(searchTerm && { name: searchTerm }),
        },
      };
      
      const response = await getAssets(params);
      setAssets(response.data.data);
      setPagination(response.data);
    } catch (error) {
      console.error('加载资产列表失败:', error);
      toast.error('加载资产列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  // 初始加载
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // 搜索处理
  const handleSearch = useCallback(() => {
    loadAssets(1);
  }, [loadAssets]);

  // 筛选处理
  const handleFilterChange = (key: keyof AssetFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // 应用筛选
  const applyFilters = () => {
    loadAssets(1);
    setShowFilters(false);
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    loadAssets(1);
    setShowFilters(false);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    loadAssets(page, pagination.page_size);
  };

  // 删除资产
  const handleDelete = async () => {
    if (!assetToDelete) return;
    
    try {
      setDeleting(true);
      await deleteAsset(assetToDelete.id);
      toast.success('资产删除成功');
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      loadAssets(pagination.current_page);
    } catch (error) {
      console.error('删除资产失败:', error);
      toast.error('删除资产失败');
    } finally {
      setDeleting(false);
    }
  };

  // 导出资产
  const handleExport = async () => {
    try {
      const response = await exportAssets({
        ...filters,
        ...(searchTerm && { name: searchTerm }),
      });
      
      // 创建下载链接
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assets_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('资产数据导出成功');
    } catch (error) {
      console.error('导出资产失败:', error);
      toast.error('导出资产失败');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">资产管理</h1>
          <p className="text-muted-foreground">管理企业固定资产信息</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={() => router.push('/assets/import')}>
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
          <Button onClick={() => router.push('/assets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            新增资产
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索资产名称..."
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
                  <label className="text-sm font-medium mb-1 block">状态</label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value as AssetStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部状态</SelectItem>
                      {Object.entries(statusMap).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">品牌</label>
                  <Input
                    placeholder="输入品牌"
                    value={filters.brand || ''}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">位置</label>
                  <Input
                    placeholder="输入位置"
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">责任人</label>
                  <Input
                    placeholder="输入责任人"
                    value={filters.responsible_person || ''}
                    onChange={(e) => handleFilterChange('responsible_person', e.target.value)}
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

      {/* 资产列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            资产列表 ({pagination.total_items} 项)
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
          ) : assets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无资产数据</p>
              <Button className="mt-4" onClick={() => router.push('/assets/new')}>
                <Plus className="h-4 w-4 mr-2" />
                新增资产
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资产编号</TableHead>
                    <TableHead>资产名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>位置</TableHead>
                    <TableHead>责任人</TableHead>
                    <TableHead>采购价格</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.asset_no}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          {asset.brand && asset.model && (
                            <div className="text-sm text-muted-foreground">
                              {asset.brand} {asset.model}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {asset.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMap[asset.status].variant}>
                          {statusMap[asset.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.location || '-'}</TableCell>
                      <TableCell>{asset.responsible_person || '-'}</TableCell>
                      <TableCell>
                        {asset.purchase_price ? `¥${asset.purchase_price.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/assets/${asset.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/assets/${asset.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setAssetToDelete(asset);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 分页 */}
          {!loading && assets.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除资产 "{assetToDelete?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}