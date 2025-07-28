'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { AttributeField, CategoryTreeNode, SaveCategoryAttributes, updateCategory } from '@/lib/api/categories';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CategoryAttributesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryTreeNode | null;
  onSuccess: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'select', label: '选择' },
  { value: 'boolean', label: '布尔值' },
] as const;

type FieldType = typeof FIELD_TYPES[number]['value'];

export function CategoryAttributesDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryAttributesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<AttributeField[]>([]);

  useEffect(() => {
    if (open && category) {
      // 加载现有属性
      if (category.attributes && category.attributes.fields) {
        const existingFields = category.attributes.fields.map((field: AttributeField, index: number) => ({
          id: field.id || `field_${index}`,
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options || [],
          default_value: field.default_value,
        }));
        setFields(existingFields);
      } else {
        setFields([]);
      }
    }
  }, [open, category]);

  const addField = () => {
    const newField: AttributeField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<AttributeField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(fields.find(f => f.id === fieldId)?.options || []), '']
    });
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field && field.options) {
      const newOptions = [...field.options];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field && field.options) {
      const newOptions = field.options.filter((_, index) => index !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  const handleSave = async () => {
    if (!category) return;

    // 验证字段
    for (const field of fields) {
      if (!field.name.trim()) {
        toast.error('请填写所有字段的名称');
        return;
      }
      if (!field.label.trim()) {
        toast.error('请填写所有字段的标签');
        return;
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        toast.error('选择类型字段必须设置选项');
        return;
      }
    }

    try {
      setLoading(true);

      const attributes: SaveCategoryAttributes = {
        fields: fields.map(field => ({
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.type === 'select' ? field.options?.filter(opt => opt.trim()) : undefined,
          default_value: field.default_value,
        }))
      };

      await updateCategory(category.id, { attributes });
      toast.success('属性模板保存成功');
      onSuccess();
    } catch (error: unknown) {
      console.error('Failed to save attributes:', error);
      const message = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || '保存失败'
        : '保存失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>配置分类属性 - {category.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              为此分类定义自定义属性字段，这些字段将在创建该分类资产时显示。
            </p>
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加字段
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无自定义字段</p>
              <p className="text-sm">点击&quot;添加字段&quot;开始配置</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">字段 {index + 1}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>字段名称 *</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          placeholder="字段名称（如：warranty_years）"
                          className="font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>显示标签 *</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="显示标签（如：保修年限）"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>字段类型</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: FieldType) => updateField(field.id, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>是否必填</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {field.required ? '必填' : '可选'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>选项设置</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(field.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            添加选项
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                placeholder={`选项 ${optionIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(field.id, optionIndex)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}