declare module "react" {
  export function useState<T>(
    initialState: T | (() => T),
  ): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(
    effect: () => void | (() => void),
    deps?: any[],
  ): void;
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[],
  ): T;
  export function useRef<T>(initialValue: T): { current: T };
}
