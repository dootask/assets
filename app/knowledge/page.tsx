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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MockDataManager } from '@/lib/mock-data';
import { KnowledgeBase } from '@/lib/types';
import { Calendar, Database, Eye, FileText, MoreHorizontal, Plus, Settings, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kbToDelete, setKbToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadKnowledgeBases = () => {
    setIsLoading(true);
    setTimeout(() => {
      MockDataManager.initializeData();
      const kbList = MockDataManager.getKnowledgeBases();
      setKnowledgeBases(kbList);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const handleDeleteKB = (kbId: string) => {
    setKbToDelete(kbId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (kbToDelete) {
      // 这里应该调用删除API，目前只是从本地数组中移除
      setKnowledgeBases(kbs => kbs.filter(kb => kb.id !== kbToDelete));
      toast.success('知识库已删除');
    }
    setDeleteDialogOpen(false);
    setKbToDelete(null);
  };

  const getEmbeddingModelBadge = (model: string) => {
    switch (model) {
      case 'text-embedding-ada-002':
        return <Badge variant="default">OpenAI Ada</Badge>;
      case 'text-embedding-3-small':
        return <Badge variant="secondary">OpenAI Small</Badge>;
      case 'text-embedding-3-large':
        return <Badge variant="outline">OpenAI Large</Badge>;
      default:
        return <Badge variant="outline">{model}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">知识库管理</h1>
            <p className="text-muted-foreground">管理 AI 智能体的知识库和文档</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-5 w-32 animate-pulse rounded"></div>
                <div className="bg-muted h-4 w-48 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted h-4 w-24 animate-pulse rounded"></div>
                  <div className="bg-muted h-3 w-36 animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">知识库管理</h1>
          <p className="text-muted-foreground">管理 AI 智能体的知识库和文档</p>
        </div>
        <Button asChild>
          <Link href="/knowledge/create">
            <Plus className="mr-2 h-4 w-4" />
            创建知识库
          </Link>
        </Button>
      </div>

      {knowledgeBases.length === 0 ? (
        <Card className="p-12 text-center">
          <Database className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">还没有知识库</h3>
          <p className="text-muted-foreground mb-4">创建您的第一个知识库来存储 AI 参考资料</p>
          <Button asChild>
            <Link href="/knowledge/create">
              <Plus className="mr-2 h-4 w-4" />
              创建知识库
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeBases.map(kb => (
            <Card key={kb.id} className="group transition-all duration-200 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{kb.name}</CardTitle>
                      {getEmbeddingModelBadge(kb.embeddingModel)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/knowledge/${kb.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/knowledge/${kb.id}/upload`}>
                          <Upload className="mr-2 h-4 w-4" />
                          上传文档
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/knowledge/${kb.id}/settings`}>
                          <Settings className="mr-2 h-4 w-4" />
                          设置
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteKB(kb.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="mt-2 text-sm">{kb.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* 统计信息 */}
                <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm font-medium">文档数量</span>
                  </div>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {kb.documentsCount}
                  </Badge>
                </div>

                {/* 时间信息 */}
                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span>创建时间：{new Date(kb.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  {kb.updatedAt !== kb.createdAt && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>更新时间：{new Date(kb.updatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/knowledge/${kb.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      查看
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/knowledge/${kb.id}/upload`}>
                      <Upload className="mr-1 h-3 w-3" />
                      上传
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除知识库</AlertDialogTitle>
            <AlertDialogDescription>此操作将永久删除该知识库及其所有文档。此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
