'use client';

import {
  interceptBack,
  isMainElectron as isMainElectronTool,
  isSubElectron as isSubElectronTool,
  getUserInfo,
  DooTaskUserInfo,
} from '@dootask/tools';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface DootaskContextType {
  loading: boolean;
  error: string | null;
  isMainElectron: boolean;
  isSubElectron: boolean;
  dooTaskUser: DooTaskUserInfo | null;
}

const DootaskContext = createContext<DootaskContextType | undefined>(undefined);

export function DootaskProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMainElectron, setIsMainElectron] = useState(false);
  const [isSubElectron, setIsSubElectron] = useState(false);
  const [dooTaskUser, setDooTaskUser] = useState<DooTaskUserInfo | null>(null);
  const cleanInterceptBack = useRef<(() => void) | null>(null);

  // 关闭窗口前拦截
  const beforeClose = () => {
    if (typeof window === 'undefined') return false;

    try {
      // 查找是否有 data-slot="dialog-close" 的元素
      const dialogClose = document.querySelector("[data-slot='dialog-close']") as HTMLButtonElement;
      if (dialogClose) {
        dialogClose.click();
        return true;
      }
    } catch {
      // 如果找不到，则返回 false
    }

    return false;
  };

  useEffect(() => {
    setLoading(false); // 暂时不用检测

    (async () => {
      try {
        // 并行执行独立的异步操作
        const [interceptCleanup, isMainElec, isSubElec, dooTaskUser] = await Promise.all([
          interceptBack(beforeClose),
          isMainElectronTool(),
          isSubElectronTool(),
          getUserInfo(),
        ]);

        cleanInterceptBack.current = interceptCleanup;
        setIsMainElectron(isMainElec);
        setIsSubElectron(isSubElec);
        setDooTaskUser(dooTaskUser);
      } catch (error) {
        setError(error as string);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cleanInterceptBack.current?.();
      cleanInterceptBack.current = null;
    };
  }, []);

  return (
    <DootaskContext.Provider
      value={{
        loading,
        error,
        isMainElectron,
        isSubElectron,
        dooTaskUser,
      }}
    >
      {children}
    </DootaskContext.Provider>
  );
}

export function useDootaskContext() {
  const context = useContext(DootaskContext);
  if (context === undefined) {
    throw new Error('useDootaskContext must be used within an DootaskProvider');
  }
  return context;
}
