'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { checkAssetNo } from '@/lib/api/assets';
import type { AssetResponse, AssetStatus, CreateAssetRequest, UpdateAssetRequest } from '@/lib/types';

// 表单验证模式
const assetFormSchema = z.object({
  asset_no: z.string().min(1, '资产编号不能为空').max(100, '资产编号不能超过100个字符'),
  name: z.string().min(1, '资产名称不能为空').max(200, '资产名称不能超过200个字符'),
  category_id: z.number().min(1, '请选择资产分类'),
  department_id: z.number().optional(),
  brand: z.string().max(100, '品牌不能超过100个字符').optional(),
  model: z.string().max(100, '型号不能超过100个字符').optional(),
  serial_number: z.string().max(100, '序列号不能超过100个字符').optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().min(0, '采购价格不能为负数').optional(),
  supplier: z.string().max(200, '供应商不能超过200个字符').optional(),
  warranty_period: z.number().min(0, '保修期不能为负数').optional(),
  status: z.enum(['available', 'borrowed', 'maintenance', 'scrapped']).optional(),
  location: z.string().max(200, '位置不能超过200个字符').optional(),
  responsible_person: z.string().max(100, '责任人不能超过100个字符').optional(),
  description: z.string().optional(),
  image_url: z.string().max(500, '图片URL不能超过500个字符').optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  initialData?: AssetResponse;
  onSubmit: (data: CreateAssetRequest | UpdateAssetRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
  hideButtons?: boolean;
}

// 资产状态选项
const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: 'available', label: '可用' },
  { value: 'borrowed', label: '借用中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'scrapped', label: '已报废' },
];

// 模拟分类和部门数据（实际应该从API获取）
const mockCategories = [
  { id: 1, name: '办公设备' },
  { id: 2, name: '电子设备' },
  { id: 3, name: '家具' },
  { id: 4, name: '车辆' },
];

const mockDepartments = [
  { id: 1, name: '行政部' },
  { id: 2, name: '技术部' },
  { id: 3, name: '销售部' },
  { id: 4, name: '财务部' },
];

export function AssetForm({ initialData, onSubmit, onCancel, loading = false, isEdit = false, hideButtons = false }: AssetFormProps) {
  const [assetNoChecking, setAssetNoChecking] = useState(false);
  const [assetNoValid, setAssetNoValid] = useState<boolean | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_no: initialData?.asset_no || '',
      name: initialData?.name || '',
      category_id: initialData?.category_id || 0,
      department_id: initialData?.department_id || undefined,
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      serial_number: initialData?.serial_number || '',
      purchase_date: initialData?.purchase_date ? initialData.purchase_date.split('T')[0] : '',
      purchase_price: initialData?.purchase_price || undefined,
      supplier: initialData?.supplier || '',
      warranty_period: initialData?.warranty_period || undefined,
      status: initialData?.status || 'available',
      location: initialData?.location || '',
      responsible_person: initialData?.responsible_person || '',
      description: initialData?.description || '',
      image_url: initialData?.image_url || '',
    },
  });

  // 检查资产编号是否存在
  const checkAssetNoAvailability = async (assetNo: string) => {
    if (!assetNo || (isEdit && assetNo === initialData?.asset_no)) {
      setAssetNoValid(null);
      return;
    }

    try {
      setAssetNoChecking(true);
      const response = await checkAssetNo(assetNo);
      setAssetNoValid(!response.data.exists);
    } catch (error) {
      console.error('检查资产编号失败:', error);
      setAssetNoValid(null);
    } finally {
      setAssetNoChecking(false);
    }
  };

  // 监听资产编号变化
  const assetNoValue = form.watch('asset_no');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (assetNoValue) {
        checkAssetNoAvailability(assetNoValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [assetNoValue, isEdit, initialData?.asset_no]);

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      setUploadingImage(true);

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);

      // 上传图片（这里应该调用实际的上传API）
      // const response = await uploadFile(formData);
      
      // 模拟上传成功，实际应该使用返回的URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setImagePreview(imageUrl);
        form.setValue('image_url', imageUrl);
        toast.success('图片上传成功');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  // 移除图片
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue('image_url', '');
  };

  // 表单提交
  const handleSubmit = (data: AssetFormData) => {
    // 验证资产编号
    if (!isEdit && assetNoValid === false) {
      toast.error('资产编号已存在，请使用其他编号');
      return;
    }

    // 转换数据格式
    const submitData = {
      ...data,
      category_id: data.category_id || undefined,
      department_id: data.department_id || undefined,
      purchase_date: data.purchase_date || undefined,
      purchase_price: data.purchase_price || undefined,
      warranty_period: data.warranty_period || undefined,
      brand: data.brand || undefined,
      model: data.model || undefined,
      serial_number: data.serial_number || undefined,
      supplier: data.supplier || undefined,
      location: data.location || undefined,
      responsible_person: data.responsible_person || undefined,
      description: data.description || undefined,
      image_url: data.image_url || undefined,
    };

    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 资产编号 */}
              <FormField
                control={form.control}
                name="asset_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>资产编号 *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input {...field} placeholder="请输入资产编号" />
                      </FormControl>
                      {assetNoChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      )}
                      {!assetNoChecking && assetNoValid === true && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {!assetNoChecking && assetNoValid === false && (
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {assetNoValid === false && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>资产编号已存在</AlertDescription>
                      </Alert>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 资产名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>资产名称 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入资产名称" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 资产分类 */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>资产分类 *</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择资产分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 所属部门 */}
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属部门</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择所属部门" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">不选择</SelectItem>
                        {mockDepartments.map((department) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 资产状态 */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>资产状态</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择资产状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 品牌 */}
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>品牌</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入品牌" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 型号 */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>型号</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入型号" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 序列号 */}
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>序列号</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入序列号" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 采购信息 */}
        <Card>
          <CardHeader>
            <CardTitle>采购信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 采购日期 */}
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>采购日期</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 采购价格 */}
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>采购价格</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="请输入采购价格"
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 供应商 */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>供应商</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入供应商" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 保修期 */}
              <FormField
                control={form.control}
                name="warranty_period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>保修期（月）</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="请输入保修期"
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 使用信息 */}
        <Card>
          <CardHeader>
            <CardTitle>使用信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 位置 */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>位置</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入位置" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 责任人 */}
              <FormField
                control={form.control}
                name="responsible_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>责任人</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="请输入责任人" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="请输入资产描述" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 资产图片 */}
        <Card>
          <CardHeader>
            <CardTitle>资产图片</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="资产图片预览"
                  className="w-48 h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">点击上传资产图片</p>
                  <p className="text-xs text-muted-foreground">支持 JPG、PNG 格式，大小不超过 5MB</p>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="mt-4"
                />
              </div>
            )}
            {uploadingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                上传中...
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        {!hideButtons && (
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading || assetNoValid === false}>
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {isEdit ? '更新中...' : '创建中...'}
                </>
              ) : (
                isEdit ? '更新资产' : '创建资产'
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}