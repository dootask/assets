'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/axios';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle,
  ClipboardList,
  Clock,
  Package,
  Plus,
  RefreshCcw,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// 资产管理系统仪表板统计数据接口
interface AssetDashboardStats {
  assets: {
    total: number;
    available: number;
    borrowed: number;
    maintenance: number;
    scrapped: number;
  };
  categories: {
    total: number;
  };
  departments: {
    total: number;
  };
  borrowRecords: {
    total: number;
    active: number;
    overdue: number;
    todayReturns: number;
  };
  recentAssets: Array<{
    id: number;
    asset_no: string;
    name: string;
    category_name: string;
    created_at: string;
  }>;
  recentBorrows: Array<{
    id: number;
    asset_name: string;
    asset_no: string;
    borrower_name: string;
    borrow_date: string;
    is_overdue?: boolean;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<AssetDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 并行获取多个API数据
      const [dashboardResponse, categoriesResponse, departmentsResponse] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/categories'),
        apiClient.get('/departments')
      ]);

      const dashboardResult = dashboardResponse.data;
      
      if (dashboardResult.code === 'SUCCESS' && dashboardResult.data) {
        const data = dashboardResult.data;
        
        // 获取分类和部门数量
        let categoriesCount = 0;
        let departmentsCount = 0;
        
        const categoriesResult = categoriesResponse.data;
        if (categoriesResult.code === 'SUCCESS' && categoriesResult.data) {
          categoriesCount = categoriesResult.data.length || 0;
        }
        
        const departmentsResult = departmentsResponse.data;
        if (departmentsResult.code === 'SUCCESS' && departmentsResult.data) {
          departmentsCount = departmentsResult.data.data.length || 0;
        }
        
        // 转换后端数据格式为前端期望的格式
        const recentBorrows: any[] = []; // 暂时设为空数组，因为后端还没有返回recent_activity数据

        setStats({
          assets: {
            total: data.assets.total || 0,
            available: data.assets.available || 0,
            borrowed: data.assets.borrowed || 0,
            maintenance: data.assets.maintenance || 0,
            scrapped: data.assets.scrapped || 0,
          },
          categories: {
            total: data.categories.total || 0,
          },
          departments: {
            total: data.departments.total || 0,
          },
          borrowRecords: {
            total: data.borrow.total || 0,
            active: data.borrow.active || 0,
            overdue: data.borrow.overdue || 0,
            todayReturns: 0, // 后端暂未提供此数据
          },
          recentAssets: [], // 后端暂未提供此数据
          recentBorrows: recentBorrows,
        });
      } else {
        throw new Error(dashboardResult.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
      setError('加载仪表板数据失败，请检查后端服务是否正常运行');
      // 设置默认值
      setStats({
        assets: { total: 0, available: 0, borrowed: 0, maintenance: 0, scrapped: 0 },
        categories: { total: 0 },
        departments: { total: 0 },
        borrowRecords: { total: 0, active: 0, overdue: 0, todayReturns: 0 },
        recentAssets: [],
        recentBorrows: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">仪表板</h1>
            <p className="text-muted-foreground">企业固定资产管理系统概览</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="bg-muted h-4 w-20 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted mb-2 h-8 w-16 animate-pulse rounded"></div>
                <div className="bg-muted h-3 w-24 animate-pulse rounded"></div>
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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">仪表板</h1>
          <p className="text-muted-foreground">企业固定资产管理系统概览</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <Activity className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-2 text-lg font-medium text-red-600">加载失败</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={loadData} variant="outline" className="mt-4">
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && stats && (
        <>
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">资产总数</CardTitle>
                <Package className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assets.total}</div>
                <p className="text-muted-foreground text-xs">
                  可用: {stats.assets.available} | 借用中: {stats.assets.borrowed}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">分类数量</CardTitle>
                <Building2 className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.categories.total}</div>
                <p className="text-muted-foreground text-xs">资产分类管理</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">部门数量</CardTitle>
                <Users className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.departments.total}</div>
                <p className="text-muted-foreground text-xs">组织架构管理</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">借用记录</CardTitle>
                <ClipboardList className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.borrowRecords.active}</div>
                <p className="text-muted-foreground text-xs">
                  超期: {stats.borrowRecords.overdue} | 今日归还: {stats.borrowRecords.todayReturns}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                快速操作
              </CardTitle>
              <CardDescription>常用功能快速入口</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/assets/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Plus className="h-6 w-6" />
                    <span>新增资产</span>
                  </Button>
                </Link>
                <Link href="/borrow/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <ClipboardList className="h-6 w-6" />
                    <span>资产借用</span>
                  </Button>
                </Link>
                <Link href="/inventory/new">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <CheckCircle className="h-6 w-6" />
                    <span>创建盘点</span>
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <TrendingUp className="h-6 w-6" />
                    <span>查看报表</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 最近活动和状态 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>最新资产</CardTitle>
                  <CardDescription>最近添加的资产</CardDescription>
                </div>
                <Link href="/assets">
                  <Button variant="ghost" size="sm">
                    查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recentAssets.length > 0 ? (
                  stats.recentAssets.map(asset => (
                    <div key={asset.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Package className="h-4 w-4 text-blue-500" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{asset.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {asset.asset_no} • {asset.category_name}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-muted-foreground text-sm">暂无最新资产</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>借用状态</CardTitle>
                  <CardDescription>当前借用情况</CardDescription>
                </div>
                <Link href="/borrow">
                  <Button variant="ghost" size="sm">
                    查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recentBorrows.length > 0 ? (
                  stats.recentBorrows.map(borrow => (
                    <div key={borrow.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {borrow.is_overdue ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{borrow.asset_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {borrow.borrower_name} • {borrow.asset_no}
                        </p>
                      </div>
                      <div className="text-xs">
                        {borrow.is_overdue ? (
                          <Badge variant="destructive">超期</Badge>
                        ) : (
                          <Badge variant="secondary">借用中</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-muted-foreground text-sm">暂无借用记录</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
