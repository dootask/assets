import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DooTask AI 智能体管理',
  description: 'DooTask AI 智能体插件管理系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
