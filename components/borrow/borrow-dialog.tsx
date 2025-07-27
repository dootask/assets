'use client';

import { AssetSelector } from '@/components/borrow/asset-selector';
import { DepartmentSelector } from '@/components/departments/department-selector';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createBorrowRecord, updateBorrowRecord } from '@/lib/api/borrow';
import type { BorrowResponse, CreateBorrowRequest, UpdateBorrowRequest } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// 表单验证模式
const borrowSchema = z.object({
  asset_id: z.number().min(1, '请选择资产'),
  borrower_name: z.string().min(1, '借用人姓名不能为空').max(100, '借用人姓名不能超过100个字符'),
  borrower_contact: z.string().max(100, '联系方式不能超过100个字符').optional(),
  department_id: z.number().optional(),
  borrow_date: z.string().min(1, '借用时间不能为空'),
  expected_return_date: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

type BorrowFormData = z.infer<typeof borrowSchema>;

interface BorrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrow?: BorrowResponse | null;
  onSuccess: () => void;
}

export function BorrowDialog({
  open,
  onOpenChange,
  borrow,
  onSuccess,
}: BorrowDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!borrow;

  const form = useForm<BorrowFormData>({
    resolver: zodResolver(borrowSchema),
    defaultValues: {
      asset_id: 0,
      borrower_name: '',
      borrower_contact: '',
      department_id: undefined,
      borrow_date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      purpose: '',
      notes: '',
    },
  });

  // 当借用数据变化时更新表单
  useEffect(() => {
    if (borrow) {
      form.reset({
        asset_id: borrow.asset_id,
        borrower_name: borrow.borrower_name,
        borrower_contact: borrow.borrower_contact || '',
        department_id: borrow.department_id || undefined,
        borrow_date: new Date(borrow.borrow_date).toISOString().split('T')[0],
        expected_return_date: borrow.expected_return_date 
          ? new Date(borrow.expected_return_date).toISOString().split('T')[0]
          : '',
        purpose: borrow.purpose || '',
        notes: borrow.notes || '',
      });
    } else {
      form.reset({
        asset_id: 0,
        borrower_name: '',
        borrower_contact: '',
        department_id: undefined,
        borrow_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        purpose: '',
        notes: '',
      });
    }
  }, [borrow, form]);

  // 提交表单
  const onSubmit = async (data: BorrowFormData) => {
    try {
      setLoading(true);

      if (isEditing) {
        // 更新借用记录
        const updateData: UpdateBorrowRequest = {
          borrower_name: data.borrower_name,
          borrower_contact: data.borrower_contact || undefined,
          department_id: data.department_id || undefined,
          borrow_date: data.borrow_date,
          expected_return_date: data.expected_return_date || undefined,
          purpose: data.purpose || undefined,
          notes: data.notes || undefined,
        };

        const response = await updateBorrowRecord(borrow.id, updateData);
        
        if (response.code === 'SUCCESS') {
          toast.success('借用记录更新成功');
          onSuccess();
        } else {
          toast.error(response.message || '更新借用记录失败');
        }
      } else {
        // 创建借用记录
        const createData: CreateBorrowRequest = {
          asset_id: data.asset_id,
          borrower_name: data.borrower_name,
          borrower_contact: data.borrower_contact || undefined,
          department_id: data.department_id || undefined,
          borrow_date: data.borrow_date,
          expected_return_date: data.expected_return_date || undefined,
          purpose: data.purpose || undefined,
          notes: data.notes || undefined,
        };

        const response = await createBorrowRecord(createData);
        
        if (response.code === 'SUCCESS') {
          toast.success('借用记录创建成功');
          onSuccess();
        } else {
          toast.error(response.message || '创建借用记录失败');
        }
      }
    } catch (error) {
      console.error('提交借用记录失败:', error);
      toast.error(isEditing ? '更新借用记录失败' : '创建借用记录失败');
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑借用记录' : '新增借用记录'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择资产 *</FormLabel>
                    <FormControl>
                      <AssetSelector
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="borrower_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>借用人姓名 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入借用人姓名"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="borrower_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系方式</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入联系方式"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属部门</FormLabel>
                  <FormControl>
                    <DepartmentSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="borrow_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>借用时间 *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_return_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预期归还时间</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>借用用途</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入借用用途"
                      rows={2}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入备注信息"
                      rows={2}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '提交中...' : (isEditing ? '更新' : '创建')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}