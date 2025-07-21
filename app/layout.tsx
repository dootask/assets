import './globals.css';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/contexts/app-context';
import { DootaskProvider } from '@/contexts/dootask-context';
import ProtectedRoute from '@/components/protected-route';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DooTask AI 智能体管理',
  description: 'DooTask AI 智能体插件管理系统',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppProvider>
          <DootaskProvider>
            <ProtectedRoute>
              <SidebarProvider>
                <div className="flex h-screen w-full">
                  <AppSidebar />
                  <main className="flex-1">{children}</main>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          </DootaskProvider>
        </AppProvider>
      </body>
    </html>
  );
}
