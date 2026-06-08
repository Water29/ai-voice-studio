"use client";

import { useState, useCallback, useEffect } from "react";
import { ScriptInput } from "@/components/ScriptInput";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { VoiceMultiSelect } from "@/components/VoiceMultiSelect";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useHistory } from "@/hooks/useHistory";
import type { Voice } from "@/types";

// ============================================
// 预置音色
// ============================================
const VOICES: Voice[] = [
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", label: "Adam — Deep American Male", category: "male", description: "深沉美式男声，广告促销" },
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", label: "Rachel — Warm American Female", category: "female", description: "温暖美国女声，旁白教程" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Bella", label: "Bella — Young American Female", category: "female", description: "年轻活泼，TikTok社媒" },
  { voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", label: "Sam — Calm American Male", category: "male", description: "沉稳平静，企业介绍" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", label: "Domi — Energetic Female", category: "female", description: "高能量女声，促销导购" },
  { voiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Emily", label: "Emily — Soft American Female", category: "female", description: "温柔亲切，生活类" },
];

// ============================================
// 翻译/语音 结果类型
// ============================================
interface TransItem { translatedText: string; style: string; label: string; description: string; tokensUsed: number; costUsd: number; }
interface VoiceItem { voiceId: string; voiceName: string; audioUrl: string; durationMs: number; }

type Phase = "idle" | "translating" | "translated" | "generating" | "done";

