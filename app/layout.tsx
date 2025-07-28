import { AssetManagementLayout } from '@/components/layout/asset-management-layout';
import { AppProvider } from '@/contexts/app-context';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '企业固定资产管理系统',
  description: '轻量级企业固定资产管理解决方案',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppProvider>
          <AssetManagementLayout>
            {children}
          </AssetManagementLayout>
        </AppProvider>
      </body>
    </html>
  );
}