'use client';

import { BorrowForm } from '@/components/borrow/borrow-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewBorrowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSuccess = () => {
    router.push('/borrow');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">新增借用申请</h1>
          <p className="text-muted-foreground">添加新的借用申请</p>
        </div>
      </div>

      {/* 借用表单 */}
      <Card>
        <CardHeader>
          <CardTitle>借用信息</CardTitle>
        </CardHeader>
        <CardContent>
          <BorrowForm
            onSuccess={handleSuccess}
            loading={loading}
            setLoading={setLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}