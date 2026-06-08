"use client";

import { useState } from "react";
import type { HistoryRecord } from "@/types";

interface HistoryPanelProps {
  records: HistoryRecord[];
  isLoading: boolean;
  onSelect: (r: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onSearch: (q: string) => void;
}

function groupByDate(records: HistoryRecord[]): { label: string; items: HistoryRecord[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);
  const g = [
    { label: "今天", items: [] as HistoryRecord[] },
    { label: "昨天", items: [] as HistoryRecord[] },
    { label: "最近 7 天", items: [] as HistoryRecord[] },
    { label: "更早", items: [] as HistoryRecord[] },
  ];
  for (const r of records) {
    const d = new Date(r.createdAt);
    if (d >= today) g[0].items.push(r);
    else if (d >= yesterday) g[1].items.push(r);
    else if (d >= lastWeek) g[2].items.push(r);
    else g[3].items.push(r);
  }
  return g.filter(x => x.items.length > 0);
}

function fm(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

export function HistoryPanel({ records, isLoading, onSelect, onDelete, onSearch }: HistoryPanelProps) {
  const [q, setQ] = useState("");
  const groups = groupByDate(records);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-purple-500">📜 历史记录</h3>
        {records.length > 0 && (
          <span className="text-[10px] text-purple-400 bg-purple-100 rounded-full px-1.5 py-0.5">{records.length}</span>
        )}
      </div>

      {/* 搜索 — 边框加深 */}
      <div className="flex gap-1.5">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(q)} placeholder="搜索..."
          className="flex-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs text-gray-600 placeholder:text-gray-350 focus:outline-none focus:ring-1 transition-all"
          style={{ borderColor: "#d0c4e8" }} />
        <button onClick={() => onSearch(q)}
          className="rounded-lg border px-2.5 py-1.5 text-[11px] text-purple-500 hover:bg-purple-50 transition-colors"
          style={{ borderColor: "#d0c4e8" }}>搜索</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-500" />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-gray-350">{q ? "未找到" : "暂无记录 ✨"}</p>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.label}>
              <p className="mb-1.5 text-[10px] font-medium text-gray-350 uppercase tracking-wider">{g.label}</p>
              <div className="space-y-1">
                {g.items.map(r => (
                  <div key={r.id}
                    onClick={() => onSelect(r)}
                    className="group flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 hover:shadow-sm cursor-pointer transition-all"
                    style={{ borderColor: "#e5e7eb" }}>
                    <div className="w-0.5 self-stretch rounded-full shrink-0"
                      style={{ background: "linear-gradient(180deg, #b4a0d8 0%, #d8b0c0 100%)" }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-gray-600 truncate leading-snug">
                        {r.translations?.[0]?.text || r.translatedText}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400 truncate">{r.sourceText}</p>
                      <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                        {r.translations && r.translations.length > 0 && (
                          <span className="text-[10px] text-gray-400">📝 {r.translations.length}版</span>
                        )}
                        {r.voiceResults && r.voiceResults.filter((v: any) => !v._error).length > 0 && (
                          <span className="text-[10px] text-gray-400">
                            🎤 {r.voiceResults.filter((v: any) => !v._error).length}音色
                          </span>
                        )}
                        {/* 显示语音所属翻译风格（去重） */}
                        {r.voiceResults && r.translations && (() => {
                          const labels = [...new Set(r.voiceResults
                            .filter((v: any) => v.forText && v.audioUrl)
                            .map((v: any) => {
                              const m = (r.translations || []).find((t: any) => t.text?.trim() === v.forText?.trim());
                              return m?.label;
                            })
                            .filter(Boolean))];
                          return labels.map((l: any) => (
                            <span key={l} className="text-[10px] text-purple-400 font-medium">{l}</span>
                          ));
                        })()}
                        {r.voiceName && !r.voiceResults && <span className="text-[10px] text-gray-400">🎤 {r.voiceName}</span>}
                        <span className="text-[10px] text-gray-350">{fm(r.createdAt)}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                      className="shrink-0 rounded p-1 text-gray-300 hover:text-rose-400 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
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
