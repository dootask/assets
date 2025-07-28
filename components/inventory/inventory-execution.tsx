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
import type { CreateInventoryRecordRequest, InventoryTask } from '@/lib/api/inventory';
import { batchCreateInventoryRecords, createInventoryRecord } from '@/lib/api/inventory';
import type { AssetResponse } from '@/lib/types';
import { AlertCircle, CheckCircle, Eye, Plus, Scan, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface InventoryExecutionProps {
    task: InventoryTask;
    onRecordCreated: () => void;
}

const resultLabels = {
    normal: '正常',
    surplus: '盘盈',
    deficit: '盘亏',
    damaged: '损坏'
};

const resultColors = {
    normal: 'bg-green-100 text-green-800',
    surplus: 'bg-orange-100 text-orange-800',
    deficit: 'bg-red-100 text-red-800',
    damaged: 'bg-purple-100 text-purple-800'
};

const resultIcons = {
    normal: CheckCircle,
    surplus: AlertCircle,
    deficit: XCircle,
    damaged: AlertCircle
};

// 定义CreateInventoryRecordRequest字段值的类型
type InventoryRecordFieldValue = string | number | 'normal' | 'surplus' | 'deficit' | 'damaged';

export function InventoryExecution({ task, onRecordCreated }: InventoryExecutionProps) {
    const [assets, setAssets] = useState<AssetResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedAssets, setSelectedAssets] = useState<AssetResponse[]>([]);
    const [batchRecords, setBatchRecords] = useState<CreateInventoryRecordRequest[]>([]);
    const [showBatchDialog, setShowBatchDialog] = useState(false);
    const [showAssetDialog, setShowAssetDialog] = useState(false);
    
    // 单个记录表单
    const [singleRecord, setSingleRecord] = useState<CreateInventoryRecordRequest>({
        task_id: task.id,
        asset_id: 0,
        actual_status: 'available',
        result: 'normal',
        notes: '',
        checked_by: ''
    });

    useEffect(() => {
        if (showAssetDialog) {
            loadAssets();
        }
    }, [showAssetDialog, searchKeyword]);

    const loadAssets = async () => {
        try {
            setLoading(true);
            const response = await getAssets({
                page: 1,
                page_size: 50,
                sorts: [{ key: 'asset_no', desc: false }],
                filters: searchKeyword ? { keyword: searchKeyword } : undefined
            });
            
            if (response.code === 'SUCCESS') {
                setAssets(response.data.data);
            }
        } catch (error) {
            console.error('获取资产列表失败:', error);
            toast.error('获取资产列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAssetScan = (assetNo: string) => {
        // 模拟扫码功能，实际应用中可以集成条码扫描库
        const asset = assets.find(a => a.asset_no === assetNo);
        if (asset) {
            setSingleRecord({
                ...singleRecord,
                asset_id: asset.id
            });
            toast.success(`找到资产: ${asset.name}`);
        } else {
            toast.error('未找到对应资产');
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
                    checked_by: singleRecord.checked_by // 保留盘点人信息
                });
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
                setShowBatchDialog(false);
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
            checked_by: ''
        };

        setBatchRecords([...batchRecords, newRecord]);
        toast.success(`已添加资产: ${asset.name}`);
    };

    const updateBatchRecord = (index: number, field: keyof CreateInventoryRecordRequest, value: InventoryRecordFieldValue) => {
        const updatedRecords = [...batchRecords];
        updatedRecords[index] = { ...updatedRecords[index], [field]: value };
        setBatchRecords(updatedRecords);
    };

    const removeBatchRecord = (index: number) => {
        setBatchRecords(batchRecords.filter((_, i) => i !== index));
    };

    const selectedAsset = assets.find(a => a.id === singleRecord.asset_id);

    return (
        <div className="space-y-6">
            {/* 快速盘点 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scan className="w-5 h-5" />
                        快速盘点
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="asset_scan">扫描/输入资产编号</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="asset_scan"
                                    placeholder="扫描或输入资产编号"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAssetScan(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>选择资产</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="搜索资产编号或名称..."
                                                    value={searchKeyword}
                                                    onChange={(e) => setSearchKeyword(e.target.value)}
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
                                                        <TableHead>操作</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {assets.map((asset) => (
                                                        <TableRow key={asset.id}>
                                                            <TableCell className="font-medium">{asset.asset_no}</TableCell>
                                                            <TableCell>{asset.name}</TableCell>
                                                            <TableCell>{asset.category?.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{asset.status}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSingleRecord({
                                                                            ...singleRecord,
                                                                            asset_id: asset.id,
                                                                            actual_status: asset.status
                                                                        });
                                                                        setShowAssetDialog(false);
                                                                    }}
                                                                >
                                                                    选择
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
                                onChange={(e) => setSingleRecord({ ...singleRecord, checked_by: e.target.value })}
                                placeholder="请输入盘点人姓名"
                            />
                        </div>
                    </div>

                    {selectedAsset && (
                        <Card className="bg-blue-50">
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600">选中资产:</div>
                                        <div className="font-medium">{selectedAsset.asset_no} - {selectedAsset.name}</div>
                                        <div className="text-sm text-gray-600">
                                            分类: {selectedAsset.category?.name} | 
                                            部门: {selectedAsset.department?.name} |
                                            当前状态: {selectedAsset.status}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <Label htmlFor="actual_status">实际状态</Label>
                                            <Select
                                                value={singleRecord.actual_status}
                                                onValueChange={(value) => setSingleRecord({ ...singleRecord, actual_status: value })}
                                            >
                                                <SelectTrigger>
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
                                                onValueChange={(value: 'normal' | 'surplus' | 'deficit' | 'damaged') => setSingleRecord({ ...singleRecord, result: value })}
                                            >
                                                <SelectTrigger>
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
                                        onChange={(e) => setSingleRecord({ ...singleRecord, notes: e.target.value })}
                                        placeholder="请输入备注信息"
                                        rows={2}
                                    />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleSingleSubmit}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
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
                        <Plus className="w-5 h-5" />
                        批量盘点
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            已添加 {batchRecords.length} 条记录
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        添加资产
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>选择资产</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="搜索资产编号或名称..."
                                                value={searchKeyword}
                                                onChange={(e) => setSearchKeyword(e.target.value)}
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
                                                    <TableHead>操作</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assets.map((asset) => (
                                                    <TableRow key={asset.id}>
                                                        <TableCell className="font-medium">{asset.asset_no}</TableCell>
                                                        <TableCell>{asset.name}</TableCell>
                                                        <TableCell>{asset.category?.name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{asset.status}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => addToBatch(asset)}
                                                            >
                                                                添加
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
                                <DialogTrigger asChild>
                                    <Button disabled={batchRecords.length === 0}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        查看批量列表
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
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
                                                            <TableCell className="font-medium">
                                                                {asset?.asset_no}
                                                            </TableCell>
                                                            <TableCell>{asset?.name}</TableCell>
                                                            <TableCell>
                                                                <Select
                                                                    value={record.actual_status}
                                                                    onValueChange={(value) => updateBatchRecord(index, 'actual_status', value)}
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
                                                                    onValueChange={(value: 'normal' | 'surplus' | 'deficit' | 'damaged') => updateBatchRecord(index, 'result', value)}
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
                                                                    onChange={(e) => updateBatchRecord(index, 'checked_by', e.target.value)}
                                                                    placeholder="盘点人"
                                                                    className="w-24"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={record.notes}
                                                                    onChange={(e) => updateBatchRecord(index, 'notes', e.target.value)}
                                                                    placeholder="备注"
                                                                    className="w-32"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => removeBatchRecord(index)}
                                                                >
                                                                    移除
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                                                取消
                                            </Button>
                                            <Button onClick={handleBatchSubmit}>
                                                提交批量盘点
                                            </Button>
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