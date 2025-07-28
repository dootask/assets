'use client';

import { Download, Edit, Eye, Filter, Plus, Search, Settings, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { BatchOperationsDialog } from '@/components/assets/batch-operations-dialog';
import { Loading } from '@/components/loading';
import { Pagination } from '@/components/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CurrencyRenderer, ResponsiveTable, StatusBadge } from '@/components/ui/responsive-table';
import { deleteAsset, exportAssets, getAssets } from '@/lib/api/assets';
import { showError, showSuccess } from '@/lib/notifications';
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

  // 批量操作状态
  const [selectedAssets, setSelectedAssets] = useState<AssetResponse[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

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
      showError('加载资产列表失败', '请检查网络连接或稍后重试');
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
      [key]: (value && value !== 'all') ? value : undefined,
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
      showSuccess('资产删除成功', `资产 "${assetToDelete.name}" 已成功删除`);
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      loadAssets(pagination.current_page);
    } catch (error) {
      console.error('删除资产失败:', error);
      showError('删除资产失败', '请检查资产是否正在使用中或稍后重试');
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
      
      showSuccess('资产数据导出成功', '文件已保存到下载目录');
    } catch (error) {
      console.error('导出资产失败:', error);
      showError('导出资产失败', '请稍后重试');
    }
  };

  // 处理资产选择
  const handleAssetSelect = (asset: AssetResponse, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, asset]);
    } else {
      setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
    }
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(assets);
    } else {
      setSelectedAssets([]);
    }
  };

  // 批量操作成功后的回调
  const handleBatchSuccess = () => {
    setSelectedAssets([]);
    setBatchDialogOpen(false);
    loadAssets(pagination.current_page);
  };

  const { current_page: currentPage, total_pages: totalPages, total_items: totalItems } = pagination;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">资产管理</h1>
          <p className="text-muted-foreground">管理企业固定资产信息</p>
        </div>
        <div className="flex gap-2">
          {selectedAssets.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setBatchDialogOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              批量操作 ({selectedAssets.length})
            </Button>
          )}
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
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value as AssetStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                                              <SelectItem value="all">全部状态</SelectItem>
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
          <CardTitle className="flex items-center justify-between">
            <span>资产列表 ({pagination.total_items} 项)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : assets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无资产数据</p>
              <Button className="mt-4" onClick={() => router.push('/assets/new')}>
                <Plus className="h-4 w-4 mr-2" />
                新增资产
              </Button>
            </div>
          ) : (
            <ResponsiveTable
              columns={[
                {
                  key: 'select',
                  title: <Checkbox
                  checked={selectedAssets.length === assets.length}
                  onCheckedChange={handleSelectAll}
                />,
                  render: (_, record) => (
                    <Checkbox
                      checked={selectedAssets.some(a => a.id === record.id)}
                      onCheckedChange={(checked) => handleAssetSelect(record, checked as boolean)}
                    />
                  ),
                  className: 'w-12'
                },
                {
                  key: 'asset_no',
                  title: '资产编号',
                  render: (value) => <span className="font-medium">{value}</span>
                },
                {
                  key: 'name',
                  title: '资产名称',
                  render: (value, record) => (
                    <div>
                      <div className="font-medium">{value}</div>
                      {record.brand && record.model && (
                        <div className="text-sm text-muted-foreground">
                          {record.brand} {record.model}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'category',
                  title: '分类',
                  render: (value) => value?.name || '-',
                  mobileHidden: true
                },
                {
                  key: 'status',
                  title: '状态',
                  render: (value) => <StatusBadge status={value} statusMap={statusMap} />
                },
                {
                  key: 'location',
                  title: '位置',
                  render: (value) => value || '-',
                  mobileHidden: true
                },
                {
                  key: 'responsible_person',
                  title: '责任人',
                  render: (value) => value || '-',
                  mobileHidden: true
                },
                {
                  key: 'purchase_price',
                  title: '采购价格',
                  render: (value) => value ? <CurrencyRenderer amount={value} /> : '-',
                  mobileHidden: true
                }
              ]}
              data={assets}
              actions={[
                {
                  key: 'view',
                  label: '查看',
                  icon: Eye,
                  onClick: (record) => router.push(`/assets/${record.id}`)
                },
                {
                  key: 'edit',
                  label: '编辑',
                  icon: Edit,
                  onClick: (record) => router.push(`/assets/${record.id}/edit`)
                },
                {
                  key: 'delete',
                  label: '删除',
                  icon: Trash2,
                  variant: 'destructive',
                  onClick: (record) => {
                    setAssetToDelete(record);
                    setDeleteDialogOpen(true);
                  }
                }
              ]}
              loading={loading}
              emptyText="暂无资产数据"
            />
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={12}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={() => {
                  // 默认不支持修改每页大小
                }}
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
              你确定要删除资产 &quot;{assetToDelete?.name}&quot; 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量操作对话框 */}
      <BatchOperationsDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        selectedAssets={selectedAssets}
        onSuccess={handleBatchSuccess}
      />
    </div>
  );
}