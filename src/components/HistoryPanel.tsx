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

function groupByDate(
  records: HistoryRecord[]
): { label: string; items: HistoryRecord[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups = [
    { label: "今天", items: [] as HistoryRecord[] },
    { label: "昨天", items: [] as HistoryRecord[] },
    { label: "最近 7 天", items: [] as HistoryRecord[] },
    { label: "更早", items: [] as HistoryRecord[] },
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
      {/* 标题 */}
      <h3 className="text-sm font-semibold text-gray-600">
        📜 历史记录
      </h3>

      {/* 搜索栏 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索..."
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 placeholder:text-gray-300 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearch}
          className="h-8 text-xs rounded-lg border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50"
        >
          搜索
        </Button>
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-300">
          {searchQuery
            ? "未找到匹配记录"
            : "暂无记录，生成第一条吧 ✨"}
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium text-gray-300 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((record) => (
                  <div
                    key={record.id}
                    className="group flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:border-purple-200 hover:bg-purple-50/50 transition-colors cursor-pointer"
                    onClick={() => onSelect(record)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 truncate">
                        {record.translatedText}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        {record.sourceText}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {record.voiceName && (
                          <span className="text-[10px] text-gray-400">
                            🎤 {record.voiceName}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-300">
                          {formatTime(record.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(record.id);
                      }}
                      className="ml-2 shrink-0 rounded p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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

      {records.length > 0 && (
        <p className="text-center text-[10px] text-gray-300">
          共 {records.length} 条记录
        </p>
      )}
    </div>
  );
}
