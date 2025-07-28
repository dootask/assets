'use client';

import { Calendar, DollarSign, Edit, MapPin, Package, Trash2, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import { useAppContext } from '@/contexts/app-context';
import { deleteAsset, getAsset } from '@/lib/api/assets';
import type { AssetResponse, AssetStatus } from '@/lib/types';

// 资产状态映射
const statusMap: Record<AssetStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: '可用', variant: 'default' },
  borrowed: { label: '借用中', variant: 'secondary' },
  maintenance: { label: '维护中', variant: 'outline' },
  scrapped: { label: '已报废', variant: 'destructive' },
};

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = parseInt(params.id as string);

  const [asset, setAsset] = useState<AssetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const { Confirm } = useAppContext();

  // 加载资产详情
  useEffect(() => {
    const loadAsset = async () => {
      try {
        setLoading(true);
        const response = await getAsset(assetId);
        setAsset(response.data);
      } catch (error) {
        console.error('加载资产详情失败:', error);
        toast.error('加载资产详情失败');
        router.push('/assets');
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      loadAsset();
    }
  }, [assetId, router]);

  // 删除资产
  const handleDelete = async () => {
    if (!asset) return;

    const confirmed = await Confirm({
      title: '确认删除',
      message: `确定要删除资产 "${asset.name}" 吗？此操作不可撤销。`,
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteAsset(asset.id);
      toast.success('资产删除成功');
      router.push('/assets');
    } catch (error) {
      console.error('删除资产失败:', error);
      toast.error('删除资产失败');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">资产不存在</p>
          <Button className="mt-4" onClick={() => router.push('/assets')}>
            返回资产列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
            <p className="text-muted-foreground">资产编号: {asset.asset_no}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/assets/${asset.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">资产编号:</span>
                  <span className="font-medium">{asset.asset_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">资产名称:</span>
                  <span className="font-medium">{asset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">分类:</span>
                  <span className="font-medium">{asset.category?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">部门:</span>
                  <span className="font-medium">{asset.department?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态:</span>
                  <Badge variant={statusMap[asset.status].variant}>
                    {statusMap[asset.status].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">品牌:</span>
                  <span className="font-medium">{asset.brand || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">型号:</span>
                  <span className="font-medium">{asset.model || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">序列号:</span>
                  <span className="font-medium">{asset.serial_number || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 采购信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                采购信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">采购日期:</span>
                  <span className="font-medium">
                    {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">采购价格:</span>
                  <span className="font-medium">
                    {asset.purchase_price ? `¥${asset.purchase_price.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">供应商:</span>
                  <span className="font-medium">{asset.supplier || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">保修期:</span>
                  <span className="font-medium">
                    {asset.warranty_period ? `${asset.warranty_period}个月` : '-'}
                  </span>
                </div>
                {asset.warranty_end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">保修到期:</span>
                    <span className={`font-medium ${asset.is_under_warranty ? 'text-green-600' : 'text-red-600'}`}>
                      {new Date(asset.warranty_end_date).toLocaleDateString()}
                      {asset.is_under_warranty ? ' (保修中)' : ' (已过期)'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 使用信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                使用信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">位置:</span>
                  <span className="font-medium">{asset.location || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">责任人:</span>
                  <span className="font-medium">{asset.responsible_person || '-'}</span>
                </div>
              </div>
              {asset.description && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">描述:</span>
                    <p className="mt-2 text-sm">{asset.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 借用记录 */}
          {asset.borrow_records && asset.borrow_records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>最近借用记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {asset.borrow_records.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{record.borrower_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(record.borrow_date).toLocaleDateString()}
                          {record.actual_return_date && (
                            <> - {new Date(record.actual_return_date).toLocaleDateString()}</>
                          )}
                        </div>
                      </div>
                      <Badge variant={record.status === 'returned' ? 'default' : 'secondary'}>
                        {record.status === 'borrowed' ? '借用中' : 
                         record.status === 'returned' ? '已归还' : '超期'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 资产图片 */}
          {asset.image_url && (
            <Card>
              <CardHeader>
                <CardTitle>资产图片</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* 快速信息 */}
          <Card>
            <CardHeader>
              <CardTitle>快速信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">状态</div>
                  <Badge variant={statusMap[asset.status].variant}>
                    {statusMap[asset.status].label}
                  </Badge>
                </div>
              </div>
              {asset.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">位置</div>
                    <div className="font-medium">{asset.location}</div>
                  </div>
                </div>
              )}
              {asset.responsible_person && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">责任人</div>
                    <div className="font-medium">{asset.responsible_person}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">创建时间</div>
                  <div className="font-medium">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}