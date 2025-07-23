import axios from '@/lib/axios';

/**
 * 测试token和server
 * @param token
 * @param server
 * @returns
 */
export const testTokenServer = async (token: string, server: string): Promise<void> => {
  await axios.get(`/test`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Server: server,
    },
  });
};
