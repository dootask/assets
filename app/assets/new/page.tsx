'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AssetForm } from '@/components/assets/asset-form';
import { createAsset } from '@/lib/api/assets';
import type { CreateAssetRequest, UpdateAssetRequest } from '@/lib/types';

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateAssetRequest | UpdateAssetRequest) => {
    try {
      setLoading(true);
      await createAsset(data as CreateAssetRequest);
      toast.success('资产创建成功');
      router.push('/assets');
    } catch (error) {
      console.error('创建资产失败:', error);
      toast.error('创建资产失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/assets');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">新增资产</h1>
          <p className="text-muted-foreground">添加新的固定资产信息</p>
        </div>
      </div>

      {/* 资产表单 */}
      <Card>
        <CardHeader>
          <CardTitle>资产信息</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}