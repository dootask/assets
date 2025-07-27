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
import { getAvailableAssets } from '@/lib/api/borrow';
import type { AvailableAssetResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AssetSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AssetSelector({
  value,
  onValueChange,
  placeholder = '选择可借用资产',
  disabled = false,
  className,
}: AssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<AvailableAssetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // 加载可借用资产列表
  const loadAssets = async (searchTerm = '') => {
    try {
      setLoading(true);
      const response = await getAvailableAssets({
        page: 1,
        page_size: 50, // 获取前50个可借用资产
        search: searchTerm,
      });
      
      if (response.code === 'SUCCESS') {
        setAssets(response.data.data);
      }
    } catch (error) {
      console.error('加载可借用资产失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAssets();
    }
  }, [open]);

  // 搜索处理
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    if (searchTerm.length > 0) {
      loadAssets(searchTerm);
    } else {
      loadAssets();
    }
  };

  const selectedAsset = assets.find(asset => asset.id === value);

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
          {selectedAsset ? (
            <div className="flex flex-col items-start">
              <span>{selectedAsset.name}</span>
              <span className="text-xs text-muted-foreground">
                {selectedAsset.asset_no} • {selectedAsset.category?.name}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="搜索资产..." 
            value={search}
            onValueChange={handleSearch}
          />
          <CommandEmpty>
            {loading ? '加载中...' : '未找到可借用资产'}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {assets.map((asset) => (
              <CommandItem
                key={asset.id}
                value={`${asset.name}-${asset.asset_no}`}
                onSelect={() => {
                  onValueChange(asset.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === asset.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{asset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      借用 {asset.borrow_count} 次
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{asset.asset_no} • {asset.category?.name}</span>
                    {asset.last_borrow_date && (
                      <span>
                        上次借用: {new Date(asset.last_borrow_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {asset.location && (
                    <span className="text-xs text-muted-foreground">
                      位置: {asset.location}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}