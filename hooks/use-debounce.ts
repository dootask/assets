import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 防抖回调 Hook - 首次立即执行，后续防抖
 * @param callback 需要防抖的回调函数
 * @param deps 依赖项数组
 * @param delay 防抖延迟时间（毫秒），默认为 300
 * @param immediate 是否首次立即执行，默认为 true
 */
export function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList = [],
  delay: number = 300,
  immediate: boolean = true
): (...args: Parameters<T>) => void {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const isImmediate = useRef(immediate);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(
        () => {
          callback(...args);
        },
        isImmediate.current ? 0 : delay
      );

      isImmediate.current = false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps]
  );
}

/**
 * 防抖值 Hook - 对值进行防抖处理
 * @param value 需要防抖的值
 * @param delay 防抖延迟时间（毫秒），默认为 300
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
