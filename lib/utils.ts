import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/lib/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 安全字符串转换函数
export function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * 分页获取所有智能体数据
 * @param maxRecords 最大记录数限制，默认1000
 * @returns 所有智能体数据
 */
export async function getAllAgents(maxRecords: number = 1000): Promise<Agent[]> {
  const allAgents: Agent[] = [];
  let page = 1;
  const pageSize = 50; // 使用安全的页面大小

  try {
    while (allAgents.length < maxRecords) {
      const response = await agentsApi.list({
        page,
        page_size: pageSize,
      });

      if (response.items.length === 0) {
        break; // 没有更多数据
      }

      allAgents.push(...response.items);

      // 如果返回的数据少于页面大小，说明已经是最后一页
      if (response.items.length < pageSize) {
        break;
      }

      page++;

      // 防止无限循环的安全检查
      if (page > 20) {
        // 最多20页，即1000条记录
        console.warn('获取智能体数据达到最大页数限制');
        break;
      }
    }
  } catch (error) {
    console.error('获取智能体数据失败:', error);
    throw error;
  }

  return allAgents.slice(0, maxRecords);
}
