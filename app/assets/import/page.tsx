'use client';

import { ArrowLeft, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssetImportPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">资产导入</h1>
          <p className="text-muted-foreground">批量导入资产数据</p>
        </div>
      </div>

      {/* 功能提示卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            导入功能
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">功能开发中</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              资产批量导入功能正在开发中，敬请期待。您可以先使用新增资产功能逐个添加资产信息。
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/assets')}
              >
                返回资产列表
              </Button>
              <Button 
                onClick={() => router.push('/assets/new')}
              >
                新增资产
              </Button>
            </div>
          </div>
          
          {/* 功能说明 */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">预计支持的功能：</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                支持 Excel (.xlsx, .xls) 和 CSV 格式文件导入
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                提供标准模板下载，确保数据格式正确性
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                数据验证和错误提示，确保导入质量
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                支持批量图片上传和关联
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 