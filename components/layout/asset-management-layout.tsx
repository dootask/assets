'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Building2,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Home,
  LayoutDashboard,
  Menu,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navigation = [
  { 
    name: '仪表板', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: '系统概览和快速操作'
  },
  { 
    name: '资产管理', 
    href: '/assets', 
    icon: Package,
    description: '资产信息管理'
  },
  { 
    name: '分类管理', 
    href: '/categories', 
    icon: Building2,
    description: '资产分类体系'
  },
  { 
    name: '部门管理', 
    href: '/departments', 
    icon: Users,
    description: '组织架构管理'
  },
  { 
    name: '借用管理', 
    href: '/borrow', 
    icon: ClipboardList,
    description: '资产借用归还'
  },
  { 
    name: '盘点管理', 
    href: '/inventory', 
    icon: CheckCircle,
    description: '资产盘点任务'
  },
  { 
    name: '报表统计', 
    href: '/reports', 
    icon: TrendingUp,
    description: '数据分析报表'
  },
];

// 面包屑导航配置
const breadcrumbConfig: Record<string, { name: string; parent?: string }> = {
  '/dashboard': { name: '仪表板' },
  '/assets': { name: '资产管理' },
  '/assets/new': { name: '新增资产', parent: '/assets' },
  '/assets/import': { name: '资产导入', parent: '/assets' },
  '/categories': { name: '分类管理' },
  '/departments': { name: '部门管理' },
  '/borrow': { name: '借用管理' },
  '/borrow/new': { name: '新增借用', parent: '/borrow' },
  '/borrow/return': { name: '归还处理', parent: '/borrow' },
  '/inventory': { name: '盘点管理' },
  '/inventory/new': { name: '创建盘点', parent: '/inventory' },
  '/reports': { name: '报表统计' },
  '/reports/assets': { name: '资产报表', parent: '/reports' },
  '/reports/borrow': { name: '借用报表', parent: '/reports' },
  '/reports/inventory': { name: '盘点报表', parent: '/reports' },
  '/logs': { name: '操作日志' },
};

// 动态路由处理函数
const getDynamicBreadcrumb = (pathname: string) => {
  // 处理资产详情 /assets/[id]
  if (pathname.match(/^\/assets\/\d+$/)) {
    return { name: '资产详情', parent: '/assets' };
  }
  // 处理资产编辑 /assets/[id]/edit
  if (pathname.match(/^\/assets\/\d+\/edit$/)) {
    const assetId = pathname.split('/')[2];
    return { name: '编辑资产', parent: `/assets/${assetId}` };
  }
  // 处理盘点详情 /inventory/[id]
  if (pathname.match(/^\/inventory\/\d+$/)) {
    return { name: '盘点详情', parent: '/inventory' };
  }
  // 处理盘点报告 /inventory/[id]/report
  if (pathname.match(/^\/inventory\/\d+\/report$/)) {
    const inventoryId = pathname.split('/')[2];
    return { name: '盘点报告', parent: `/inventory/${inventoryId}` };
  }
  return null;
};

interface AssetManagementLayoutProps {
  children: React.ReactNode;
}

export function AssetManagementLayout({ children }: AssetManagementLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // 生成面包屑导航
  const generateBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentPath = pathname;
    
    // 构建路径链
    const pathChain = [];
    
    // 处理当前路径
    let config = breadcrumbConfig[currentPath] || getDynamicBreadcrumb(currentPath);
    
    while (config) {
      pathChain.unshift({ name: config.name, href: currentPath });
      currentPath = config.parent || '';
      
      if (currentPath) {
        config = breadcrumbConfig[currentPath] || getDynamicBreadcrumb(currentPath);
      } else {
        break;
      }
    }
    
    // 添加首页
    breadcrumbs.push({ name: '首页', href: '/' });
    
    // 添加路径链中的所有面包屑
    breadcrumbs.push(...pathChain);
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        {/* 移动端侧边栏 */}
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="flex flex-row h-16 shrink-0 items-center border-b px-6">
            <SheetTitle className="flex items-center">
              <Package className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold">资产管理系统</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </SheetContent>

        {/* 桌面端侧边栏 */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">资产管理系统</span>
            </div>
            <nav className="mt-8 flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* 顶部导航栏 */}
          <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 items-center">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden px-4 ml-2 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            
            {/* 面包屑导航 */}
            <div className="flex-1 px-4 flex items-center">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
                      )}
                      {index === 0 && <Home className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="text-sm font-medium text-gray-900">
                          {breadcrumb.name}
                        </span>
                      ) : (
                        <Link
                          href={breadcrumb.href}
                          className="text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          {breadcrumb.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>

          {/* 页面内容 */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </Sheet>
    </div>
  );
}