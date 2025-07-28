'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface MobileFormProps {
  title: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  className?: string;
}

export function MobileForm({
  title,
  children,
  onSubmit,
  onCancel,
  submitText = '保存',
  cancelText = '取消',
  loading = false,
  className,
}: MobileFormProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50 md:min-h-0 md:bg-transparent', className)}>
      {/* 移动端全屏表单 */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col min-h-screen">
          <div className="flex-1 p-4 space-y-6">
            {children}
          </div>
          
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '保存中...' : submitText}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                {cancelText}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 桌面端卡片表单 */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {children}
              <div className="flex justify-end space-x-3">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {cancelText}
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : submitText}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MobileFormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileFormSection({ title, children, className }: MobileFormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2">
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface MobileFormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
}

export function MobileFormField({ 
  label, 
  children, 
  required = false, 
  error, 
  description,
  className 
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}