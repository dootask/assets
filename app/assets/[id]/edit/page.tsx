'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { AssetForm } from '@/components/assets/asset-form';
import { getAsset, updateAsset } from '@/lib/api/assets';
import type { AssetResponse, UpdateAssetRequest } from '@/lib/types';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = parseInt(params.id as string);

  const [asset, setAsset] = useState<AssetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (data: UpdateAssetRequest) => {
    try {
      setSubmitting(true);
      await updateAsset(assetId, data);
      toast.success('资产更新成功');
      router.push(`/assets/${assetId}`);
    } catch (error) {
      console.error('更新资产失败:', error);
      toast.error('更新资产失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/assets/${assetId}`);
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
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
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">编辑资产</h1>
          <p className="text-muted-foreground">编辑资产 "{asset.name}" 的信息</p>
        </div>
      </div>

      {/* 资产表单 */}
      <Card>
        <CardHeader>
          <CardTitle>资产信息</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetForm
            initialData={asset}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}