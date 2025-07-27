import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/contexts/app-context';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '企业固定资产管理系统',
  description: '轻量级企业固定资产管理解决方案',
};

const navigation = [
  { name: '仪表板', href: '/dashboard' },
  { name: '资产管理', href: '/assets' },
  { name: '分类管理', href: '/categories' },
  { name: '部门管理', href: '/departments' },
  { name: '借用管理', href: '/borrow' },
  { name: '盘点管理', href: '/inventory' },
  { name: '报表统计', href: '/reports' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppProvider>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                      <h1 className="text-xl font-bold text-gray-900">资产管理系统</h1>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}