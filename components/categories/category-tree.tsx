'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryTreeNode } from '@/lib/api/categories';
import { ChevronDown, ChevronRight, Edit, Folder, FolderOpen, Plus, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  selectedId?: number;
  onSelect: (category: CategoryTreeNode) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
  onCreateSub: (category: CategoryTreeNode) => void;
  onConfigureAttributes: (category: CategoryTreeNode) => void;
}

interface CategoryNodeProps {
  category: CategoryTreeNode;
  level: number;
  selectedId?: number;
  onSelect: (category: CategoryTreeNode) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
  onCreateSub: (category: CategoryTreeNode) => void;
  onConfigureAttributes: (category: CategoryTreeNode) => void;
}

function CategoryNode({
  category,
  level,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onCreateSub,
  onConfigureAttributes,
}: CategoryNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleSelect = () => {
    onSelect(category);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(category);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(category);
  };

  const handleCreateSub = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateSub(category);
  };

  const handleConfigureAttributes = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfigureAttributes(category);
  };

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center rounded-lg border border-transparent p-2 pr-4 hover:bg-gray-50 ${
          isSelected ? 'border-blue-200 bg-blue-50' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={handleSelect}
      >
        {/* 展开/收起按钮 */}
        <div className="mr-2 flex h-4 w-4 items-center justify-center">
          {hasChildren ? (
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={handleToggle}>
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          ) : null}
        </div>

        {/* 文件夹图标 */}
        <div className="mr-2">
          {hasChildren && expanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* 分类信息 */}
        <div className="flex min-w-0 flex-1 items-center justify-between">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="text-sm font-medium truncate">{category.name}</span>
            <span className="font-mono text-xs text-gray-500">({category.code})</span>
            {(category.asset_count ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.asset_count}
              </Badge>
            )}
          </div>

          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleEdit} title="编辑分类">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCreateSub} title="创建子分类">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleConfigureAttributes} title="配置属性">
              <Settings className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} title="删除分类">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* 子分类 */}
      {hasChildren && expanded && (
        <div>
          {category.children?.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSub={onCreateSub}
              onConfigureAttributes={onConfigureAttributes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onCreateSub,
  onConfigureAttributes,
}: CategoryTreeProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-8">
        <p>暂无分类数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateSub={onCreateSub}
          onConfigureAttributes={onConfigureAttributes}
        />
      ))}
    </div>
  );
}
