"use client";

import { useState, useCallback, useEffect } from "react";
import { ScriptInput } from "@/components/ScriptInput";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { VoiceMultiSelect } from "@/components/VoiceMultiSelect";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useHistory } from "@/hooks/useHistory";
import type { Voice } from "@/types";

const VOICES: Voice[] = [
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", label: "Adam — Deep American Male", category: "male", description: "深沉美式男声，广告促销" },
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", label: "Rachel — Warm American Female", category: "female", description: "温暖美国女声，旁白教程" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Bella", label: "Bella — Young American Female", category: "female", description: "年轻活泼，TikTok社媒" },
  { voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", label: "Sam — Calm American Male", category: "male", description: "沉稳平静，企业介绍" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", label: "Domi — Energetic Female", category: "female", description: "高能量女声，促销导购" },
  { voiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Emily", label: "Emily — Soft American Female", category: "female", description: "温柔亲切，生活类" },
];

interface TransItem { translatedText: string; style: string; label: string; description: string; tokensUsed: number; costUsd: number; }
interface VoiceItem { voiceId: string; voiceName: string; audioUrl: string; durationMs: number; }

type Phase = "idle" | "translating" | "translated";

export default function Home() {
  const historyStore = useHistory();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<Set<string>>(new Set(["pNInz6obpgDQGcFmaJgB"]));
  const [translations, setTranslations] = useState<TransItem[]>([]);
  const [activeTransTab, setActiveTransTab] = useState(0);

  // 每个翻译 tab 独立的语音结果 + 生成状态
  const [voiceMap, setVoiceMap] = useState<Map<number, VoiceItem[]>>(new Map());
  const [voiceGenTab, setVoiceGenTab] = useState<number | null>(null); // 正在生成语音的 tab

  useEffect(() => { historyStore.loadHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLocked = phase === "translating" || voiceGenTab !== null;

  // ============ 翻译 ============
  const handleTranslate = useCallback(async (text: string) => {
    setSourceText(text); setPhase("translating"); setError(null);
    setTranslations([]); setVoiceMap(new Map()); setVoiceGenTab(null);

    try {
      const res = await fetch("/api/translate/multi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && data.translations) {
        const valid = data.translations.filter((t: any) => t.translatedText);
        if (valid.length === 0) { setError("AI 未能生成有效翻译，请重试"); setPhase("idle"); return; }
        setTranslations(valid); setActiveTransTab(0); setPhase("translated");
      } else { setError(data.error || "翻译失败"); setPhase("idle"); }
    } catch { setError("网络错误"); setPhase("idle"); }
  }, []);

  // ============ 生成语音（针对当前 tab，并行等待全部完成）============
  const handleGenerateVoices = useCallback(async (tabIndex: number) => {
    const trans = translations[tabIndex];
    if (!trans || selectedVoiceIds.size === 0) return;

    setVoiceGenTab(tabIndex); setError(null);
    const ids = [...selectedVoiceIds];
    const nameToId: Record<string, string> = {};
    for (const v of VOICES) nameToId[v.name] = v.voiceId;

    try {
      const res = await fetch("/api/tts/multi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trans.translatedText, voiceIds: ids }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const results: VoiceItem[] = data.results
          .filter((r: any) => !r._error && r.audioUrl)
          .map((r: any) => ({ voiceId: nameToId[r.voiceName] || ids[0], voiceName: r.voiceName, audioUrl: r.audioUrl, durationMs: r.durationMs }));

        if (results.length === 0) { setError("所有音色生成失败，请检查账户"); }
        else {
          setVoiceMap(prev => { const m = new Map(prev); m.set(tabIndex, results); return m; });
        }

        // 保存历史（完整信息）
        try {
          await fetch("/api/history", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: `rec_${Date.now()}`,
              sourceText,
              translations: translations.map(t => ({ text: t.translatedText, style: t.style, label: t.label })),
              selectedTranslation: trans.translatedText,
              voiceResults: results.map(r => ({ voiceName: r.voiceName, audioUrl: r.audioUrl, durationMs: r.durationMs })),
              createdAt: new Date().toISOString(),
            }),
          });
          historyStore.refresh();
        } catch { /* ignore */ }
      } else { setError(data.error || "语音生成失败"); }
    } catch { setError("语音生成出错"); }
    finally { setVoiceGenTab(null); }
  }, [translations, selectedVoiceIds, sourceText, historyStore]);

  // ============ 音色 ============
  const handleToggleVoice = useCallback((id: string) => {
    setSelectedVoiceIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle"); setError(null); setSourceText("");
    setTranslations([]); setVoiceMap(new Map()); setVoiceGenTab(null);
    setActiveTransTab(0);
  }, []);

  const activeTrans = translations[activeTransTab];
  const activeVoices = voiceMap.get(activeTransTab) || [];
  const isGeneratingForTab = voiceGenTab === activeTransTab;

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between rounded-2xl px-5 py-3.5 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 35%, #90b0d8 65%, #b090c8 100%)" }}>
        <div><h1 className="text-lg font-bold drop-shadow-sm">🎙️ AI Voice Studio</h1><p className="mt-0.5 text-xs text-white/65">DeepSeek 翻译 · ElevenLabs 配音</p></div>
        {phase !== "idle" && <button onClick={handleReset} className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-all">+ 新建</button>}
      </header>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ===== LEFT (3 cols) ===== */}
        <div className="space-y-4 lg:col-span-3">
          {/* 输入区 */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <ScriptInput onGenerate={handleTranslate} isGenerating={phase === "translating"} disabled={isLocked} />
            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 flex items-start gap-2">
                <span className="text-rose-400 shrink-0">⚠️</span>
                <p className="text-xs text-rose-600">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-500 text-xs">✕</button>
              </div>
            )}
            {phase === "translating" && (
              <div className="mt-3 rounded-xl border border-purple-200/40 p-3" style={{ background: "linear-gradient(135deg, #ede5f8 0%, #e8e0f5 100%)" }}>
                <div className="flex items-center gap-2.5"><div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-500" /><span className="text-sm text-purple-500 font-medium">并行生成 3 版翻译中...</span></div>
              </div>
            )}
          </section>

          {/* 翻译 Tabs */}
          {translations.length > 0 && (
            <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
              <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">📝 翻译结果</h2>
              {/* Tab 菜单 */}
              <div className="flex gap-1.5 mb-3">
                {translations.map((t, i) => {
                  const cols = [{ bg: "#f0eaf8", text: "#7b6aaa", border: "#b4a0d8" },{ bg: "#e8edf8", text: "#5b6e9a", border: "#98acd0" },{ bg: "#e8f5ee", text: "#5a8a6e", border: "#90c0a8" }][i];
                  const hasVoice = voiceMap.has(i);
                  return (
                    <button key={i} onClick={() => setActiveTransTab(i)} className="rounded-lg border px-3 py-1.5 text-left text-xs transition-all flex-1"
                      style={{ borderColor: i === activeTransTab ? cols.border : "#e5e7eb", background: i === activeTransTab ? cols.bg : "#fff", color: i === activeTransTab ? cols.text : "#9ca3af", fontWeight: i === activeTransTab ? 600 : 500 }}>
                      <div className="flex items-center gap-1">{t.label}{hasVoice && <span className="text-[10px]">🎤</span>}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{t.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* 当前 Tab 内容 */}
              {activeTrans && (
                <>
                  <div className="rounded-xl border p-3" style={{ borderColor: "#d0c4e8", background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)" }}>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{activeTrans.translatedText}</p>
                    <button onClick={async () => { try { await navigator.clipboard.writeText(activeTrans.translatedText); } catch { } }}
                      className="mt-2 text-[10px] text-gray-400 hover:text-purple-500 transition-colors">复制</button>
                  </div>

                  {/* 生成语音按钮（如果这个 tab 还没生成过） */}
                  {!voiceMap.has(activeTransTab) && voiceGenTab !== activeTransTab && (
                    <button onClick={() => handleGenerateVoices(activeTransTab)} disabled={selectedVoiceIds.size === 0 || isLocked}
                      className="w-full mt-3 h-10 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)", boxShadow: "0 2px 10px rgba(130,145,190,0.35)" }}>
                      🎤 生成语音 ({selectedVoiceIds.size} 个音色)
                    </button>
                  )}

                  {/* 生成中 */}
                  {isGeneratingForTab && (
                    <div className="mt-3 rounded-xl border border-violet-200/40 p-3" style={{ background: "linear-gradient(135deg, #ede5f8 0%, #f8e0ee 100%)" }}>
                      <div className="flex items-center gap-2.5"><div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-500" /><span className="text-sm text-violet-500 font-medium">并行生成 {selectedVoiceIds.size} 个音色...</span></div>
                    </div>
                  )}

                  {/* 语音结果 — 嵌套在 tab 内 */}
                  {activeVoices.length > 0 && (
                    <div className="mt-3 space-y-3">
                      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">🎤 语音预览</h3>
                      {activeVoices.map((v, i) => (
                        <details key={v.voiceId} open={i === 0} className="group">
                          <summary className="cursor-pointer text-xs text-gray-500 hover:text-purple-500 transition-colors py-1">
                            🎤 {v.voiceName} <span className="text-gray-350 text-[10px] ml-1">{v.durationMs > 0 ? `${(v.durationMs/1000).toFixed(0)}s` : ""}</span>
                          </summary>
                          <div className="mt-1.5">
                            <WaveformPlayer audioUrl={v.audioUrl} voiceName={v.voiceName}
                              onDownload={() => { const a = document.createElement("a"); a.href = v.audioUrl; a.download = `voice-${v.voiceName}.mp3`; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} />
                          </div>
                        </details>
                      ))}
                      {/* 为当前 tab 重新生成 */}
                      <button onClick={() => handleGenerateVoices(activeTransTab)} disabled={isLocked}
                        className="text-[10px] text-gray-400 hover:text-purple-500 transition-colors disabled:opacity-50">🔄 重新生成语音</button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>

        {/* ===== RIGHT (2 cols) ===== */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <VoiceMultiSelect voices={VOICES} selectedIds={selectedVoiceIds} onToggle={handleToggleVoice}
              onSelectAll={() => setSelectedVoiceIds(new Set(VOICES.map(v => v.voiceId)))}
              onDeselectAll={() => setSelectedVoiceIds(new Set())} disabled={isLocked} />
          </section>
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <HistoryPanel records={historyStore.records} isLoading={historyStore.isLoading}
              onSelect={(r: any) => {
                setSourceText(r.sourceText || "");
                const ts = (r.translations || [{ text: r.translatedText, style: r.translationStyle, label: r.translationStyle }])
                  .map((t: any) => ({ translatedText: t.text, style: t.style, label: t.label, description: "", tokensUsed: 0, costUsd: 0 }));
                setTranslations(ts); setActiveTransTab(0); setPhase("translated");
                if (r.voiceResults?.length) {
                  const m = new Map<number, VoiceItem[]>();
                  m.set(0, r.voiceResults.map((v: any) => ({ voiceId: "", voiceName: v.voiceName, audioUrl: v.audioUrl, durationMs: v.durationMs })));
                  setVoiceMap(m);
                }
              }}
              onDelete={(id: string) => historyStore.deleteItem(id)}
              onSearch={(q: string) => historyStore.loadHistory(q)} />
          </section>
        </div>
      </div>

      <footer className="mt-8 pb-6 text-center">
        <p className="text-xs text-purple-300/80">Powered by <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-500 transition-colors">DeepSeek</a> + <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-500 transition-colors">ElevenLabs</a></p>
      </footer>
    </div>
  );
}
