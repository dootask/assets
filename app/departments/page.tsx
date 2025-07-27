'use client';

import { DepartmentDialog } from '@/components/departments/department-dialog';
import Loading from '@/components/loading';
import { Pagination } from '@/components/pagination';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { deleteDepartment, getDepartments } from '@/lib/api/departments';
import type { DepartmentFilters, DepartmentResponse, PaginationRequest } from '@/lib/types';
import { Building2, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentResponse | null>(null);

  const pageSize = 20;

  // 加载部门列表
  const loadDepartments = async (page = 1, search = '') => {
    try {
      setLoading(true);
      
      const filters: DepartmentFilters = {};
      if (search.trim()) {
        filters.name = search.trim();
      }

      const params: PaginationRequest & { filters?: DepartmentFilters } = {
        page,
        page_size: pageSize,
        sorts: [{ key: 'created_at', desc: true }],
        filters,
      };

      const response = await getDepartments(params);
      
      if (response.code === 'SUCCESS') {
        setDepartments(response.data.data);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.total_pages);
        setTotalItems(response.data.total_items);
      } else {
        toast.error(response.message || '加载部门列表失败');
      }
    } catch (error) {
      console.error('加载部门列表失败:', error);
      toast.error('加载部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadDepartments(1, '');
  }, []);

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    loadDepartments(1, searchTerm);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadDepartments(page, searchTerm);
  };

  // 新增部门
  const handleCreate = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  // 编辑部门
  const handleEdit = (department: DepartmentResponse) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  // 删除部门
  const handleDelete = (department: DepartmentResponse) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    try {
      const response = await deleteDepartment(departmentToDelete.id);
      
      if (response.code === 'SUCCESS') {
        toast.success('部门删除成功');
        loadDepartments(currentPage, searchTerm);
      } else {
        toast.error(response.message || '删除部门失败');
      }
    } catch (error) {
      console.error('删除部门失败:', error);
      toast.error('删除部门失败');
    } finally {
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  // 对话框成功回调
  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingDepartment(null);
    loadDepartments(currentPage, searchTerm);
  };

  if (loading && departments.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">部门管理</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增部门
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总部门数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有资产部门</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(dept => dept.asset_count > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + dept.asset_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索部门名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant="outline">
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 部门列表 */}
      <Card>
        <CardHeader>
          <CardTitle>部门列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无部门数据
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>部门名称</TableHead>
                    <TableHead>部门编码</TableHead>
                    <TableHead>负责人</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>资产数量</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">
                        {department.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{department.code}</Badge>
                      </TableCell>
                      <TableCell>{department.manager || '-'}</TableCell>
                      <TableCell>{department.contact || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={department.asset_count > 0 ? 'default' : 'secondary'}>
                          {department.asset_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(department.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(department)}
                            disabled={department.asset_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 部门对话框 */}
      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDepartment}
        onSuccess={handleDialogSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除部门 &quot;{departmentToDelete?.name}&quot; 吗？此操作不可撤销。
              {departmentToDelete?.asset_count && departmentToDelete.asset_count > 0 && (
                <div className="mt-2 text-red-600">
                  该部门下还有 {departmentToDelete.asset_count} 个资产，无法删除。
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={departmentToDelete?.asset_count && departmentToDelete.asset_count > 0}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}