'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createDepartment, updateDepartment } from '@/lib/api/departments';
import type { CreateDepartmentRequest, DepartmentResponse, UpdateDepartmentRequest } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// 表单验证模式
const departmentSchema = z.object({
  name: z.string().min(1, '部门名称不能为空').max(100, '部门名称不能超过100个字符'),
  code: z.string().min(1, '部门编码不能为空').max(50, '部门编码不能超过50个字符'),
  manager: z.string().max(100, '负责人不能超过100个字符').optional(),
  contact: z.string().max(100, '联系方式不能超过100个字符').optional(),
  description: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: DepartmentResponse | null;
  onSuccess: () => void;
}

export function DepartmentDialog({ open, onOpenChange, department, onSuccess }: DepartmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!department;

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      manager: '',
      contact: '',
      description: '',
    },
  });

  // 当部门数据变化时更新表单
  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        code: department.code,
        manager: department.manager || '',
        contact: department.contact || '',
        description: department.description || '',
      });
    } else {
      form.reset({
        name: '',
        code: '',
        manager: '',
        contact: '',
        description: '',
      });
    }
  }, [department, form]);

  // 提交表单
  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setLoading(true);

      if (isEditing) {
        // 更新部门
        const updateData: UpdateDepartmentRequest = {
          name: data.name,
          code: data.code,
          manager: data.manager || undefined,
          contact: data.contact || undefined,
          description: data.description || undefined,
        };

        const response = await updateDepartment(department.id, updateData);

        if (response.code === 'SUCCESS') {
          toast.success('部门更新成功');
          onSuccess();
        } else {
          toast.error(response.message || '更新部门失败');
        }
      } else {
        // 创建部门
        const createData: CreateDepartmentRequest = {
          name: data.name,
          code: data.code,
          manager: data.manager || undefined,
          contact: data.contact || undefined,
          description: data.description || undefined,
        };

        const response = await createDepartment(createData);

        if (response.code === 'SUCCESS') {
          toast.success('部门创建成功');
          onSuccess();
        } else {
          toast.error(response.message || '创建部门失败');
        }
      }
    } catch (error) {
      console.error('提交部门失败:', error);
      toast.error(isEditing ? '更新部门失败' : '创建部门失败');
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑部门' : '新增部门'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部门名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入部门名称" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部门编码 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入部门编码" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>负责人</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入负责人" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入部门描述" rows={3} {...field} disabled={loading} />
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
                {loading ? '提交中...' : isEditing ? '更新' : '创建'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
