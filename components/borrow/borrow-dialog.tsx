'use client';

import { CommandSelect } from '@/components/command-select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { createBorrowRecord, getAvailableAssets, updateBorrowRecord } from '@/lib/api/borrow';
import { getDepartments } from '@/lib/api/departments';
import type {
    AvailableAssetResponse,
    BorrowResponse,
    CreateBorrowRequest,
    DepartmentResponse,
    UpdateBorrowRequest,
} from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDownIcon } from 'lucide-react';
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
  borrow_date: z.date({ message: '请选择借用时间' }),
  expected_return_date: z.date().optional(),
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

export function BorrowDialog({ open, onOpenChange, borrow, onSuccess }: BorrowDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AvailableAssetResponse[]>([]);

  const isEditing = borrow && borrow.id > 0;

  const form = useForm<BorrowFormData>({
    resolver: zodResolver(borrowSchema),
    defaultValues: {
      asset_id: 0,
      borrower_name: '',
      borrower_contact: '',
      department_id: undefined,
      borrow_date: new Date(),
      expected_return_date: undefined,
      purpose: '',
      notes: '',
    },
    mode: 'onBlur', // 改为失焦验证模式
    reValidateMode: 'onBlur',
  });

  // 加载部门列表
  const loadDepartments = async () => {
    try {
      const response = await getDepartments({
        page: 1,
        page_size: 100,
        sorts: [{ key: 'name', desc: false }],
      });

      if (response.code === 'SUCCESS') {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('加载部门列表失败:', error);
    }
  };

  // 加载可用资产列表
  const loadAvailableAssets = async () => {
    try {
      const response = await getAvailableAssets({
        page: 1,
        page_size: 100,
        search: '',
      });

      if (response.code === 'SUCCESS') {
        setAvailableAssets(response.data.data);
      }
    } catch (error) {
      console.error('加载可用资产列表失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    if (open) {
      loadDepartments();
      loadAvailableAssets();
    }
  }, [open]);

  // 当borrow改变时，更新表单值
  useEffect(() => {
    if (open) {
      if (borrow && isEditing) {
        // 编辑模式：填充现有数据
        form.reset({
          asset_id: borrow.asset_id,
          borrower_name: borrow.borrower_name,
          borrower_contact: borrow.borrower_contact || '',
          department_id: borrow.department_id || undefined,
          borrow_date: new Date(borrow.borrow_date),
          expected_return_date: borrow.expected_return_date ? new Date(borrow.expected_return_date) : undefined,
          purpose: borrow.purpose || '',
          notes: borrow.notes || '',
        });
      } else {
        // 新建模式：重置表单
        form.reset({
          asset_id: 0,
          borrower_name: '',
          borrower_contact: '',
          department_id: undefined,
          borrow_date: new Date(),
          expected_return_date: undefined,
          purpose: '',
          notes: '',
        });
      }
    }
  }, [open, borrow, form, isEditing]);

  // 提交表单
  const onSubmit = async (data: BorrowFormData) => {
    try {
      setLoading(true);

      if (isEditing) {
        // 更新借用记录
        const updateData: UpdateBorrowRequest = {
          borrower_name: data.borrower_name,
          borrower_contact: data.borrower_contact || '',
          department_id: data.department_id || undefined,
          borrow_date: data.borrow_date.toISOString(),
          expected_return_date: data.expected_return_date ? data.expected_return_date.toISOString() : undefined,
          purpose: data.purpose || '',
          notes: data.notes || '',
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
          borrow_date: data.borrow_date.toISOString(),
          expected_return_date: data.expected_return_date ? data.expected_return_date.toISOString() : undefined,
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
      form.reset({
        asset_id: 0,
        borrower_name: '',
        borrower_contact: '',
        department_id: undefined,
        borrow_date: new Date(),
        expected_return_date: undefined,
        purpose: '',
        notes: '',
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑借用记录' : '新增借用记录'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 min-h-0 -mx-6 px-6 space-y-4 overflow-y-auto">
            {!isEditing && (
              <FormField
                control={form.control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择资产 *</FormLabel>
                    <FormControl>
                      <CommandSelect
                        options={availableAssets.map(asset => ({
                          value: asset.id.toString(),
                          label: asset.name,
                          description: `${asset.asset_no} • ${asset.status} • ${asset.department?.name || ''}`,
                        }))}
                        value={field.value?.toString() || ''}
                        onValueChange={(value: string) => field.onChange(value ? parseInt(value) : undefined)}
                        placeholder="选择资产"
                        disabled={loading}
                        allowClear
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
                      <Input placeholder="请输入借用人姓名" {...field} disabled={loading} />
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
                      <Input placeholder="请输入联系方式" {...field} disabled={loading} />
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
                    <CommandSelect
                      options={departments.map(dept => ({
                        value: dept.id.toString(),
                        label: dept.name,
                        description: `${dept.code} • ${dept.asset_count || 0} 个资产`,
                      }))}
                      value={field.value?.toString() || ''}
                      onValueChange={(value: string) => field.onChange(value ? parseInt(value) : undefined)}
                      placeholder="选择部门"
                      disabled={loading}
                      allowClear
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? field.value.toLocaleDateString() : '请选择借用时间'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                            initialFocus
                            disabled={false}
                          />
                        </PopoverContent>
                      </Popover>
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? field.value.toLocaleDateString() : '请选择预期归还时间'}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              field.onChange(date);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                    <Textarea placeholder="请输入借用用途" rows={2} {...field} disabled={loading} />
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
                    <Textarea placeholder="请输入备注信息" rows={2} {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 -mx-6 px-6 sticky bottom-0 bg-background z-10">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '提交中...' : isEditing ? '更新' : '创建'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
