'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getCategories } from '@/lib/api/categories';
import { getDepartments } from '@/lib/api/departments';
import type { CreateInventoryTaskRequest, InventoryScopeFilter } from '@/lib/api/inventory';
import { createInventoryTask } from '@/lib/api/inventory';
import type { Category } from '@/lib/types';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Department {
    id: number;
    name: string;
    code: string;
}

const assetStatuses = [
    { value: 'available', label: '可用' },
    { value: 'borrowed', label: '借用中' },
    { value: 'maintenance', label: '维修中' },
    { value: 'scrapped', label: '已报废' }
];

export default function NewInventoryTaskPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    // 表单数据
    const [formData, setFormData] = useState<CreateInventoryTaskRequest>({
        task_name: '',
        task_type: 'full',
        scope_filter: {},
        created_by: '',
        notes: ''
    });

    // 范围筛选条件
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [locationFilter, setLocationFilter] = useState('');

    useEffect(() => {
        loadCategories();
        loadDepartments();
    }, []);

    const loadCategories = async () => {
        try {
                    const response = await getCategories();
        if (Array.isArray(response)) {
            setCategories(response);
            }
        } catch (error) {
            console.error('获取分类失败:', error);
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await getDepartments({ page: 1, page_size: 100 });
            if (response.code === 'SUCCESS') {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error('获取部门失败:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.task_name.trim()) {
            toast.error('请输入任务名称');
            return;
        }
        
        if (!formData.created_by.trim()) {
            toast.error('请输入创建人');
            return;
        }

        try {
            setLoading(true);
            
            // 构建范围过滤条件
            const scopeFilter: InventoryScopeFilter = {};
            
            if (formData.task_type === 'category' && selectedCategories.length > 0) {
                scopeFilter.category_ids = selectedCategories;
            }
            
            if (formData.task_type === 'department' && selectedDepartments.length > 0) {
                scopeFilter.department_ids = selectedDepartments;
            }
            
            if (selectedStatuses.length > 0) {
                scopeFilter.asset_statuses = selectedStatuses;
            }
            
            if (locationFilter.trim()) {
                scopeFilter.location_filter = locationFilter.trim();
            }

            const requestData: CreateInventoryTaskRequest = {
                ...formData,
                scope_filter: scopeFilter
            };

            const response = await createInventoryTask(requestData);
            if (response.code === 'SUCCESS') {
                toast.success('盘点任务创建成功');
                router.push('/inventory');
            } else {
                toast.error(response.message || '创建盘点任务失败');
            }
        } catch (error) {
            console.error('创建盘点任务失败:', error);
            toast.error('创建盘点任务失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (categoryId: number, checked: boolean) => {
        if (checked) {
            setSelectedCategories([...selectedCategories, categoryId]);
        } else {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        }
    };

    const handleDepartmentChange = (departmentId: number, checked: boolean) => {
        if (checked) {
            setSelectedDepartments([...selectedDepartments, departmentId]);
        } else {
            setSelectedDepartments(selectedDepartments.filter(id => id !== departmentId));
        }
    };

    const handleStatusChange = (status: string, checked: boolean) => {
        if (checked) {
            setSelectedStatuses([...selectedStatuses, status]);
        } else {
            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">创建盘点任务</h1>
                    <p className="text-gray-600 mt-1">创建新的资产盘点任务</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {/* 基本信息 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>基本信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="task_name">任务名称 *</Label>
                                    <Input
                                        id="task_name"
                                        value={formData.task_name}
                                        onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                                        placeholder="请输入任务名称"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="created_by">创建人 *</Label>
                                    <Input
                                        id="created_by"
                                        value={formData.created_by}
                                        onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                                        placeholder="请输入创建人姓名"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="task_type">盘点类型</Label>
                                <Select
                                    value={formData.task_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, task_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full">全盘</SelectItem>
                                        <SelectItem value="category">按分类盘点</SelectItem>
                                        <SelectItem value="department">按部门盘点</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="notes">备注</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="请输入备注信息"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 盘点范围 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>盘点范围</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* 分类筛选 */}
                            {formData.task_type === 'category' && (
                                <div>
                                    <Label className="text-base font-medium">选择分类</Label>
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {categories.map((category) => (
                                            <div key={category.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`category-${category.id}`}
                                                    checked={selectedCategories.includes(category.id)}
                                                    onCheckedChange={(checked) => 
                                                        handleCategoryChange(category.id, checked as boolean)
                                                    }
                                                />
                                                <Label 
                                                    htmlFor={`category-${category.id}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {category.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 部门筛选 */}
                            {formData.task_type === 'department' && (
                                <div>
                                    <Label className="text-base font-medium">选择部门</Label>
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {departments.map((department) => (
                                            <div key={department.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`department-${department.id}`}
                                                    checked={selectedDepartments.includes(department.id)}
                                                    onCheckedChange={(checked) => 
                                                        handleDepartmentChange(department.id, checked as boolean)
                                                    }
                                                />
                                                <Label 
                                                    htmlFor={`department-${department.id}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {department.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 资产状态筛选 */}
                            <div>
                                <Label className="text-base font-medium">资产状态筛选（可选）</Label>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {assetStatuses.map((status) => (
                                        <div key={status.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`status-${status.value}`}
                                                checked={selectedStatuses.includes(status.value)}
                                                onCheckedChange={(checked) => 
                                                    handleStatusChange(status.value, checked as boolean)
                                                }
                                            />
                                            <Label 
                                                htmlFor={`status-${status.value}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {status.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 位置筛选 */}
                            <div>
                                <Label htmlFor="location_filter">位置筛选（可选）</Label>
                                <Input
                                    id="location_filter"
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    placeholder="输入位置关键词，如：办公室、仓库等"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    将筛选包含此关键词的资产位置
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 操作按钮 */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? '创建中...' : '创建任务'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}