'use client';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { getDepartments } from '@/lib/api/departments';
import type { DepartmentResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DepartmentSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DepartmentSelector({
  value,
  onValueChange,
  placeholder = '选择部门',
  disabled = false,
  className,
}: DepartmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载部门列表
  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await getDepartments({
        page: 1,
        page_size: 100, // 获取所有部门
        sorts: [{ key: 'name', desc: false }],
      });
      
      if (response.code === 'SUCCESS') {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('加载部门列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const selectedDepartment = departments.find(dept => dept.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
          disabled={disabled}
        >
          {selectedDepartment ? selectedDepartment.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="搜索部门..." />
          <CommandEmpty>
            {loading ? '加载中...' : '未找到部门'}
          </CommandEmpty>
          <CommandGroup>
            {/* 清空选择选项 */}
            <CommandItem
              value=""
              onSelect={() => {
                onValueChange(undefined);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  !value ? 'opacity-100' : 'opacity-0'
                )}
              />
              不选择部门
            </CommandItem>
            
            {departments.map((department) => (
              <CommandItem
                key={department.id}
                value={`${department.name}-${department.code}`}
                onSelect={() => {
                  onValueChange(department.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === department.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col">
                  <span>{department.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {department.code} • {department.asset_count} 个资产
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}