export default function Home() {
  const historyStore = useHistory();

  // ---- 状态 ----
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<Set<string>>(
    new Set(["pNInz6obpgDQGcFmaJgB"])
  );
  const [translations, setTranslations] = useState<TransItem[]>([]);
  const [activeTransTab, setActiveTransTab] = useState(0);
  const [voiceResults, setVoiceResults] = useState<VoiceItem[]>([]);
  const [activeVoiceTab, setActiveVoiceTab] = useState(0);

  useEffect(() => { historyStore.loadHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============ Step 1: 翻译 ============
  const handleTranslate = useCallback(async (text: string) => {
    setSourceText(text);
    setPhase("translating");
    setTranslations([]);
    setVoiceResults([]);
    setError(null);

    try {
      const res = await fetch("/api/translate/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && data.translations) {
        const valid = data.translations.filter((t: any) => t.translatedText);
        if (valid.length === 0) {
          setError("AI 未能生成有效翻译，请重试");
          setPhase("idle");
          return;
        }
        setTranslations(valid);
        setActiveTransTab(0);
        setPhase("translated");
      } else {
        setError(data.error || "翻译失败，请检查 API Key 是否正确配置");
        setPhase("idle");
      }
    } catch {
      setError("网络错误，请检查后端服务是否运行");
      setPhase("idle");
    }
  }, []);

  // ============ Step 2: 生成语音（并行，全部完成后展示）============
  const handleGenerateVoices = useCallback(async () => {
    const activeTrans = translations[activeTransTab];
    if (!activeTrans || selectedVoiceIds.size === 0) return;

    setPhase("generating");
    setVoiceResults([]);
    const ids = [...selectedVoiceIds];

    try {
      const res = await fetch("/api/tts/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeTrans.translatedText, voiceIds: ids }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const results: VoiceItem[] = data.results
          .filter((r: any) => !r._error && r.audioUrl)
          .map((r: any) => ({
            voiceId: ids.find((id: string) => r.voiceName === VOICES.find(v => v.voiceId === id)?.name) || ids[0],
            voiceName: r.voiceName,
            audioUrl: r.audioUrl,
            durationMs: r.durationMs,
          }));
        setVoiceResults(results);
        setActiveVoiceTab(0);
        setPhase("done");

        // 保存历史
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: `rec_${Date.now()}`,
              sourceText,
              translatedText: activeTrans.translatedText,
              translationStyle: activeTrans.style,
              audioUrl: results[0]?.audioUrl ?? null,
              voiceName: results[0]?.voiceName ?? null,
              voiceId: ids[0],
              durationMs: results[0]?.durationMs ?? null,
              costUsd: 0,
              createdAt: new Date().toISOString(),
            }),
          });
          historyStore.refresh();
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    finally {
      if (phase === "generating") setPhase("translated");
    }
  }, [translations, activeTransTab, selectedVoiceIds, sourceText, historyStore, phase]);

  // ============ 音色切换 ============
  const handleToggleVoice = useCallback((id: string) => {
    setSelectedVoiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ============ 重置 ============
  const handleReset = useCallback(() => {
    setPhase("idle"); setError(null); setSourceText(""); setTranslations([]);
    setVoiceResults([]); setActiveTransTab(0); setActiveVoiceTab(0);
  }, []);

  const activeTrans = translations[activeTransTab];

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between rounded-2xl px-5 py-3.5 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 35%, #90b0d8 65%, #b090c8 100%)" }}>
        <div>
          <h1 className="text-lg font-bold drop-shadow-sm">🎙️ AI Voice Studio</h1>
          <p className="mt-0.5 text-xs text-white/65">DeepSeek 翻译 · ElevenLabs 配音</p>
        </div>
        {phase !== "idle" && (
          <button onClick={handleReset} className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-all">
            + 新建
          </button>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ========== LEFT: 翻译+语音 (3 cols) ========== */}
        <div className="space-y-4 lg:col-span-3">
          {/* 输入 + 翻译按钮 */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <ScriptInput onGenerate={handleTranslate} isGenerating={phase === "translating"} />

            {/* 错误提示 */}
            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 flex items-start gap-2">
                <span className="text-rose-400 shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="text-xs text-rose-600 font-medium">出错了</p>
                  <p className="text-[11px] text-rose-500 mt-0.5">{error}</p>
                </div>
                <button onClick={() => setError(null)}
                  className="ml-auto text-rose-400 hover:text-rose-500 text-xs shrink-0">✕</button>
              </div>
            )}

            {/* 翻译中 loading */}
            {phase === "translating" && (
              <div className="mt-3 rounded-xl border border-purple-200/40 p-3"
                style={{ background: "linear-gradient(135deg, #ede5f8 0%, #e8e0f5 100%)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-500" />
                  <span className="text-sm text-purple-500 font-medium">正在并行生成 3 版翻译...</span>
                </div>
              </div>
            )}
          </section>

          {/* 翻译结果 Tabs */}
          {translations.length > 0 && (
            <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
              <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                📝 翻译结果 (点击切换)
              </h2>

              {/* Tab 菜单 */}
              <div className="flex gap-1.5 mb-3">
                {translations.map((t, i) => {
                  const colors = [
                    { bg: "#f0eaf8", text: "#7b6aaa", border: "#b4a0d8" },
                    { bg: "#e8edf8", text: "#5b6e9a", border: "#98acd0" },
                    { bg: "#e8f5ee", text: "#5a8a6e", border: "#90c0a8" },
                  ][i];
                  return (
                    <button key={i} onClick={() => setActiveTransTab(i)}
                      className="rounded-lg border px-3 py-1.5 text-left text-xs transition-all flex-1"
                      style={{
                        borderColor: i === activeTransTab ? colors.border : "#e5e7eb",
                        background: i === activeTransTab ? colors.bg : "#fff",
                        color: i === activeTransTab ? colors.text : "#9ca3af",
                        fontWeight: i === activeTransTab ? 600 : 500,
                      }}>
                      <div>{t.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{t.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* 当前 Tab 的内容 */}
              {activeTrans && (
                <div className="rounded-xl border p-3"
                  style={{
                    borderColor: "#d0c4e8",
                    background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)",
                  }}>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {activeTrans.translatedText}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(activeTrans.translatedText); } catch { }
                      }}
                      className="text-[10px] text-gray-400 hover:text-purple-500 transition-colors">
                      复制
                    </button>
                  </div>
                </div>
              )}

              {/* 生成语音按钮 */}
              {phase === "translated" && (
                <button onClick={handleGenerateVoices}
                  disabled={selectedVoiceIds.size === 0}
                  className="w-full mt-3 h-10 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)",
                    boxShadow: "0 2px 10px rgba(130,145,190,0.35)",
                  }}>
                  🎤 生成语音 ({selectedVoiceIds.size} 个音色)
                </button>
              )}

              {/* 语音生成中 */}
              {phase === "generating" && (
                <div className="mt-3 rounded-xl border border-violet-200/40 p-3"
                  style={{ background: "linear-gradient(135deg, #ede5f8 0%, #f8e0ee 100%)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-500" />
                    <span className="text-sm text-violet-500 font-medium">
                      正在并行生成 {selectedVoiceIds.size} 个音色...
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 语音结果 Tabs */}
          {voiceResults.length > 0 && (
            <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
              <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                🎤 语音预览
              </h2>

              {/* 音色 Tabs */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {voiceResults.map((v, i) => (
                  <button key={v.voiceId} onClick={() => setActiveVoiceTab(i)}
                    className="rounded-lg border px-3 py-1.5 text-xs transition-all"
                    style={{
                      borderColor: i === activeVoiceTab ? "#b4a0d8" : "#e5e7eb",
                      background: i === activeVoiceTab ? "#f0eaf8" : "#fff",
                      color: i === activeVoiceTab ? "#7b6aaa" : "#9ca3af",
                      fontWeight: i === activeVoiceTab ? 600 : 500,
                    }}>
                    🎤 {v.voiceName}
                  </button>
                ))}
              </div>

              {/* 当前音色的波形 */}
              {voiceResults[activeVoiceTab] && (
                <WaveformPlayer
                  audioUrl={voiceResults[activeVoiceTab].audioUrl}
                  voiceName={voiceResults[activeVoiceTab].voiceName}
                  onDownload={() => {
                    const v = voiceResults[activeVoiceTab];
                    const a = document.createElement("a");
                    a.href = v.audioUrl; a.download = `ai-voice-${v.voiceName}.mp3`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }}
                />
              )}
            </section>
          )}
        </div>

        {/* ========== RIGHT: 音色 + 历史 (2 cols) ========== */}
        <div className="space-y-4 lg:col-span-2">
          {/* 音色选择 — 翻译前可操作 */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <VoiceMultiSelect
              voices={VOICES}
              selectedIds={selectedVoiceIds}
              onToggle={handleToggleVoice}
              onSelectAll={() => setSelectedVoiceIds(new Set(VOICES.map(v => v.voiceId)))}
              onDeselectAll={() => setSelectedVoiceIds(new Set())}
              disabled={phase === "translating" || phase === "generating"}
            />
          </section>

          {/* 历史 */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <HistoryPanel
              records={historyStore.records} isLoading={historyStore.isLoading}
              onSelect={(r) => {
                setSourceText(r.sourceText);
                setTranslations([{
                  translatedText: r.translatedText, style: r.translationStyle,
                  label: r.translationStyle as string, description: "", tokensUsed: 0, costUsd: 0
                }]);
                setActiveTransTab(0); setPhase("translated");
                if (r.audioUrl) {
                  setVoiceResults([{ voiceId: r.voiceId || "", voiceName: r.voiceName || "", audioUrl: r.audioUrl, durationMs: r.durationMs || 0 }]);
                  setActiveVoiceTab(0); setPhase("done");
                }
              }}
              onDelete={(id) => historyStore.deleteItem(id)}
              onSearch={(q) => historyStore.loadHistory(q)} />
          </section>
        </div>
      </div>

      <footer className="mt-8 pb-6 text-center">
        <p className="text-xs text-purple-300/80">
          Powered by{" "}
          <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-500 transition-colors">DeepSeek</a>{" "}+{" "}
          <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-500 transition-colors">ElevenLabs</a>
        </p>
      </footer>
    </div>
  );
}
