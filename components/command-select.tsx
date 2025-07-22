'use client';

import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface CommandSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CommandSelectProps {
  options: CommandSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: 'sm' | 'default';
  disabled?: boolean;
}

export function CommandSelect({
  options,
  value,
  onValueChange,
  placeholder = '请选择...',
  searchPlaceholder = '搜索选项...',
  emptyMessage = '没有找到相关选项',
  className,
  triggerClassName,
  contentClassName,
  size = 'default',
  disabled = false,
}: CommandSelectProps) {
  const [open, setOpen] = React.useState(false);

  // 确保value始终是string类型，避免undefined导致的controlled/uncontrolled警告
  const safeValue = value ?? '';
  const selectedOption = options.find(option => option.value === safeValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size={size}
          disabled={disabled}
          className={cn('justify-between', !selectedOption && 'text-muted-foreground', triggerClassName, className)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0', contentClassName)} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.value, option.label, option.description ?? '']}
                  onSelect={currentValue => {
                    onValueChange?.(currentValue === safeValue ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium">{option.label}</p>
                    {option.description && <p className="text-muted-foreground text-xs">{option.description}</p>}
                  </div>
                  {selectedOption?.value === option.value && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
