'use client';

import { DepartmentDialog } from '@/components/departments/department-dialog';
import { Loading } from '@/components/loading';
import { Pagination, defaultPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/app-context';
import { deleteDepartment, getDepartments } from '@/lib/api/departments';
import type { DepartmentFilters, DepartmentResponse, PaginationRequest } from '@/lib/types';
import { Building2, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const { Confirm } = useAppContext();

  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(defaultPagination);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null);

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
        page_size: pagination.page_size,
        sorts: [{ key: 'created_at', desc: true }],
        filters,
      };

      const response = await getDepartments(params);

      if (response.code === 'SUCCESS') {
        setDepartments(response.data.data);
        setPagination(response.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 搜索处理
  const handleSearch = () => {
    loadDepartments(1, searchTerm);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
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
  const handleDelete = async (department: DepartmentResponse) => {
    // 检查是否可以删除
    if (department.asset_count && department.asset_count > 0) {
      await Confirm({
        title: '无法删除',
        message: `该部门下还有 ${department.asset_count} 个资产，无法删除。`,
        confirmText: '知道了',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = await Confirm({
      title: '确认删除',
      message: `确定要删除部门 "${department.name}" 吗？此操作不可撤销。`,
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      const response = await deleteDepartment(department.id);

      if (response.code === 'SUCCESS') {
        toast.success('部门删除成功');
        loadDepartments(pagination.current_page, searchTerm);
      } else {
        toast.error(response.message || '删除部门失败');
      }
    } catch (error) {
      console.error('删除部门失败:', error);
      toast.error('删除部门失败');
    }
  };

  // 对话框成功回调
  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingDepartment(null);
    loadDepartments(pagination.current_page, searchTerm);
  };

  if (loading && departments.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">部门管理</h1>
          <p className="text-muted-foreground">管理企业部门信息</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增部门
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总部门数</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total_items}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有资产部门</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.filter(dept => dept.asset_count > 0).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产数</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.reduce((sum, dept) => sum + dept.asset_count, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="搜索部门名称..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
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
            <div className="py-8 text-center text-gray-500">暂无部门数据</div>
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
                  {departments.map(department => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
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
                      <TableCell>{new Date(department.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(department)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(department)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.current_page}
                  totalPages={pagination.total_pages}
                  pageSize={pagination.page_size}
                  totalItems={pagination.total_items}
                  onPageChange={handlePageChange}
                  onPageSizeChange={() => {
                    // 默认不支持修改每页大小
                  }}
                />
              </div>
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
    </div>
  );
}
