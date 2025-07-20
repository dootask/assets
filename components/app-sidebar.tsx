'use client';

import { Bot, Brain, Cpu, Database, Home, MessageSquare, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// 导航菜单配置
const menuItems = [
  {
    title: '仪表板',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: '智能体管理',
    url: '/agents',
    icon: Bot,
  },
  {
    title: 'AI 模型管理',
    url: '/models',
    icon: Cpu,
  },
  {
    title: '对话监控',
    url: '/conversations',
    icon: MessageSquare,
  },
  {
    title: '知识库',
    url: '/knowledge',
    icon: Database,
  },
  {
    title: 'MCP工具',
    url: '/tools',
    icon: Wrench,
  },
  {
    title: '系统设置',
    url: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Brain className="text-primary h-6 w-6" />
          <h1 className="text-xl font-bold">DooTask AI</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url))}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
