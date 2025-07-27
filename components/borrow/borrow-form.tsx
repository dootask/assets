'use client';

import { AssetSelector } from '@/components/borrow/asset-selector';
import { DepartmentSelector } from '@/components/departments/department-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { createBorrowRecord } from '@/lib/api/borrow';
import type { CreateBorrowRequest } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// 表单验证模式
const borrowFormSchema = z.object({
  asset_id: z.number().min(1, '请选择资产'),
  borrower_name: z.string().min(1, '借用人姓名不能为空').max(100, '借用人姓名不能超过100个字符'),
  borrower_contact: z.string().max(100, '联系方式不能超过100个字符').optional(),
  department_id: z.number().optional(),
  borrow_date: z.string().min(1, '借用时间不能为空'),
  expected_return_date: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

type BorrowFormData = z.infer<typeof borrowFormSchema>;

interface BorrowFormProps {
  onSuccess: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function BorrowForm({ onSuccess, loading, setLoading }: BorrowFormProps) {
  const form = useForm<BorrowFormData>({
    resolver: zodResolver(borrowFormSchema),
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

  // 提交表单
  const onSubmit = async (data: BorrowFormData) => {
    try {
      setLoading(true);

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
        toast.success('借用申请提交成功');
        onSuccess();
      } else {
        toast.error(response.message || '提交借用申请失败');
      }
    } catch (error) {
      console.error('提交借用申请失败:', error);
      toast.error('提交借用申请失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 资产选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">选择资产</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="asset_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>可借用资产 *</FormLabel>
                  <FormControl>
                    <AssetSelector
                      value={field.value || undefined}
                      onValueChange={(value) => field.onChange(value || 0)}
                      disabled={loading}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 借用人信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">借用人信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* 借用详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">借用详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="请详细说明借用用途"
                      rows={3}
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
                      placeholder="请输入其他备注信息"
                      rows={2}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? '提交中...' : '提交借用申请'}
          </Button>
        </div>
      </form>
    </Form>
  );
}