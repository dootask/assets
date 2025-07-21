'use client';

import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MockDataManager } from '@/lib/mock-data';
import { KnowledgeBase, KnowledgeBaseDocument } from '@/lib/types';
import { Database, Edit, FileText, Plus, Search, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  // 可以根据URL hash或其他方式获取默认tab，这里暂时使用固定值
  const defaultTab = 'documents';

  useEffect(() => {
    // 模拟获取知识库详情
    const kbId = params.id as string;
    const kbData = MockDataManager.getKnowledgeBases().find(kb => kb.id === kbId);

    if (kbData) {
      setKnowledgeBase(kbData);
      // 模拟获取文档列表
      const mockDocuments: KnowledgeBaseDocument[] = [
        {
          id: '1',
          name: '产品需求文档.pdf',
          size: '2.3 MB',
          uploadedAt: '2024-01-15T10:00:00Z',
          status: 'processed' as const,
          chunks: 45,
          type: 'pdf',
        },
        {
          id: '2',
          name: 'API接口文档.md',
          size: '856 KB',
          uploadedAt: '2024-01-14T14:30:00Z',
          status: 'processed' as const,
          chunks: 23,
          type: 'markdown',
        },
        {
          id: '3',
          name: '用户手册.docx',
          size: '1.7 MB',
          uploadedAt: '2024-01-13T09:15:00Z',
          status: 'processing' as const,
          chunks: 0,
          type: 'docx',
        },
      ];
      setDocuments(mockDocuments);
    }
    setLoading(false);
  }, [params.id]);

  const handleDelete = () => {
    if (confirm('确定要删除这个知识库吗？此操作不可撤销。')) {
      MockDataManager.deleteKnowledgeBase(params.id as string);
      toast.success('知识库删除成功');
      router.push('/knowledge');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];

    // 模拟文件上传
    setTimeout(() => {
      const newDocument: KnowledgeBaseDocument = {
        id: `${Date.now()}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        status: 'processing' as const,
        chunks: 0,
        type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      };

      setDocuments(prev => [newDocument, ...prev] as KnowledgeBaseDocument[]);
      setUploading(false);
      toast.success(`文件 "${file.name}" 上传成功，正在处理中...`);

      // 模拟处理完成
      setTimeout(() => {
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === newDocument.id
              ? { ...doc, status: 'processed', chunks: Math.floor(Math.random() * 50) + 10 }
              : doc
          )
        );
        toast.success(`文件 "${file.name}" 处理完成`);
      }, 3000);
    }, 1000);
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm('确定要删除这个文档吗？')) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      toast.success('文档删除成功');
    }
  };

  const filteredDocuments = documents.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant="default" className="bg-green-500">
            已处理
          </Badge>
        );
      case 'processing':
        return <Badge variant="secondary">处理中</Badge>;
      case 'failed':
        return <Badge variant="destructive">处理失败</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = 'h-4 w-4';
    switch (type) {
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'docx':
      case 'doc':
        return <FileText className={`${iconClass} text-blue-500`} />;
      case 'md':
      case 'markdown':
        return <FileText className={`${iconClass} text-green-500`} />;
      case 'txt':
        return <FileText className={`${iconClass} text-gray-500`} />;
      default:
        return <FileText className={`${iconClass} text-muted-foreground`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Database className="text-muted-foreground mb-4 h-16 w-16" />
        <h2 className="mb-2 text-xl font-semibold">知识库不存在</h2>
        <p className="text-muted-foreground mb-4">请检查 URL 是否正确</p>
        <Button asChild>
          <Link href="/knowledge">返回列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/knowledge">知识库管理</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{knowledgeBase.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Database className="text-primary h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">{knowledgeBase.name}</h1>
            <Badge variant="outline" className="text-xs">
              {documents.length} 个文档
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{knowledgeBase.description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/knowledge/${knowledgeBase.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="gap-2">
          <TabsTrigger value="documents">文档管理</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* 文档上传和搜索 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    文档管理
                  </CardTitle>
                  <CardDescription>上传和管理知识库文档</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="搜索文档..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-64 pl-9"
                    />
                  </div>
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          上传文档
                        </>
                      )}
                    </label>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                    <p className="text-muted-foreground">{searchTerm ? '没有找到匹配的文档' : '还没有上传任何文档'}</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>文档名称</TableHead>
                      <TableHead>大小</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>文本块</TableHead>
                      <TableHead>上传时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(document => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(document.type)}
                            <span className="font-medium">{document.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{document.size}</TableCell>
                        <TableCell>{getStatusBadge(document.status)}</TableCell>
                        <TableCell>{document.chunks || '-'}</TableCell>
                        <TableCell>{new Date(document.uploadedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(document.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* 知识库设置 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    基本设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-muted-foreground text-sm font-medium">知识库名称</h4>
                      <p className="text-sm">{knowledgeBase.name}</p>
                    </div>
                    <div>
                      <h4 className="text-muted-foreground text-sm font-medium">Embedding 模型</h4>
                      <p className="text-sm">{knowledgeBase.embeddingModel}</p>
                    </div>
                    <div>
                      <h4 className="text-muted-foreground text-sm font-medium">创建时间</h4>
                      <p className="text-sm">{new Date(knowledgeBase.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-muted-foreground text-sm font-medium">更新时间</h4>
                      <p className="text-sm">{new Date(knowledgeBase.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-muted-foreground mb-2 text-sm font-medium">描述</h4>
                    <p className="text-sm leading-relaxed">{knowledgeBase.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>统计信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">总文档数</span>
                    <span className="text-sm font-medium">{documents.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">已处理文档</span>
                    <span className="text-sm font-medium">
                      {documents.filter(d => d.status === 'processed').length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">总文本块数</span>
                    <span className="text-sm font-medium">
                      {documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">存储空间</span>
                    <span className="text-sm font-medium">
                      {documents
                        .reduce((sum, doc) => {
                          const size = parseFloat(doc.size.split(' ')[0]);
                          return sum + (doc.size.includes('MB') ? size : size / 1024);
                        }, 0)
                        .toFixed(1)}{' '}
                      MB
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
