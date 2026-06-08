"use client";

// ============================================
// CostDisplay — 成本统计展示
// ============================================

import type { CostBreakdown } from "@/types";
import { formatCost } from "@/lib/cost";

interface CostDisplayProps {
  cost: CostBreakdown;
}

export function CostDisplay({ cost }: CostDisplayProps) {
  return (
    <div className="rounded-xl border border-purple-200/60 bg-white p-3 space-y-2">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        💰 费用明细
      </h3>

      <div className="space-y-1.5">
        {/* 字符数 */}
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-gray-400">输入字符</span>
          <span className="text-[11px] text-gray-600 font-medium tabular-nums">
            {cost.characters}
          </span>
        </div>

        {/* 翻译费用 */}
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-gray-400">
            翻译费用
            <span className="text-gray-350 ml-1">(DeepSeek)</span>
          </span>
          <span className="text-[11px] text-purple-500 font-medium tabular-nums">
            {formatCost(cost.translationCost)}
          </span>
        </div>

        {/* TTS 费用 */}
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-gray-400">
            语音费用
            <span className="text-gray-350 ml-1">(ElevenLabs)</span>
          </span>
          <span className="text-[11px] text-emerald-500 font-medium tabular-nums">
            {formatCost(cost.ttsCost)}
          </span>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-purple-100 pt-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-600 font-semibold">合计</span>
            <span className="text-[11px] text-purple-600 font-bold tabular-nums">
              {formatCost(cost.totalCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
