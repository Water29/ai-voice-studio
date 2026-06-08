"use client";

// ============================================
// HistoryPanel — 翻译历史记录面板
// ============================================

import { useState } from "react";
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
    const d = new Date(record.createdAt);
    if (d >= today) groups[0].items.push(record);
    else if (d >= yesterday) groups[1].items.push(record);
    else if (d >= lastWeek) groups[2].items.push(record);
    else groups[3].items.push(record);
  }
  return groups.filter((g) => g.items.length > 0);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function HistoryPanel({
  records,
  isLoading,
  onSelect,
  onDelete,
  onSearch,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => onSearch(searchQuery);

  const groups = groupByDate(records);

  return (
    <div className="space-y-3">
      {/* 标题 + 搜索 */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          📜 历史记录
        </h3>
        {records.length > 0 && (
          <span className="text-[10px] text-gray-300 bg-gray-100 rounded-full px-1.5 py-0.5">
            {records.length}
          </span>
        )}
      </div>

      {/* 搜索 */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索..."
          className="flex-1 rounded-lg border border-purple-100 bg-gradient-to-r from-purple-50/30 to-white px-2.5 py-1.5 text-xs text-gray-600 placeholder:text-gray-300 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all"
        />
        <button
          onClick={handleSearch}
          className="rounded-lg border border-purple-200 px-2.5 py-1.5 text-[11px] text-purple-500 hover:bg-purple-50 transition-colors"
        >
          搜索
        </button>
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-gray-300">
          {searchQuery ? "未找到" : "暂无记录 ✨"}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[10px] font-medium text-gray-300 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((record) => (
                  <div
                    key={record.id}
                    className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-gradient-to-r from-white to-purple-50/20 px-2.5 py-2 hover:border-purple-200 hover:shadow-sm cursor-pointer transition-all"
                    onClick={() => onSelect(record)}
                  >
                    {/* 左侧色条 */}
                    <div className="w-0.5 self-stretch rounded-full bg-gradient-to-b from-purple-400 to-pink-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-600 truncate leading-snug">
                        {record.translatedText}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 truncate">
                        {record.sourceText}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
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
                      className="shrink-0 rounded p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg
                        width="12"
                        height="12"
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
    </div>
  );
}
