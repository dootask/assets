'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CategoryTreeNode, createCategory, getCategories, updateCategory } from '@/lib/api/categories';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryTreeNode | null;
  parentCategory?: CategoryTreeNode | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  code: string;
  parent_id?: number | null;
  description: string;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  parentCategory,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<CategoryTreeNode[]>([]);
  const isEditing = category && category.id > 0;
  const isCreatingSubCategory = category && category.id === 0;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const watchedParentId = watch('parent_id');

  // 加载所有分类用于父分类选择
  const loadAllCategories = async () => {
    try {
      const data = await getCategories();
      setAllCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadAllCategories();
      
      if (isEditing && category) {
        // 编辑模式：填充现有数据
        reset({
          name: category.name,
          code: category.code,
          parent_id: category.parent_id || undefined,
          description: category.description || '',
        });
      } else if (isCreatingSubCategory && parentCategory) {
        // 创建子分类模式：设置父分类
        reset({
          name: '',
          code: '',
          parent_id: parentCategory.id,
          description: '',
        });
      } else {
        // 创建新分类模式：清空表单
        reset({
          name: '',
          code: '',
          parent_id: undefined,
          description: '',
        });
      }
    }
  }, [open, category, parentCategory, isEditing, isCreatingSubCategory, reset]);

  // 递归获取所有分类的扁平列表（用于父分类选择）
  const getFlatCategories = (categories: CategoryTreeNode[], level = 0): Array<{ category: CategoryTreeNode; level: number }> => {
    const result: Array<{ category: CategoryTreeNode; level: number }> = [];
    
    for (const cat of categories) {
      // 如果是编辑模式，排除自己和自己的子分类
      if (isEditing && category && (cat.id === category.id || isDescendant(cat, category.id))) {
        continue;
      }
      
      result.push({ category: cat, level });
      
      if (cat.children && cat.children.length > 0) {
        result.push(...getFlatCategories(cat.children, level + 1));
      }
    }
    
    return result;
  };

  // 检查是否为指定分类的后代
  const isDescendant = (category: CategoryTreeNode, ancestorId: number): boolean => {
    if (!category.children) return false;
    
    for (const child of category.children) {
      if (child.id === ancestorId || isDescendant(child, ancestorId)) {
        return true;
      }
    }
    
    return false;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const payload = {
        name: data.name,
        code: data.code,
        parent_id: data.parent_id || undefined,
        description: data.description || undefined,
      };

      if (isEditing && category) {
        await updateCategory(category.id, payload);
        toast.success('分类更新成功');
      } else {
        await createCategory(payload);
        toast.success('分类创建成功');
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Failed to save category:', error);
      const message = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || '操作失败'
        : '操作失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const flatCategories = getFlatCategories(allCategories);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑分类' : isCreatingSubCategory ? '创建子分类' : '创建分类'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">分类名称 *</Label>
            <Input
              id="name"
              {...register('name', { required: '请输入分类名称' })}
              placeholder="请输入分类名称"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">分类编码 *</Label>
            <Input
              id="code"
              {...register('code', { required: '请输入分类编码' })}
              placeholder="请输入分类编码（如：OFFICE）"
              className="font-mono"
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_id">父分类</Label>
            <Select
              value={watchedParentId?.toString() || 'none'}
              onValueChange={(value) => setValue('parent_id', value === 'none' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择父分类（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无父分类</SelectItem>
                {flatCategories.map(({ category, level }) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <span style={{ paddingLeft: `${level * 16}px` }}>
                      {category.name} ({category.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="请输入分类描述（可选）"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : isEditing ? '更新' : '创建'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}