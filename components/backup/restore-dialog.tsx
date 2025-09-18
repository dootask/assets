'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BackupFile } from '@/lib/api/backup';
import { AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (filename: string) => Promise<void>;
  isLoading: boolean;
  backups: BackupFile[];
}

export function RestoreDialog({ open, onOpenChange, onConfirm, isLoading, backups }: RestoreDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string>('');

  // 重置状态
  useEffect(() => {
    if (open) {
      setError(null);
      setSelectedFilename('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedFilename) {
      setError('请选择要恢复的备份文件');
      return;
    }

    setError(null);
    try {
      await onConfirm(selectedFilename);
    } catch {
      setError('恢复备份失败');
    }
  };

  const handleCancel = () => {
    setError(null);
    setSelectedFilename('');
    onOpenChange(false);
  };

  const selectedBackup = backups.find(backup => backup.filename === selectedFilename);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            恢复备份
          </DialogTitle>
          <DialogDescription>
            从备份文件中恢复系统数据，此操作将覆盖当前的所有数据。
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

          {/* 备份文件选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择备份文件</label>
            <Select value={selectedFilename} onValueChange={setSelectedFilename} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="请选择要恢复的备份文件" />
              </SelectTrigger>
              <SelectContent>
                {backups.map((backup) => (
                  <SelectItem key={backup.filename} value={backup.filename}>
                    <div className="flex flex-col">
                      <span className="font-medium">{backup.filename}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(backup.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 进度显示 */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4" />
                正在恢复备份...
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* 恢复说明 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p>• 恢复操作将覆盖当前所有数据</p>
                <p>• 建议在恢复前创建当前数据的备份</p>
                <p>• 恢复过程可能需要几分钟时间</p>
                {selectedBackup && (
                  <p>• 恢复到: {new Date(selectedBackup.created_at).toLocaleString('zh-CN')}</p>
                )}
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
            disabled={isLoading || !selectedFilename}
            className="flex items-center gap-2"
            variant="destructive"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                恢复中...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                恢复备份
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
