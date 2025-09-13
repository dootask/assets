'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { importAssets } from '@/lib/api/assets';
import type { CreateAssetRequest, ImportAssetRequest, ImportAssetResponse } from '@/lib/types';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 模板下载
  const downloadTemplate = useCallback(() => {
    try {
      // 创建工作簿
      const wb = XLSX.utils.book_new();

      // 创建工作表数据
      const templateData = [
        [
          '资产编号*',
          '资产名称*',
          '分类ID*',
          '部门ID',
          '品牌',
          '型号',
          '序列号',
          '采购日期',
          '采购价格',
          '供应商',
          '保修期(月)',
          '状态',
          '位置',
          '责任人',
          '描述'
        ],
        [
          'ASSET001',
          '联想笔记本电脑',
          '1',
          '2',
          '联想',
          'ThinkPad X1',
          'SN123456',
          '2024-01-15',
          '15000.00',
          '联想科技有限公司',
          '24',
          'available',
          '办公楼A座201室',
          '张三',
          '办公用笔记本电脑'
        ],
        [
          'ASSET002',
          '办公桌椅',
          '3',
          '',
          '办公家具公司',
          '办公桌椅套装',
          '',
          '2024-02-01',
          '2000.00',
          '办公家具公司',
          '12',
          'available',
          '会议室B',
          '李四',
          '办公桌椅套装'
        ]
      ];

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 资产编号
        { wch: 20 }, // 资产名称
        { wch: 10 }, // 分类ID
        { wch: 10 }, // 部门ID
        { wch: 12 }, // 品牌
        { wch: 15 }, // 型号
        { wch: 15 }, // 序列号
        { wch: 12 }, // 采购日期
        { wch: 12 }, // 采购价格
        { wch: 20 }, // 供应商
        { wch: 12 }, // 保修期
        { wch: 12 }, // 状态
        { wch: 15 }, // 位置
        { wch: 10 }, // 责任人
        { wch: 30 }  // 描述
      ];
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '资产导入模板');

      // 创建说明工作表
      const instructions = [
        ['资产导入说明'],
        [''],
        ['1. 必填字段：'],
        ['   - 资产编号：唯一标识，必须填写'],
        ['   - 资产名称：资产名称，必须填写'],
        ['   - 分类ID：资产分类ID，必须填写'],
        [''],
        ['2. 可选字段：'],
        ['   - 部门ID：所属部门ID'],
        ['   - 品牌、型号、序列号：资产规格信息'],
        ['   - 采购日期：格式为 YYYY-MM-DD'],
        ['   - 采购价格：数字格式'],
        ['   - 供应商：供应商名称'],
        ['   - 保修期：数字，单位为月'],
        ['   - 状态：available(可用)/borrowed(借用中)/maintenance(维护中)/scrapped(已报废)'],
        ['   - 位置：资产存放位置'],
        ['   - 责任人：责任人姓名'],
        ['   - 描述：资产描述信息'],
        [''],
        ['3. 注意事项：'],
        ['   - 请确保资产编号的唯一性'],
        ['   - 分类ID和部门ID必须是系统中已存在的ID'],
        ['   - 日期格式请使用 YYYY-MM-DD'],
        ['   - 价格字段只填写数字，不需要货币符号'],
        ['   - 导入前请先备份数据']
      ];

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
      XLSX.utils.book_append_sheet(wb, wsInstructions, '导入说明');

      // 下载文件
      XLSX.writeFile(wb, '资产导入模板.xlsx');

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
      const headers = jsonData[0] as string[];
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
            supplier: String(row[9] || '').trim(),
            warranty_period: row[10] ? parseInt(String(row[10])) : undefined,
            status: (row[11] ? String(row[11]).trim() : 'available') as any,
            location: String(row[12] || '').trim(),
            responsible_person: String(row[13] || '').trim(),
            description: String(row[14] || '').trim(),
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
    } catch (error: any) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        error: error?.response?.data?.message || error.message || '导入失败',
      });

      toast({
        variant: 'destructive',
        title: '导入失败',
        description: error?.response?.data?.message || error.message || '导入过程中发生错误',
      });
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
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  拖拽文件到此处，或点击选择文件
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
                onClick={() => fileInputRef.current?.click()}
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
                      <TableCell>{asset.brand}</TableCell>
                      <TableCell>{asset.model}</TableCell>
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
                      <TableCell>{asset.location}</TableCell>
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
