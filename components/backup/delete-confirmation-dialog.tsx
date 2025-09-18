'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  filename,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            确认删除备份文件
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            您确定要删除备份文件 <strong>&ldquo;{filename}&rdquo;</strong> 吗？
            <br />
            <span className="text-red-600 font-medium">
              此操作不可撤销，删除的文件将无法恢复。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
