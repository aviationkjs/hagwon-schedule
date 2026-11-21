import { useCallback, useEffect, useState, type DependencyList } from "react";

/** 비동기 읽기 한 번 + 다시 읽기. Firestore 읽기 횟수를 아끼려고 실시간 구독 대신 쓴다. */
export function useLoad<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await run());
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
