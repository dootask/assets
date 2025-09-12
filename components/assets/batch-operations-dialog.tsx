'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showError, showOperationResult } from '@/lib/notifications';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

import { batchDeleteAssets, batchUpdateAssets } from '@/lib/api/assets';
import { getDepartments } from '@/lib/api/departments';
import type {
    AssetResponse,
    AssetStatus,
    BatchDeleteAssetsResponse,
    BatchUpdateAssetsData,
    BatchUpdateAssetsResponse,
    Department,
} from '@/lib/types';

interface BatchOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: AssetResponse[];
  onSuccess: () => void;
}

type OperationType = 'update' | 'delete';

const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: 'available', label: '可用' },
  { value: 'borrowed', label: '借用中' },
  { value: 'maintenance', label: '维护中' },
  { value: 'scrapped', label: '已报废' },
];

export function BatchOperationsDialog({ open, onOpenChange, selectedAssets, onSuccess }: BatchOperationsDialogProps) {
  const [operationType, setOperationType] = useState<OperationType>('update');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // 批量更新表单数据
  const [updateData, setUpdateData] = useState<BatchUpdateAssetsData>({});

  // 操作结果
  const [operationResult, setOperationResult] = useState<{
    type: 'update' | 'delete';
    success: boolean;
    data: BatchUpdateAssetsResponse | BatchDeleteAssetsResponse | null;
  } | null>(null);

  // 加载部门列表
  const loadDepartments = async () => {
    if (departments.length > 0) return;

    try {
      setDepartmentsLoading(true);
      const response = await getDepartments({
        page: 1,
        page_size: 1000,
      });
      setDepartments(response.data.data);
    } catch (error) {
      console.error('加载部门列表失败:', error);
      showError('加载部门列表失败', '请稍后重试');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // 处理批量更新
  const handleBatchUpdate = async () => {
    if (Object.keys(updateData).length === 0) {
      showError('请至少选择一个要更新的字段', '批量更新需要指定要修改的字段');
      return;
    }

    try {
      setLoading(true);
      const response = await batchUpdateAssets({
        asset_ids: selectedAssets.map(asset => asset.id),
        updates: updateData,
      });

      setOperationResult({
        type: 'update',
        success: response.data.failed_count === 0,
        data: response.data,
      });

      showOperationResult(
        '批量更新',
        response.data.failed_count === 0,
        response.data.success_count,
        response.data.failed_count,
        response.data.errors
      );

      if (response.data.failed_count === 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('批量更新失败:', error);
      showError('批量更新失败', '请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    try {
      setLoading(true);
      const response = await batchDeleteAssets({
        asset_ids: selectedAssets.map(asset => asset.id),
      });

      setOperationResult({
        type: 'delete',
        success: response.data.failed_count === 0,
        data: response.data,
      });

      showOperationResult(
        '批量删除',
        response.data.failed_count === 0,
        response.data.success_count,
        response.data.failed_count,
        response.data.errors
      );

      if (response.data.failed_count === 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      showError('批量删除失败', '请检查资产是否正在使用中或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置状态
  const handleClose = () => {
    setOperationType('update');
    setUpdateData({});
    setOperationResult(null);
    onOpenChange(false);
  };

  // 如果有操作结果，显示结果页面
  if (operationResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {operationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              {operationResult.type === 'update' ? '批量更新结果' : '批量删除结果'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{operationResult.data?.success_count || 0}</div>
                <div className="text-sm text-green-600">成功</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{operationResult.data?.failed_count || 0}</div>
                <div className="text-sm text-red-600">失败</div>
              </div>
            </div>

            {operationResult.data?.errors && operationResult.data.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-medium text-red-600">
                  <XCircle className="h-4 w-4" />
                  错误详情
                </h4>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {operationResult.data.errors.map((error, index) => (
                    <div key={index} className="rounded border-l-2 border-red-200 bg-red-50 p-2 text-sm">
                      <span className="font-medium">资产ID {error.asset_id}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>批量操作</DialogTitle>
          <DialogDescription>已选择 {selectedAssets.length} 个资产进行批量操作</DialogDescription>
        </DialogHeader>

        <Tabs value={operationType} onValueChange={value => setOperationType(value as OperationType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="update">批量更新</TabsTrigger>
            <TabsTrigger value="delete">批量删除</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4">
            <div className="text-muted-foreground text-sm">选择要更新的字段，未选择的字段将保持不变</div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={updateData.status || 'no-update'}
                  onValueChange={value =>
                    setUpdateData(prev => ({
                      ...prev,
                      status: value && value !== 'no-update' ? (value as AssetStatus) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-update">不更新</SelectItem>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>部门</Label>
                <Select
                  value={updateData.department_id?.toString() || 'no-update'}
                  onValueChange={value =>
                    setUpdateData(prev => ({
                      ...prev,
                      department_id:
                        value && value !== 'no-update' && value !== 'loading' ? parseInt(value) : undefined,
                    }))
                  }
                  onOpenChange={open => {
                    if (open) loadDepartments();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-update">不更新</SelectItem>
                    {departmentsLoading ? (
                      <SelectItem value="loading" disabled>
                        加载中...
                      </SelectItem>
                    ) : (
                      departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>位置</Label>
                <Input
                  placeholder="输入位置"
                  value={updateData.location || ''}
                  onChange={e =>
                    setUpdateData(prev => ({
                      ...prev,
                      location: e.target.value || undefined,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>责任人</Label>
                <Input
                  placeholder="输入责任人"
                  value={updateData.responsible_person || ''}
                  onChange={e =>
                    setUpdateData(prev => ({
                      ...prev,
                      responsible_person: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-800">危险操作</h4>
                  <p className="mt-1 text-sm text-red-700">
                    此操作将永久删除选中的 {selectedAssets.length} 个资产，且无法撤销。
                    请确认这些资产没有未归还的借用记录。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">将要删除的资产：</h4>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {selectedAssets.map(asset => (
                  <div key={asset.id} className="rounded bg-gray-50 p-2 text-sm">
                    {asset.asset_no} - {asset.name}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          {operationType === 'update' ? (
            <Button onClick={handleBatchUpdate} disabled={loading}>
              {loading ? '更新中...' : '批量更新'}
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleBatchDelete} disabled={loading}>
              {loading ? '删除中...' : '批量删除'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
