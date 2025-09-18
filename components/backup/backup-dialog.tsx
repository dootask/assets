'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Database } from 'lucide-react';
import { useState } from 'react';

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function BackupDialog({ open, onOpenChange, onConfirm, isLoading }: BackupDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError('创建备份失败');
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            创建备份
          </DialogTitle>
          <DialogDescription>
            创建系统数据的完整备份，包含所有资产、分类、部门等信息。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 进度显示 */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4" />
                正在创建备份...
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* 备份说明 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p>• 备份将包含所有系统数据</p>
                <p>• 备份过程可能需要几分钟时间</p>
                <p>• 系统会自动保留最新的10个备份文件</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                创建中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                创建备份
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
