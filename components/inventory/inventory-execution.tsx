'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { getAssets } from '@/lib/api/assets';
import type { CreateInventoryRecordRequest, InventoryRecord, InventoryTask } from '@/lib/api/inventory';
import { batchCreateInventoryRecords, createInventoryRecord, getInventoryRecords } from '@/lib/api/inventory';
import type { AssetResponse, AssetStatus } from '@/lib/types';
import { CheckCircle, Eye, Plus, Scan, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface InventoryExecutionProps {
  task: InventoryTask;
  onRecordCreated: () => void;
}

// 定义CreateInventoryRecordRequest字段值的类型
type InventoryRecordFieldValue = string | number | 'normal' | 'surplus' | 'deficit' | 'damaged';

// 资产状态中文映射
const getAssetStatusLabel = (status: AssetStatus): string => {
  const statusMap: Record<AssetStatus, string> = {
    available: '可用',
    borrowed: '借用中',
    maintenance: '维护中',
    scrapped: '已报废',
  };
  return statusMap[status] || status;
};

export function InventoryExecution({ task, onRecordCreated }: InventoryExecutionProps) {
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [keyword, setKeyword] = useState('');
  const [batchRecords, setBatchRecords] = useState<CreateInventoryRecordRequest[]>([]);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isBatchListDialogOpen, setIsBatchListDialogOpen] = useState(false);
  const [isSingleDialogOpen, setIsSingleDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetResponse | null>(null);
  const [checkedAssets, setCheckedAssets] = useState<Set<number>>(new Set());

  // 单个盘点记录状态
  const [singleRecord, setSingleRecord] = useState<CreateInventoryRecordRequest>({
    task_id: task.id,
    asset_id: 0,
    actual_status: 'available',
    result: 'normal',
    notes: '',
    checked_by: '',
  });

  useEffect(() => {
    if (isSingleDialogOpen || isBatchDialogOpen) {
      loadAssets();
      loadCheckedAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSingleDialogOpen, isBatchDialogOpen, keyword]);

  const loadAssets = async () => {
    try {
      const response = await getAssets({
        page: 1,
        page_size: 50,
        sorts: [{ key: 'asset_no', desc: false }],
        filters: keyword ? { keyword: keyword } : undefined,
      });

      if (response.code === 'SUCCESS') {
        setAssets(response.data.data);
      }
    } catch (error) {
      console.error('获取资产列表失败:', error);
      toast.error('获取资产列表失败');
    }
  };

  const loadCheckedAssets = async () => {
    try {
      const response = await getInventoryRecords({
        page: 1,
        page_size: 1000, // 获取所有已盘点的记录
        task_id: task.id,
      });

      if (response.code === 'SUCCESS') {
        const checkedIds = new Set(response.data.data.map((record: InventoryRecord) => record.asset_id));
        setCheckedAssets(checkedIds);
      }
    } catch (error) {
      console.error('获取已盘点资产失败:', error);
    }
  };

  const handleAssetScan = async (assetNo: string) => {
    if (!assetNo.trim()) {
      toast.error('请输入资产编号');
      return;
    }

    try {
      // 通过API搜索资产
      const response = await getAssets({
        page: 1,
        page_size: 1,
        filters: { asset_no: assetNo.trim() }
      });

      if (response.code === 'SUCCESS' && response.data.data.length > 0) {
        const asset = response.data.data[0];
        setSingleRecord({
          ...singleRecord,
          asset_id: asset.id,
        });
        setSelectedAsset(asset);
        toast.success(`找到资产: ${asset.name}`);
      } else {
        toast.error('未找到对应资产');
        setSelectedAsset(null);
      }
    } catch (error) {
      console.error('搜索资产失败:', error);
      toast.error('搜索资产失败');
    }
  };

  const handleSingleSubmit = async () => {
    if (!singleRecord.asset_id) {
      toast.error('请选择资产');
      return;
    }

    if (!singleRecord.checked_by.trim()) {
      toast.error('请输入盘点人');
      return;
    }

    try {
      const response = await createInventoryRecord(singleRecord);
      if (response.code === 'SUCCESS') {
        toast.success('盘点记录创建成功');
        setSingleRecord({
          task_id: task.id,
          asset_id: 0,
          actual_status: 'available',
          result: 'normal',
          notes: '',
          checked_by: singleRecord.checked_by, // 保留盘点人信息
        });
        setSelectedAsset(null); // 清空选中的资产
        loadCheckedAssets(); // 更新已盘点资产列表
        onRecordCreated();
      } else {
        toast.error(response.message || '创建盘点记录失败');
      }
    } catch (error) {
      console.error('创建盘点记录失败:', error);
      toast.error('创建盘点记录失败');
    }
  };

  const handleBatchSubmit = async () => {
    if (batchRecords.length === 0) {
      toast.error('请添加盘点记录');
      return;
    }

    try {
      const response = await batchCreateInventoryRecords({ records: batchRecords });
      if (response.code === 'SUCCESS') {
        toast.success(`批量创建 ${response.data.count} 条盘点记录成功`);
        setBatchRecords([]);
        setIsBatchDialogOpen(false); // 关闭弹窗
        loadCheckedAssets(); // 更新已盘点资产列表
        onRecordCreated();
      } else {
        toast.error(response.message || '批量创建盘点记录失败');
      }
    } catch (error) {
      console.error('批量创建盘点记录失败:', error);
      toast.error('批量创建盘点记录失败');
    }
  };

  const addToBatch = (asset: AssetResponse) => {
    const existingIndex = batchRecords.findIndex(r => r.asset_id === asset.id);
    if (existingIndex >= 0) {
      toast.warning('该资产已在批量列表中');
      return;
    }

    const newRecord: CreateInventoryRecordRequest = {
      task_id: task.id,
      asset_id: asset.id,
      actual_status: asset.status,
      result: 'normal',
      notes: '',
      checked_by: '',
    };

    setBatchRecords([...batchRecords, newRecord]);
    toast.success(`已添加资产: ${asset.name}`);
  };

  const updateBatchRecord = (
    index: number,
    field: keyof CreateInventoryRecordRequest,
    value: InventoryRecordFieldValue
  ) => {
    const updatedRecords = [...batchRecords];
    updatedRecords[index] = { ...updatedRecords[index], [field]: value };
    setBatchRecords(updatedRecords);
  };

  const removeBatchRecord = (index: number) => {
    setBatchRecords(batchRecords.filter((_, i) => i !== index));
  };


  return (
    <div className="space-y-6">
      {/* 快速盘点 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            快速盘点
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="asset_scan">输入资产编号</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="asset_scan"
                  placeholder="输入资产编号"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleAssetScan(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const input = document.getElementById('asset_scan') as HTMLInputElement;
                    if (input) {
                      handleAssetScan(input.value);
                      input.value = '';
                    }
                  }}
                >
                  <Scan className="h-4 w-4" />
                </Button>
                <Dialog open={isSingleDialogOpen} onOpenChange={setIsSingleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Search className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-y-auto" style={{ maxWidth: '72rem' }}>
                    <DialogHeader>
                      <DialogTitle>选择资产</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="搜索资产编号或名称..."
                          value={keyword}
                          onChange={e => setKeyword(e.target.value)}
                        />
                        <Button onClick={loadAssets}>搜索</Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>资产编号</TableHead>
                            <TableHead>资产名称</TableHead>
                            <TableHead>分类</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>盘点状态</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assets.map(asset => (
                            <TableRow key={asset.id}>
                              <TableCell className="font-medium">{asset.asset_no}</TableCell>
                              <TableCell>{asset.name}</TableCell>
                              <TableCell>{asset.category?.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{getAssetStatusLabel(asset.status)}</Badge>
                              </TableCell>
                              <TableCell>
                                {checkedAssets.has(asset.id) ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    已盘点
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-600">
                                    待盘点
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  disabled={checkedAssets.has(asset.id)}
                                  onClick={() => {
                                    if (checkedAssets.has(asset.id)) {
                                      toast.warning('该资产已经盘点过了');
                                      return;
                                    }
                                    setSingleRecord({
                                      ...singleRecord,
                                      asset_id: asset.id,
                                      actual_status: asset.status,
                                    });
                                    setSelectedAsset(asset);
                                    setIsSingleDialogOpen(false);
                                  }}
                                >
                                  {checkedAssets.has(asset.id) ? '已盘点' : '选择'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div>
              <Label htmlFor="checked_by">盘点人</Label>
              <Input
                id="checked_by"
                value={singleRecord.checked_by}
                onChange={e => setSingleRecord({ ...singleRecord, checked_by: e.target.value })}
                placeholder="请输入盘点人姓名"
                className="mt-2"
              />
            </div>
          </div>

          {selectedAsset && (
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 flex-1">
                    <div>
                      <div className="text-sm text-gray-600">选中资产:</div>
                      <div className="font-medium">
                        {selectedAsset.asset_no} - {selectedAsset.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        分类: {selectedAsset.category?.name} | 部门: {selectedAsset.department?.name} | 当前状态:{' '}
                        {getAssetStatusLabel(selectedAsset.status)}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedAsset(null);
                        setSingleRecord({
                          ...singleRecord,
                          asset_id: 0,
                          actual_status: 'available',
                          result: 'normal',
                          notes: '',
                        });
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      撤回
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="actual_status">实际状态</Label>
                      <Select
                        value={singleRecord.actual_status}
                        onValueChange={value => setSingleRecord({ ...singleRecord, actual_status: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">可用</SelectItem>
                          <SelectItem value="borrowed">借用中</SelectItem>
                          <SelectItem value="maintenance">维修中</SelectItem>
                          <SelectItem value="scrapped">已报废</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="result">盘点结果</Label>
                      <Select
                        value={singleRecord.result}
                        onValueChange={(value: 'normal' | 'surplus' | 'deficit' | 'damaged') =>
                          setSingleRecord({ ...singleRecord, result: value })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">正常</SelectItem>
                          <SelectItem value="surplus">盘盈</SelectItem>
                          <SelectItem value="deficit">盘亏</SelectItem>
                          <SelectItem value="damaged">损坏</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    value={singleRecord.notes}
                    onChange={e => setSingleRecord({ ...singleRecord, notes: e.target.value })}
                    placeholder="请输入备注信息"
                    className="mt-2"
                    rows={2}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSingleSubmit}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    提交盘点
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* 批量盘点 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            批量盘点
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">已添加 {batchRecords.length} 条记录</div>
            <div className="flex gap-2">
              <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    添加资产
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto" style={{ maxWidth: '72rem' }}>
                  <DialogHeader>
                    <DialogTitle>选择资产</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="搜索资产编号或名称..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                      />
                      <Button onClick={loadAssets}>搜索</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>资产编号</TableHead>
                          <TableHead>资产名称</TableHead>
                          <TableHead>分类</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>盘点状态</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assets.map(asset => (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.asset_no}</TableCell>
                            <TableCell>{asset.name}</TableCell>
                            <TableCell>{asset.category?.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{getAssetStatusLabel(asset.status)}</Badge>
                            </TableCell>
                            <TableCell>
                              {checkedAssets.has(asset.id) ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  已盘点
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  待盘点
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                disabled={checkedAssets.has(asset.id)}
                                onClick={() => {
                                  if (checkedAssets.has(asset.id)) {
                                    toast.warning('该资产已经盘点过了');
                                    return;
                                  }
                                  addToBatch(asset);
                                }}
                              >
                                {checkedAssets.has(asset.id) ? '已盘点' : '添加'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isBatchListDialogOpen} onOpenChange={setIsBatchListDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={batchRecords.length === 0}>
                    <Eye className="mr-2 h-4 w-4" />
                    查看批量列表
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto" style={{ maxWidth: '90rem' }}>
                  <DialogHeader>
                    <DialogTitle>批量盘点列表</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>资产编号</TableHead>
                          <TableHead>资产名称</TableHead>
                          <TableHead>实际状态</TableHead>
                          <TableHead>盘点结果</TableHead>
                          <TableHead>盘点人</TableHead>
                          <TableHead>备注</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchRecords.map((record, index) => {
                          const asset = assets.find(a => a.id === record.asset_id);
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{asset?.asset_no}</TableCell>
                              <TableCell>{asset?.name}</TableCell>
                              <TableCell>
                                <Select
                                  value={record.actual_status}
                                  onValueChange={value => updateBatchRecord(index, 'actual_status', value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">可用</SelectItem>
                                    <SelectItem value="borrowed">借用中</SelectItem>
                                    <SelectItem value="maintenance">维修中</SelectItem>
                                    <SelectItem value="scrapped">已报废</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={record.result}
                                  onValueChange={(value: 'normal' | 'surplus' | 'deficit' | 'damaged') =>
                                    updateBatchRecord(index, 'result', value)
                                  }
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">正常</SelectItem>
                                    <SelectItem value="surplus">盘盈</SelectItem>
                                    <SelectItem value="deficit">盘亏</SelectItem>
                                    <SelectItem value="damaged">损坏</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={record.checked_by}
                                  onChange={e => updateBatchRecord(index, 'checked_by', e.target.value)}
                                  placeholder="盘点人"
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={record.notes}
                                  onChange={e => updateBatchRecord(index, 'notes', e.target.value)}
                                  placeholder="备注"
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" onClick={() => removeBatchRecord(index)}>
                                  移除
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleBatchSubmit}>提交批量盘点</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
