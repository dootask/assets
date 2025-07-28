'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, ChevronDownIcon, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { checkAssetNo } from '@/lib/api/assets';
import type { AttributeField, Category } from '@/lib/api/categories';
import { getCategories, getCategoryById } from '@/lib/api/categories';
import { getDepartments } from '@/lib/api/departments';
import { showError, showSuccess } from '@/lib/notifications';
import type {
  AssetResponse,
  AssetStatus,
  CreateAssetRequest,
  DepartmentResponse,
  UpdateAssetRequest,
} from '@/lib/types';

// 表单验证模式 - 添加自定义属性支持
const assetFormSchema = z.object({
  asset_no: z.string().min(1, '资产编号不能为空').max(100, '资产编号不能超过100个字符'),
  name: z.string().min(1, '资产名称不能为空').max(200, '资产名称不能超过200个字符'),
  category_id: z.number().min(1, '请选择资产分类'),
  department_id: z.number().optional(),
  brand: z.string().max(100, '品牌不能超过100个字符').optional(),
  model: z.string().max(100, '型号不能超过100个字符').optional(),
  serial_number: z.string().max(100, '序列号不能超过100个字符').optional(),
  purchase_date: z.date().optional(),
  purchase_price: z.number().min(0, '采购价格不能为负数').optional(),
  supplier: z.string().max(200, '供应商不能超过200个字符').optional(),
  warranty_period: z.number().min(0, '保修期不能为负数').optional(),
  status: z.enum(['available', 'borrowed', 'maintenance', 'scrapped']).optional(),
  location: z.string().max(200, '位置不能超过200个字符').optional(),
  responsible_person: z.string().max(100, '责任人不能超过100个字符').optional(),
  description: z.string().optional(),
  image_url: z.string().max(500, '图片URL不能超过500个字符').optional(),
  custom_attributes: z.record(z.string(), z.unknown()).optional(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

// 定义自定义属性字段名类型
type CustomAttributeFieldName = `custom_attributes.${string}`;

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

export function AssetForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
  hideButtons = false,
}: AssetFormProps) {
  const [assetNoChecking, setAssetNoChecking] = useState(false);
  const [assetNoValid, setAssetNoValid] = useState<boolean | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分类相关状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryAttributes, setCategoryAttributes] = useState<AttributeField[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCategoryDetails, setLoadingCategoryDetails] = useState(false);

  // 部门相关状态
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_no: initialData?.asset_no || '',
      name: initialData?.name || '',
      category_id: initialData?.category_id || undefined,
      department_id: initialData?.department_id || undefined,
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      serial_number: initialData?.serial_number || '',
      purchase_date: initialData?.purchase_date ? new Date(initialData.purchase_date) : undefined,
      purchase_price: initialData?.purchase_price || undefined,
      supplier: initialData?.supplier || '',
      warranty_period: initialData?.warranty_period || undefined,
      status: initialData?.status || 'available',
      location: initialData?.location || '',
      responsible_person: initialData?.responsible_person || '',
      description: initialData?.description || '',
      image_url: initialData?.image_url || '',
      custom_attributes: initialData?.custom_attributes || {},
    },
  });

  // 加载部门列表
  const loadDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true);
      const response = await getDepartments({
        page: 1,
        page_size: 100, // 获取所有部门
        sorts: [{ key: 'name', desc: false }],
      });
      setDepartments(response.data.data);
    } catch (error) {
      console.error('加载部门失败:', error);
      showError('加载部门失败', '请检查网络连接或稍后重试');
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // 加载分类属性模板
  const loadCategoryAttributes = useCallback(async (categoryId: number) => {
    try {
      setLoadingCategoryDetails(true);
      const category = await getCategoryById(categoryId);
      setSelectedCategory(category);

      // 处理分类属性
      if (category.attributes && typeof category.attributes === 'object' && 'fields' in category.attributes) {
        const attributes = category.attributes as { fields: AttributeField[] };
        setCategoryAttributes(attributes.fields || []);
      } else {
        setCategoryAttributes([]);
      }
    } catch (error) {
      console.error('加载分类属性失败:', error);
      setCategoryAttributes([]);
    } finally {
      setLoadingCategoryDetails(false);
    }
  }, []);

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await getCategories();

      // 扁平化分类树为简单列表
      const flattenCategories = (cats: Category[]): Category[] => {
        const result: Category[] = [];
        for (const cat of cats) {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            result.push(...flattenCategories(cat.children));
          }
        }
        return result;
      };

      const flatCategories = flattenCategories(categoriesData);
      setCategories(flatCategories);

      // 如果有初始数据，加载对应分类的属性模板
      if (initialData?.category_id) {
        await loadCategoryAttributes(initialData.category_id);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
      showError('加载分类失败', '请检查网络连接或稍后重试');
    } finally {
      setLoadingCategories(false);
    }
  }, [initialData?.category_id, loadCategoryAttributes]);

  // 初始化加载数据
  useEffect(() => {
    loadCategories();
    loadDepartments();
  }, [loadCategories, loadDepartments]);

  // 监听分类选择变化
  const categoryId = form.watch('category_id');
  useEffect(() => {
    if (categoryId && categoryId !== selectedCategory?.id) {
      loadCategoryAttributes(categoryId);
    }
  }, [categoryId, selectedCategory?.id, loadCategoryAttributes]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetNoValue, isEdit, initialData?.asset_no]);

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showError('请选择图片文件', '只能上传图片格式的文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      showError('图片大小不能超过5MB', '请选择更小的图片文件');
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
      reader.onload = e => {
        const imageUrl = e.target?.result as string;
        setImagePreview(imageUrl);
        form.setValue('image_url', imageUrl);
        showSuccess('图片上传成功', '图片已成功上传并预览');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('图片上传失败:', error);
      showError('图片上传失败', '请稍后重试');
    } finally {
      setUploadingImage(false);
    }
  };

  // 移除图片
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue('image_url', '');
  };

  // 渲染自定义属性字段
  const renderCustomAttributeField = (attribute: AttributeField) => {
    const fieldName = `custom_attributes.${attribute.name}` as CustomAttributeFieldName;
    const currentValue = form.getValues('custom_attributes')?.[attribute.name];

    switch (attribute.type) {
      case 'text':
        return (
          <FormField
            key={attribute.name}
            control={form.control}
            name={fieldName as keyof AssetFormData}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {attribute.label}
                  {attribute.required && ' *'}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value || currentValue || '') as string}
                    onChange={e => {
                      const customAttributes = form.getValues('custom_attributes') || {};
                      form.setValue('custom_attributes', {
                        ...customAttributes,
                        [attribute.name]: e.target.value,
                      });
                    }}
                    placeholder={`请输入${attribute.label}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'number':
        return (
          <FormField
            key={attribute.name}
            control={form.control}
            name={fieldName as keyof AssetFormData}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {attribute.label}
                  {attribute.required && ' *'}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    value={(field.value || currentValue || '') as string}
                    onChange={e => {
                      const customAttributes = form.getValues('custom_attributes') || {};
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      form.setValue('custom_attributes', {
                        ...customAttributes,
                        [attribute.name]: value,
                      });
                    }}
                    placeholder={`请输入${attribute.label}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'date':
        return (
          <FormField
            key={attribute.name}
            control={form.control}
            name={fieldName as keyof AssetFormData}
            render={() => (
              <FormItem>
                <FormLabel>
                  {attribute.label}
                  {attribute.required && ' *'}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {currentValue
                          ? new Date(currentValue as string).toLocaleDateString()
                          : `请选择${attribute.label}`}
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentValue ? new Date(currentValue as string) : undefined}
                      captionLayout="dropdown"
                      onSelect={date => {
                        const customAttributes = form.getValues('custom_attributes') || {};
                        form.setValue('custom_attributes', {
                          ...customAttributes,
                          [attribute.name]: date?.toISOString().split('T')[0],
                        });
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={attribute.name}
            control={form.control}
            name={fieldName as keyof AssetFormData}
            render={() => (
              <FormItem>
                <FormLabel>
                  {attribute.label}
                  {attribute.required && ' *'}
                </FormLabel>
                <Select
                  value={(currentValue as string) || ''}
                  onValueChange={value => {
                    const customAttributes = form.getValues('custom_attributes') || {};
                    form.setValue('custom_attributes', {
                      ...customAttributes,
                      [attribute.name]: value,
                    });
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`请选择${attribute.label}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {attribute.options?.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'boolean':
        return (
          <FormField
            key={attribute.name}
            control={form.control}
            name={fieldName as keyof AssetFormData}
            render={() => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={(currentValue as boolean) || false}
                    onCheckedChange={checked => {
                      const customAttributes = form.getValues('custom_attributes') || {};
                      form.setValue('custom_attributes', {
                        ...customAttributes,
                        [attribute.name]: checked,
                      });
                    }}
                  />
                </FormControl>
                <FormLabel>
                  {attribute.label}
                  {attribute.required && ' *'}
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  // 表单提交
  const handleSubmit = (data: AssetFormData) => {
    // 验证资产编号
    if (!isEdit && assetNoValid === false) {
      showError('资产编号已存在，请使用其他编号', '请更换一个唯一的资产编号');
      return;
    }

    // 验证自定义属性必填字段
    if (categoryAttributes.length > 0) {
      for (const attribute of categoryAttributes) {
        if (attribute.required) {
          const value = data.custom_attributes?.[attribute.name];
          if (value === undefined || value === null || value === '') {
            showError(`请填写${attribute.label}`, '这是必填字段');
            return;
          }
        }
      }
    }

    // 转换数据格式
    const submitData = {
      ...data,
      category_id: data.category_id || undefined,
      department_id: data.department_id || undefined,
      purchase_date: data.purchase_date ? data.purchase_date.toISOString().split('T')[0] : undefined,
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
      custom_attributes:
        data.custom_attributes && Object.keys(data.custom_attributes).length > 0 ? data.custom_attributes : undefined,
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <div className="absolute top-1/2 right-3 -translate-y-1/2">
                          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        </div>
                      )}
                      {!assetNoChecking && assetNoValid === true && (
                        <Check className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500" />
                      )}
                      {!assetNoChecking && assetNoValid === false && (
                        <X className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-red-500" />
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
                      onValueChange={value => field.onChange(parseInt(value))}
                      disabled={loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCategories ? '加载中...' : '请选择资产分类'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
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
                      value={field.value?.toString() || 'none'}
                      onValueChange={value => field.onChange(value === 'none' ? undefined : parseInt(value))}
                      disabled={loadingDepartments}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDepartments ? '加载中...' : '请选择所属部门'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">不选择</SelectItem>
                        {departments.map(department => (
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
                        {statusOptions.map(option => (
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

        {/* 分类自定义属性 */}
        {categoryAttributes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                分类属性
                {loadingCategoryDetails && <span className="text-muted-foreground ml-2 text-sm">加载中...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {categoryAttributes.map(attribute => renderCustomAttributeField(attribute))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 采购信息 */}
        <Card>
          <CardHeader>
            <CardTitle>采购信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 采购日期 */}
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>采购日期</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            {field.value ? field.value.toLocaleDateString() : '请选择采购日期'}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          captionLayout="dropdown"
                          onSelect={date => {
                            field.onChange(date);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="资产图片预览" className="h-48 w-48 rounded-lg border object-cover" />
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
              <div
                className="border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">点击上传资产图片</p>
                  <p className="text-muted-foreground text-xs">支持 JPG、PNG 格式，大小不超过 5MB</p>
                </div>
              </div>
            )}
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
            {uploadingImage && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                上传中...
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        {!hideButtons && (
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading || assetNoValid === false}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEdit ? '更新中...' : '创建中...'}
                </>
              ) : isEdit ? (
                '更新资产'
              ) : (
                '创建资产'
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
