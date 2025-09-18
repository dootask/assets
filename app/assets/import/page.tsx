'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getAssetTemplate, importAssets } from '@/lib/api/assets';
import { downloadFileFromUrl } from '@/lib/api/reports';
import type { AssetStatus, CreateAssetRequest, ImportAssetRequest, ImportAssetResponse } from '@/lib/types';
import { AxiosError } from 'axios';
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  XCircle
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: boolean;
  data?: ImportAssetResponse;
  error?: string;
}

export default function ImportAssetsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<CreateAssetRequest[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 模板下载
  const downloadTemplate = useCallback(async () => {
    try {
      // 调用后端API获取模板下载URL
      const response = await getAssetTemplate();
      downloadFileFromUrl(response.data.download_url, response.data.filename);

      toast({
        title: '模板下载成功',
        description: '资产导入模板已下载到本地',
      });
    } catch (error) {
      console.error('下载模板失败:', error);
      toast({
        variant: 'destructive',
        title: '下载失败',
        description: '模板下载失败，请重试',
      });
    }
  }, [toast]);

  // 解析文件
  const parseFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('文件内容为空或格式不正确');
      }

      // 解析数据
      const rows = jsonData.slice(1) as (string | number | null)[][];

      const assets: CreateAssetRequest[] = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        try {
          // 跳过空行
          if (!row || row.every(cell => !cell)) return;

          const asset: CreateAssetRequest = {
            asset_no: String(row[0] || '').trim(),
            name: String(row[1] || '').trim(),
            category_id: parseInt(String(row[2] || '0')),
            department_id: row[3] ? parseInt(String(row[3])) : undefined,
            brand: String(row[4] || '').trim(),
            model: String(row[5] || '').trim(),
            serial_number: String(row[6] || '').trim(),
            purchase_date: row[7] ? String(row[7]).trim() : undefined,
            purchase_price: row[8] ? parseFloat(String(row[8])) : undefined,
            purchase_person: String(row[9] || '').trim(),
            purchase_quantity: row[10] ? parseInt(String(row[10])) : undefined,
            supplier: String(row[11] || '').trim(),
            warranty_period: row[12] ? parseInt(String(row[12])) : undefined,
            status: (row[13] ? String(row[13]).trim() : 'available') as AssetStatus,
            location: String(row[14] || '').trim(),
            responsible_person: String(row[15] || '').trim(),
            description: String(row[16] || '').trim(),
          };

          // 基本验证
          if (!asset.asset_no) {
            errors.push(`第${index + 2}行：资产编号不能为空`);
            return;
          }
          if (!asset.name) {
            errors.push(`第${index + 2}行：资产名称不能为空`);
            return;
          }
          if (!asset.category_id || asset.category_id <= 0) {
            errors.push(`第${index + 2}行：分类ID必须是有效的数字`);
            return;
          }

          // 状态验证
          const validStatuses = ['available', 'borrowed', 'maintenance', 'scrapped'];
          if (asset.status && !validStatuses.includes(asset.status)) {
            errors.push(`第${index + 2}行：状态必须是 ${validStatuses.join('/')}`);
            return;
          }

          assets.push(asset);
        } catch (error) {
          errors.push(`第${index + 2}行：数据格式错误 - ${error}`);
        }
      });

      setPreviewData(assets);
      setValidationErrors(errors);

      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: '数据验证失败',
          description: `发现 ${errors.length} 个错误，请检查数据格式`,
        });
      } else {
        toast({
          title: '文件解析成功',
          description: `已解析 ${assets.length} 条资产数据`,
        });
      }
    } catch (error) {
      console.error('解析文件失败:', error);
      toast({
        variant: 'destructive',
        title: '文件解析失败',
        description: error instanceof Error ? error.message : '文件格式不正确',
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  // 文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        variant: 'destructive',
        title: '文件类型错误',
        description: '请选择 Excel (.xlsx, .xls) 或 CSV 文件',
      });
      return;
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast({
        variant: 'destructive',
        title: '文件过大',
        description: '文件大小不能超过 10MB',
      });
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    setValidationErrors([]);
    parseFile(selectedFile);
  }, [parseFile, toast]);

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const selectedFile = files[0];

      // 验证文件类型
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          variant: 'destructive',
          title: '文件类型错误',
          description: '请选择 Excel (.xlsx, .xls) 或 CSV 文件',
        });
        return;
      }

      // 验证文件大小（限制为10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast({
          variant: 'destructive',
          title: '文件过大',
          description: '文件大小不能超过 10MB',
        });
        return;
      }

      setFile(selectedFile);
      setImportResult(null);
      setValidationErrors([]);
      parseFile(selectedFile);
    }
  }, [parseFile, toast]);

  // 执行导入
  const handleImport = useCallback(async () => {
    if (previewData.length === 0) {
      toast({
        variant: 'destructive',
        title: '无数据可导入',
        description: '请先选择有效的文件并解析数据',
      });
      return;
    }

    if (validationErrors.length > 0) {
      toast({
        variant: 'destructive',
        title: '数据验证失败',
        description: '请先修复数据错误后再导入',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const request: ImportAssetRequest = {
        assets: previewData,
      };

      const result = await importAssets(request);
      setImportResult({ success: true, data: result.data });

      toast({
        title: '导入完成',
        description: `成功导入 ${result.data.success_count} 条数据`,
      });
    } catch (error: unknown) {
      console.error('导入失败:', error);
      if (error instanceof AxiosError) {
        setImportResult({
          success: false,
          error: error?.response?.data?.message || error.message || '导入失败',
        });
  
        toast({
          variant: 'destructive',
          title: '导入失败',
          description: error?.response?.data?.message || error.message || '导入过程中发生错误',
        });
      }
    } finally {
      setIsImporting(false);
    }
  }, [previewData, validationErrors, toast]);

  // 重置
  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setImportResult(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">资产导入</h1>
          <p className="text-muted-foreground">批量导入资产数据，支持Excel和CSV格式</p>
        </div>
      </div>

      {/* 模板下载 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="text-muted-foreground h-5 w-5" />
            下载导入模板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={downloadTemplate} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              下载Excel模板
            </Button>
            <div className="text-sm text-muted-foreground">
              下载标准模板文件，确保数据格式正确
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文件上传 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="text-muted-foreground h-5 w-5" />
            选择文件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <FileText className={`mx-auto h-12 w-12 mb-4 ${
                isDragOver ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="space-y-2">
                <p className={`text-sm ${
                  isDragOver ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {isDragOver ? '释放文件以上传' : '拖拽文件到此处，或点击选择文件'}
                </p>
                <p className="text-xs text-muted-foreground">
                  支持 Excel (.xlsx, .xls) 和 CSV 格式，文件大小不超过 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="mt-4"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    选择文件
                  </>
                )}
              </Button>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
              {isUploading && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 数据预览 */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-5 w-5" />
                数据预览
              </span>
              <Badge variant="outline">
                {previewData.length} 条数据
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>资产编号</TableHead>
                    <TableHead>资产名称</TableHead>
                    <TableHead>分类ID</TableHead>
                    <TableHead>采购人</TableHead>
                    <TableHead>采购数量</TableHead>
                    <TableHead>品牌</TableHead>
                    <TableHead>型号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>位置</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((asset, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{asset.asset_no}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>{asset.category_id}</TableCell>
                      <TableCell>{asset.purchase_person || '-'}</TableCell>
                      <TableCell>{asset.purchase_quantity || '-'}</TableCell>
                      <TableCell>{asset.brand || '-'}</TableCell>
                      <TableCell>{asset.model || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === 'available' ? 'default' :
                            asset.status === 'borrowed' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {asset.status === 'available' ? '可用' :
                           asset.status === 'borrowed' ? '借用中' :
                           asset.status === 'maintenance' ? '维护中' : '已报废'}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.location || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {previewData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                显示前10条数据，共{previewData.length}条
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 验证错误 */}
      {validationErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              数据验证错误
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 导入进度和结果 */}
      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              正在导入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={66} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              正在处理数据，请稍候...
            </p>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              导入结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.success && importResult.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.data.success_count}
                    </div>
                    <div className="text-sm text-green-600">成功导入</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.data.failed_count}
                    </div>
                    <div className="text-sm text-red-600">导入失败</div>
                  </div>
                </div>

                {importResult.data.errors && importResult.data.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">失败详情：</h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {importResult.data.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              第{error.index + 1}行：{error.error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importResult.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <div className="space-x-2">
          {file && (
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          )}
        </div>
        <div className="space-x-2">
          {previewData.length > 0 && validationErrors.length === 0 && (
            <Button
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  开始导入
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
