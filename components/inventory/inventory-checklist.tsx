'use client';

import { Loading } from '@/components/loading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAssets } from '@/lib/api/assets';
import type { InventoryRecord, InventoryTask } from '@/lib/api/inventory';
import { getInventoryRecords } from '@/lib/api/inventory';
import type { AssetFilters, AssetResponse, AssetStatus } from '@/lib/types';
import { AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface InventoryChecklistProps {
  task: InventoryTask;
  onAssetSelect?: (asset: AssetResponse) => void;
}

export function InventoryChecklist({ task, onAssetSelect }: InventoryChecklistProps) {
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [checkedAssets, setCheckedAssets] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [checkedFilter, setCheckedFilter] = useState<string>(''); // all, checked, unchecked

  useEffect(() => {
    loadAssets();
    loadCheckedAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, keyword, statusFilter, checkedFilter]);

  const loadAssets = async () => {
    try {
      setLoading(true);

      // 构建筛选条件
      const filters: AssetFilters = {};
      if (keyword) {
        filters.name = keyword;
      }
      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter as AssetStatus;
      }

      // 根据任务类型和范围过滤条件构建查询
      if (task.task_type === 'category' && task.scope_filter) {
        const scopeFilter = typeof task.scope_filter === 'string' ? JSON.parse(task.scope_filter) : task.scope_filter;
        if (scopeFilter.category_ids && scopeFilter.category_ids.length > 0) {
          filters.category_id = scopeFilter.category_ids[0]; // 简化处理，只取第一个分类
        }
      }

      if (task.task_type === 'department' && task.scope_filter) {
        const scopeFilter = typeof task.scope_filter === 'string' ? JSON.parse(task.scope_filter) : task.scope_filter;
        if (scopeFilter.department_ids && scopeFilter.department_ids.length > 0) {
          filters.department_id = scopeFilter.department_ids[0]; // 简化处理，只取第一个部门
        }
      }

      const response = await getAssets({
        page: currentPage,
        page_size: pageSize,
        sorts: [{ key: 'asset_no', desc: false }],
        filters,
      });

      if (response.code === 'SUCCESS') {
        let filteredAssets = response.data.data;

        // 根据是否已盘点进行筛选
        if (checkedFilter === 'checked') {
          filteredAssets = filteredAssets.filter(asset => checkedAssets.has(asset.id));
        } else if (checkedFilter === 'unchecked') {
          filteredAssets = filteredAssets.filter(asset => !checkedAssets.has(asset.id));
        }

        setAssets(filteredAssets);
        setTotal(response.data.total_items);
      } else {
        toast.error(response.message || '获取资产列表失败');
      }
    } catch (error) {
      console.error('获取资产列表失败:', error);
      toast.error('获取资产列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckedAssets = async () => {
    try {
      const response = await getInventoryRecords({
        page: 1,
        page_size: 1000, // 获取所有已盘点的记录
        task_id: task.id,
      });

      if (response.code === 'SUCCESS') {
        const checkedIds = new Set(response.data.data.map((record: InventoryRecord) => record.asset_id));
        setCheckedAssets(checkedIds);
      }
    } catch (error) {
      console.error('获取已盘点资产失败:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadAssets();
  };

  const getAssetStatus = (asset: AssetResponse) => {
    if (checkedAssets.has(asset.id)) {
      return { status: 'checked', label: '已盘点', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else {
      return { status: 'unchecked', label: '待盘点', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  const getProgress = () => {
    const totalAssets = task.total_assets;
    const checkedCount = task.checked_assets;
    return totalAssets > 0 ? ((checkedCount / totalAssets) * 100).toFixed(1) : '0.0';
  };

  if (loading && assets.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* 进度概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            盘点进度
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{task.total_assets}</div>
              <div className="text-sm text-gray-600">总资产</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{task.checked_assets}</div>
              <div className="text-sm text-gray-600">已盘点</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{task.total_assets - task.checked_assets}</div>
              <div className="text-sm text-gray-600">待盘点</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{getProgress()}%</div>
              <div className="text-sm text-gray-600">完成率</div>
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-1">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="搜索资产编号或名称..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="资产状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="available">可用</SelectItem>
                <SelectItem value="borrowed">借用中</SelectItem>
                <SelectItem value="maintenance">维修中</SelectItem>
                <SelectItem value="scrapped">已报废</SelectItem>
              </SelectContent>
            </Select>
            <Select value={checkedFilter} onValueChange={setCheckedFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="盘点状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="checked">已盘点</SelectItem>
                <SelectItem value="unchecked">待盘点</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 资产清单 */}
      <Card>
        <CardHeader>
          <CardTitle>资产清单</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <Loading />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资产编号</TableHead>
                    <TableHead>资产名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>当前状态</TableHead>
                    <TableHead>盘点状态</TableHead>
                    <TableHead>位置</TableHead>
                    {onAssetSelect && <TableHead>操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map(asset => {
                    const assetStatus = getAssetStatus(asset);
                    const StatusIcon = assetStatus.icon;
                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.asset_no}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.category?.name || '-'}</TableCell>
                        <TableCell>{asset.department?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge className={assetStatus.color}>{assetStatus.label}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{asset.location || '-'}</TableCell>
                        {onAssetSelect && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAssetSelect(asset)}
                              disabled={checkedAssets.has(asset.id)}
                            >
                              {checkedAssets.has(asset.id) ? '已盘点' : '选择盘点'}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {assets.length === 0 && <div className="py-8 text-center text-gray-500">暂无符合条件的资产</div>}

              {/* 分页 */}
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(total / pageSize)}
                  pageSize={pageSize}
                  totalItems={total}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={() => {
                    // pageSize 是常量，不支持修改
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
