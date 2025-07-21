'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingProps {
  message?: string;
  className?: string;
  delay?: number;
}

export default function Loading({ message = '正在加载...', className, delay = 0 }: LoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (delay === 0) {
      setShow(true);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className={cn('bg-background flex min-h-screen items-center justify-center', className)}>
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function LoadingInline({ message, className, delay = 0 }: LoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (delay === 0) {
      setShow(true);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return (
    <div className={cn('text-muted-foreground flex items-center justify-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {message && <div>{message}</div>}
    </div>
  );
}
