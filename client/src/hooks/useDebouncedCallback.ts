import { useEffect, useMemo, useRef } from "react";

export const useDebouncedCallback = <T extends (...args: never[]) => void>(
  fn: T,
  delayMs = 500,
): T => {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  return useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fnRef.current(...args), delayMs);
    };
    return debounced as T;
  }, [delayMs]);
};
