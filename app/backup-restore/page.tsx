'use client';

import { BackupDialog } from '@/components/backup/backup-dialog';
import { DeleteConfirmationDialog } from '@/components/backup/delete-confirmation-dialog';
import { RestoreDialog } from '@/components/backup/restore-dialog';
import { Loading } from '@/components/loading';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createBackup,
  deleteBackup,
  formatFileSize,
  getBackups,
  restoreBackup,
  type BackupFile,
  type BackupFilters
} from '@/lib/api/backup';
import { downloadFileFromUrl } from '@/lib/api/reports';
import { AlertCircle, Database, Download, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BackupRestorePage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 对话框状态
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<BackupFile | null>(null);

  // 操作状态
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 加载备份列表
  const loadBackups = useCallback(async (customFilters?: { keyword?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: BackupFilters = {};
      const currentKeyword = customFilters?.keyword !== undefined ? customFilters.keyword : searchKeyword;

      if (currentKeyword) {
        filters.keyword = currentKeyword;
      }

      const response = await getBackups({
        page,
        page_size: pageSize,
        filters: filters as Record<string, unknown> & BackupFilters,
      });

      if (response.code === 'SUCCESS' && response.data) {
        setBackups(response.data.data || []);
        setTotal(response.data.total_items || 0);
      } else {
        setError('加载备份列表失败');
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
      setError('加载备份列表失败，请检查后端服务是否正常运行');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchKeyword]);

  // 创建备份
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await createBackup({});
      if (response.code === 'SUCCESS') {
        toast.success('备份创建成功');
        setShowBackupDialog(false);
        loadBackups(); // 重新加载列表
      } else {
        toast.error(response.message || '备份创建失败');
      }
    } catch (error) {
      console.error('创建备份失败:', error);
      toast.error('创建备份失败');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // 恢复备份
  const handleRestoreBackup = async (filename: string) => {
    setIsRestoring(true);
    try {
      const response = await restoreBackup({ filename });
      if (response.code === 'SUCCESS') {
        toast.success('备份恢复成功');
        setShowRestoreDialog(false);
        // 恢复成功后，建议用户刷新页面以确保数据一致性
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(response.message || '备份恢复失败');
      }
    } catch (error) {
      console.error('恢复备份失败:', error);
      toast.error('恢复备份失败');
    } finally {
      setIsRestoring(false);
    }
  };

  // 下载备份
  const handleDownloadBackup = async (backup: BackupFile) => {
    try {
      await downloadFileFromUrl(backup.download_url, backup.filename);
      toast.success('备份文件下载成功');
    } catch (error) {
      console.error('下载备份失败:', error);
      toast.error('下载备份失败');
    }
  };


  // 打开删除确认对话框
  const handleOpenDeleteDialog = (backup: BackupFile) => {
    setBackupToDelete(backup);
    setShowDeleteDialog(true);
  };

  // 关闭删除确认对话框
  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setBackupToDelete(null);
  };

  // 执行删除备份
  const handleConfirmDeleteBackup = async () => {
    if (!backupToDelete) return;

    setIsDeleting(backupToDelete.filename);
    try {
      const response = await deleteBackup(backupToDelete.filename);
      if (response.code === 'SUCCESS') {
        toast.success('备份文件删除成功');
        loadBackups(); // 重新加载列表
        handleCloseDeleteDialog();
      } else {
        toast.error(response.message || '删除备份失败');
      }
    } catch (error) {
      console.error('删除备份失败:', error);
      toast.error('删除备份失败');
    } finally {
      setIsDeleting(null);
    }
  };


  // 搜索处理
  const handleSearch = useCallback(() => {
    setPage(1);
    loadBackups();
  }, [loadBackups]);

  // 重置搜索
  const handleResetSearch = useCallback(() => {
    setSearchKeyword('');
    setPage(1);
    // 使用自定义过滤器确保使用重置后的值
    loadBackups({ keyword: '' });
  }, [loadBackups]);

  // 初始加载
  useEffect(() => {
    loadBackups();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading && backups.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">备份恢复</h1>
          <p className="text-gray-600">管理系统数据备份和恢复功能</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRestoreDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            恢复备份
          </Button>
          <Button onClick={() => setShowBackupDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            创建备份
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索和筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索备份文件名..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              搜索
            </Button>
            <Button onClick={handleResetSearch} variant="outline">
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 备份列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            备份文件列表
          </CardTitle>
          <CardDescription>
            共 {total} 个备份文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无备份文件
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.filename}>
                      <TableCell className="font-medium">{backup.filename}</TableCell>
                      <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                      <TableCell>
                        {new Date(backup.created_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeleteDialog(backup)}
                            disabled={isDeleting === backup.filename}
                          >
                            {isDeleting === backup.filename ? (
                              <Loading />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分页 */}
              {total > pageSize && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(total / pageSize)}
                    pageSize={pageSize}
                    totalItems={total}
                    onPageChange={setPage}
                    onPageSizeChange={() => {}} // 备份页面不需要改变页面大小
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 备份对话框 */}
      <BackupDialog
        open={showBackupDialog}
        onOpenChange={setShowBackupDialog}
        onConfirm={handleCreateBackup}
        isLoading={isCreatingBackup}
      />

      {/* 恢复对话框 */}
      <RestoreDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={handleRestoreBackup}
        isLoading={isRestoring}
        backups={backups}
      />

      {/* 删除确认对话框 */}
      {backupToDelete && (
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open);
            if (!open) {
              handleCloseDeleteDialog();
            }
          }}
          filename={backupToDelete.filename}
          onConfirm={handleConfirmDeleteBackup}
          isLoading={isDeleting === backupToDelete.filename}
        />
      )}

    </div>
  );
}
