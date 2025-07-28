'use client';

import { CategoryAttributesDialog } from '@/components/categories/category-attributes-dialog';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { CategoryTree } from '@/components/categories/category-tree';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { CategoryTreeNode, deleteCategory, getCategories } from '@/lib/api/categories';
import { Folder, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attributesDialogOpen, setAttributesDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null);

  const { Confirm } = useAppContext();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories({ name: searchTerm || undefined });
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryTreeNode) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDeleteCategory = async (category: CategoryTreeNode) => {
    const confirmed = await Confirm({
      title: '确认删除',
      message: `确定要删除分类"${category.name}"吗？此操作不可撤销。`,
      variant: 'destructive',
    });
    if (!confirmed) {
      return;
    }

    try {
      await deleteCategory(category.id);
      toast.success('分类删除成功');
      loadCategories();
    } catch (error: unknown) {
      console.error('Failed to delete category:', error);
      const message =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || '删除分类失败'
          : '删除分类失败';
      toast.error(message);
    }
  };

  const handleCategorySelect = (category: CategoryTreeNode) => {
    setSelectedCategory(category);
  };

  const handleCreateSubCategory = (parentCategory: CategoryTreeNode) => {
    setEditingCategory({ ...parentCategory, id: 0 } as CategoryTreeNode);
    setDialogOpen(true);
  };

  const handleConfigureAttributes = (category: CategoryTreeNode) => {
    setSelectedCategory(category);
    setAttributesDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    loadCategories();
  };

  const handleAttributesDialogSuccess = () => {
    setAttributesDialogOpen(false);

    // 重新加载分类列表
    loadCategories();

    // 如果有选中的分类，重新获取最新的分类信息来更新详情
    if (selectedCategory) {
      // 等待列表加载完成后更新选中分类
      setTimeout(async () => {
        try {
          const updatedCategories = await getCategories();
          const updatedCategory = findCategoryById(updatedCategories, selectedCategory.id);
          if (updatedCategory) {
            setSelectedCategory(updatedCategory);
          }
        } catch (error) {
          console.error('Failed to update selected category:', error);
        }
      }, 100);
    }
  };

  // 辅助函数：在分类树中查找指定ID的分类
  const findCategoryById = (categories: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">分类管理</h1>
          <p className="text-muted-foreground">管理资产分类和属性模板</p>
        </div>
        <Button onClick={handleCreateCategory}>
          <Plus className="mr-2 h-4 w-4" />
          新增分类
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 分类树 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>分类结构</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      placeholder="搜索分类..."
                      value={searchTerm}
                      onChange={e => handleSearch(e.target.value)}
                      className="w-64 pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                </div>
              ) : (
                <CategoryTree
                  categories={categories}
                  selectedId={selectedCategory?.id}
                  onSelect={handleCategorySelect}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onCreateSub={handleCreateSubCategory}
                  onConfigureAttributes={handleConfigureAttributes}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 分类详情 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>分类详情</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCategory ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">分类名称</label>
                    <p className="mt-1 text-sm">{selectedCategory.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">分类编码</label>
                    <p className="mt-1 font-mono text-sm">{selectedCategory.code}</p>
                  </div>
                  {selectedCategory.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">描述</label>
                      <p className="mt-1 text-sm">{selectedCategory.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">资产数量</label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedCategory.asset_count} 个资产</Badge>
                    </div>
                  </div>
                  {selectedCategory.attributes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">属性模板</label>
                      <div className="mt-1 rounded bg-gray-50 p-2 text-xs">
                        <pre>{JSON.stringify(selectedCategory.attributes, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Folder className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>选择一个分类查看详情</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 分类编辑对话框 */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        parentCategory={editingCategory?.id === 0 ? selectedCategory : undefined}
        onSuccess={handleDialogSuccess}
      />

      {/* 属性配置对话框 */}
      <CategoryAttributesDialog
        open={attributesDialogOpen}
        onOpenChange={setAttributesDialogOpen}
        category={selectedCategory}
        onSuccess={handleAttributesDialogSuccess}
      />
    </div>
  );
}
