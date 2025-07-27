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

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6" />
          <h1 className="text-2xl font-bold">新增借用申请</h1>
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