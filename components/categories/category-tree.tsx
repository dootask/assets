'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryTreeNode } from '@/lib/api/categories';
import { ChevronDown, ChevronRight, Edit, Folder, FolderOpen, MoreHorizontal, Plus, Settings, Trash2 } from 'lucide-react';
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
        className={`flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={handleSelect}
      >
        {/* 展开/收起按钮 */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0"
              onClick={handleToggle}
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
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
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{category.name}</span>
            <span className="text-xs text-gray-500 font-mono">({category.code})</span>
            {category.asset_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {category.asset_count}
              </Badge>
            )}
          </div>

          {/* 操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateSub}>
                <Plus className="h-4 w-4 mr-2" />
                添加子分类
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleConfigureAttributes}>
                <Settings className="h-4 w-4 mr-2" />
                配置属性
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 子分类 */}
      {hasChildren && expanded && (
        <div>
          {category.children.map((child) => (
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
      <div className="text-center py-8 text-gray-500">
        <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无分类数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <div key={category.id} className="group">
          <CategoryNode
            category={category}
            level={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateSub={onCreateSub}
            onConfigureAttributes={onConfigureAttributes}
          />
        </div>
      ))}
    </div>
  );
}