"use client";

// ============================================
// HistoryPanel — 翻译历史记录面板
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HistoryRecord } from "@/types";

interface HistoryPanelProps {
  records: HistoryRecord[];
  isLoading: boolean;
  onSelect: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
}

/**
 * 按日期分组
 */
function groupByDate(
  records: HistoryRecord[]
): { label: string; items: HistoryRecord[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: HistoryRecord[] }[] = [
    { label: "今天", items: [] },
    { label: "昨天", items: [] },
    { label: "最近 7 天", items: [] },
    { label: "更早", items: [] },
  ];

  for (const record of records) {
    const recordDate = new Date(record.createdAt);

    if (recordDate >= today) {
      groups[0].items.push(record);
    } else if (recordDate >= yesterday) {
      groups[1].items.push(record);
    } else if (recordDate >= lastWeek) {
      groups[2].items.push(record);
    } else {
      groups[3].items.push(record);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

/**
 * 格式化时间为简短显示
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function HistoryPanel({
  records,
  isLoading,
  onSelect,
  onDelete,
  onSearch,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const groups = groupByDate(records);

  return (
    <div className="space-y-4">
      {/* 标题 + 搜索 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">
          历史记录
        </h3>

        {/* 搜索栏 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索原文或翻译..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
            className="h-8 text-xs rounded-lg border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            搜索
          </Button>
        </div>
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          {searchQuery
            ? "未找到匹配记录"
            : "暂无历史记录，生成第一条吧 ✨"}
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((record) => (
                  <div
                    key={record.id}
                    className="group flex items-center justify-between rounded-lg border border-zinc-700/30 bg-zinc-800/20 px-3 py-2.5 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => onSelect(record)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-300 truncate">
                        {record.translatedText}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">
                        {record.sourceText}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {record.voiceName && (
                          <span className="text-[10px] text-zinc-600">
                            🎤 {record.voiceName}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600">
                          {formatTime(record.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(record.id);
                      }}
                      className="ml-2 shrink-0 rounded p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="删除"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 记录数 */}
      {records.length > 0 && (
        <p className="text-center text-[10px] text-zinc-600">
          共 {records.length} 条记录（最多保留 100 条）
        </p>
      )}
    </div>
  );
}
