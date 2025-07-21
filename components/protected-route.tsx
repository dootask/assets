'use client';

import Loading from './loading';
import { useDootaskContext } from '@/contexts/dootask-context';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, error } = useDootaskContext();

  // 显示加载状态
  if (loading) {
    return <Loading delay={300} />;
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 animate-bounce text-red-400" />
          <h2 className="mb-2 text-2xl font-semibold text-red-500">系统异常</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()}>刷新</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
