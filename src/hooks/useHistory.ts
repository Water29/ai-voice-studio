// ============================================
// useHistory — 历史记录 Hook
// ============================================

"use client";

import { useState, useCallback, useEffect } from "react";
import type { HistoryRecord } from "@/types";

interface UseHistoryReturn {
  records: HistoryRecord[];
  isLoading: boolean;
  error: string | null;
  loadHistory: (query?: string) => Promise<void>;
  deleteItem: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (query?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = query
        ? `/api/history?q=${encodeURIComponent(query)}`
        : "/api/history";

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setRecords(data.records as HistoryRecord[]);
      } else {
        setError("加载历史记录失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/history/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // 从本地状态中移除
          setRecords((prev) => prev.filter((r) => r.id !== id));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  // 初始加载
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    records,
    isLoading,
    error,
    loadHistory,
    deleteItem,
    refresh,
  };
}
