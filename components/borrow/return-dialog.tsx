'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { returnAsset } from '@/lib/api/borrow';
import type { BorrowResponse, ReturnAssetRequest } from '@/lib/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// 表单验证模式
const returnSchema = z.object({
  actual_return_date: z.date().optional(),
  notes: z.string().optional(),
});

type ReturnFormData = z.infer<typeof returnSchema>;

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrow?: BorrowResponse | null;
  onSuccess: () => void;
}

export function ReturnDialog({ open, onOpenChange, borrow, onSuccess }: ReturnDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      actual_return_date: new Date(),
      notes: '',
    },
  });

  // 当借用数据变化时更新表单
  useEffect(() => {
    if (borrow) {
      form.reset({
        actual_return_date: new Date(),
        notes: borrow.notes || '',
      });
    }
  }, [borrow, form]);

  // 提交表单
  const onSubmit = async (data: ReturnFormData) => {
    if (!borrow) return;

    try {
      setLoading(true);

      const returnData: ReturnAssetRequest = {
        actual_return_date: data.actual_return_date ? data.actual_return_date.toISOString() : undefined,
        notes: data.notes || undefined,
      };

      const response = await returnAsset(borrow.id, returnData);

      if (response.code === 'SUCCESS') {
        toast.success('资产归还成功');
        onSuccess();
      } else {
        toast.error(response.message || '资产归还失败');
      }
    } catch (error) {
      console.error('资产归还失败:', error);
      toast.error('资产归还失败');
    } finally {
      setLoading(false);
    }
  };

  // 关闭对话框时重置表单
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  // 计算借用天数
  const getBorrowDays = () => {
    if (!borrow) return 0;
    const borrowDate = new Date(borrow.borrow_date);
    const today = new Date();
    return Math.ceil((today.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // 获取状态徽章
  const getStatusInfo = () => {
    if (!borrow) return null;

    if (borrow.is_overdue) {
      return <Badge variant="destructive">超期 {borrow.overdue_days} 天</Badge>;
    }

    return <Badge variant="default">正常借用</Badge>;
  };

  if (!borrow) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>归还资产</DialogTitle>
        </DialogHeader>

        {/* 借用信息展示 */}
        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">资产名称:</span>
              <div>{borrow.asset?.name}</div>
            </div>
            <div>
              <span className="font-medium">资产编号:</span>
              <div>{borrow.asset?.asset_no}</div>
            </div>
            <div>
              <span className="font-medium">借用人:</span>
              <div>{borrow.borrower_name}</div>
            </div>
            <div>
              <span className="font-medium">借用时间:</span>
              <div>{new Date(borrow.borrow_date).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="font-medium">预期归还:</span>
              <div>
                {borrow.expected_return_date ? new Date(borrow.expected_return_date).toLocaleDateString() : '未设置'}
              </div>
            </div>
            <div>
              <span className="font-medium">借用天数:</span>
              <div>{getBorrowDays()} 天</div>
            </div>
            <div>
              <span className="font-medium">状态:</span>
              <div>{getStatusInfo()}</div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actual_return_date"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <FormLabel>实际归还时间</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-[240px] justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>选择归还日期</span>}
                          <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>归还备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入归还备注（如资产状态、损坏情况等）"
                      rows={3}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '归还中...' : '确认归还'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
