"use client";

import { useState, useCallback, useEffect } from "react";
import { ScriptInput } from "@/components/ScriptInput";
import { TranslationVersions } from "@/components/TranslationVersions";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { VoiceMultiSelect } from "@/components/VoiceMultiSelect";
import { CostDisplay } from "@/components/CostDisplay";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useHistory } from "@/hooks/useHistory";
import { calculateCosts } from "@/lib/cost";
import type { TTSResponse, CostBreakdown, Voice } from "@/types";

interface TransVersion {
  translatedText: string; style: string; tokensUsed: number; costUsd: number;
  description: string; label: string;
}

interface VoiceResult { voiceId: string; voiceName: string; audioUrl: string; durationMs: number; _error?: string; }

// 预置音色
const VOICES: Voice[] = [
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", label: "Adam — Deep American Male", category: "male", description: "深沉美式男声，适合广告促销" },
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", label: "Rachel — Warm American Female", category: "female", description: "温暖美国女声，适合旁白教程" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Bella", label: "Bella — Young American Female", category: "female", description: "年轻活泼，适合TikTok社媒" },
  { voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", label: "Sam — Calm American Male", category: "male", description: "沉稳平静，适合企业介绍" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", label: "Domi — Energetic Female", category: "female", description: "高能量女声，适合促销导购" },
  { voiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Emily", label: "Emily — Soft American Female", category: "female", description: "温柔亲切，适合生活类内容" },
];

export default function Home() {
  const historyStore = useHistory();

  // 流程状态
  const [step, setStep] = useState<"input" | "translated" | "voiced">("input");
  const [isProcessing, setIsProcessing] = useState(false);

  // 翻译结果
  const [sourceText, setSourceText] = useState("");
  const [versions, setVersions] = useState<TransVersion[]>([]);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);

  // 音色
  const [selectedVoiceIds, setSelectedVoiceIds] = useState<Set<string>>(new Set(["pNInz6obpgDQGcFmaJgB"]));
  const [voiceResults, setVoiceResults] = useState<VoiceResult[]>([]);

  // 成本
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);

  useEffect(() => { historyStore.loadHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============ 翻译流程 ============
  const handleTranslate = useCallback(async (text: string) => {
    setSourceText(text);
    setStep("input");
    setIsProcessing(true);
    setVoiceResults([]);
    setCostBreakdown(null);

    try {
      const res = await fetch("/api/translate/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && data.translations) {
        setVersions(data.translations);
        setStep("translated");
      }
    } catch { /* error handled by UI */ }
    finally { setIsProcessing(false); }
  }, []);

  // 重新翻译单个版本
  const handleRegenerate = useCallback(async (index: number) => {
    const v = versions[index];
    if (!v || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, style: v.style }),
      });
      const data = await res.json();
      if (res.ok && data.translatedText) {
        setVersions(prev => prev.map((ver, i) =>
          i === index ? { ...ver, translatedText: data.translatedText, costUsd: data.costUsd } : ver
        ));
      }
    } catch { /* ignore */ }
    finally { setIsProcessing(false); }
  }, [versions, sourceText, isProcessing]);

  // ============ 语音生成 ============
  const handleGenerateVoices = useCallback(async () => {
    if (selectedVoiceIds.size === 0 || !versions[selectedVersionIdx]?.translatedText) return;
    setIsProcessing(true);
    const text = versions[selectedVersionIdx].translatedText;
    const ids = [...selectedVoiceIds];

    try {
      const res = await fetch("/api/tts/multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceIds: ids }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const results: VoiceResult[] = data.results.map((r: TTSResponse & { _error?: string }, i: number) => ({
          voiceId: ids[i],
          voiceName: r.voiceName,
          audioUrl: r.audioUrl,
          durationMs: r.durationMs,
          _error: r._error,
        }) as VoiceResult);
        setVoiceResults(results.filter(r => !r._error));
        setStep("voiced");

        // 成本
        const costs = calculateCosts(sourceText.length, text.length);
        setCostBreakdown(costs);

        // 保存历史
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: `rec_${Date.now()}`,
              sourceText, translatedText: text,
              translationStyle: versions[selectedVersionIdx].style,
              audioUrl: results[0]?.audioUrl ?? null,
              voiceName: results[0]?.voiceName ?? null,
              voiceId: ids[0],
              durationMs: results[0]?.durationMs ?? null,
              costUsd: costs.totalCost,
              createdAt: new Date().toISOString(),
            }),
          });
          historyStore.refresh();
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    finally { setIsProcessing(false); }
  }, [selectedVoiceIds, versions, selectedVersionIdx, sourceText, historyStore]);

  const handleToggleVoice = useCallback((id: string) => {
    setSelectedVoiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setStep("input"); setSourceText(""); setVersions([]);
    setVoiceResults([]); setCostBreakdown(null); setSelectedVersionIdx(0);
  }, []);

  const handleSelectHistory = useCallback((r: any) => {
    setSourceText(r.sourceText);
    setVersions([{
      translatedText: r.translatedText, style: r.translationStyle,
      tokensUsed: 0, costUsd: 0, label: r.translationStyle, description: ""
    }]);
    setStep("translated");
    if (r.audioUrl) {
      setVoiceResults([{ voiceId: r.voiceId, voiceName: r.voiceName, audioUrl: r.audioUrl, durationMs: r.durationMs }]);
      setStep("voiced");
    }
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between rounded-2xl px-5 py-3.5 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 35%, #90b0d8 65%, #b090c8 100%)" }}>
        <div>
          <h1 className="text-lg font-bold drop-shadow-sm">🎙️ AI Voice Studio</h1>
          <p className="mt-0.5 text-xs text-white/65">DeepSeek 翻译 · ElevenLabs 配音</p>
        </div>
        {step !== "input" && (
          <button onClick={handleReset} className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-all">
            + 新建
          </button>
        )}
      </header>

      {/* Main Layout: 2 columns */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* ===== Left: 翻译主区 (3 cols) ===== */}
        <div className="space-y-4 lg:col-span-3">
          {/* Input */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <ScriptInput onGenerate={handleTranslate} isGenerating={isProcessing && step === "input"} />
          </section>

          {/* Translation Versions */}
          {versions.length > 0 && (
            <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
              <TranslationVersions
                versions={versions}
                onRegenerate={handleRegenerate}
                isRegenerating={isProcessing}
              />
              {/* 选择使用的版本 */}
              {step === "translated" && (
                <div className="mt-4 pt-3 border-t border-purple-100">
                  <p className="text-[11px] text-gray-400 mb-2">选择用于语音生成的版本：</p>
                  <div className="flex gap-2">
                    {versions.filter(v => v.translatedText).map((v, i) => (
                      <button key={i} onClick={() => setSelectedVersionIdx(i)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                          selectedVersionIdx === i
                            ? "bg-purple-50 border-purple-300 text-purple-600 font-medium"
                            : "bg-white border-gray-200 text-gray-500 hover:border-purple-200"
                        }`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Voice Results — Waveform players */}
          {voiceResults.length > 0 && (
            <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
              <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                🎤 语音预览
              </h2>
              <div className="space-y-4">
                {voiceResults.map(r => (
                  <WaveformPlayer key={r.voiceId} audioUrl={r.audioUrl} voiceName={r.voiceName}
                    onDownload={() => {
                      const a = document.createElement("a");
                      a.href = r.audioUrl; a.download = `ai-voice-${r.voiceName}.mp3`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    }} />
                ))}
              </div>

              {/* 成本 */}
              {costBreakdown && (
                <div className="mt-4 pt-3 border-t border-purple-100">
                  <CostDisplay cost={{ ...costBreakdown, totalCost: costBreakdown.totalCost * voiceResults.length }} />
                </div>
              )}
            </section>
          )}
        </div>

        {/* ===== Right: 音色 + 历史 (2 cols) ===== */}
        <div className="space-y-4 lg:col-span-2">
          {/* Voice Multi-Select */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <VoiceMultiSelect
              voices={VOICES}
              selectedIds={selectedVoiceIds}
              onToggle={handleToggleVoice}
              onSelectAll={() => setSelectedVoiceIds(new Set(VOICES.map(v => v.voiceId)))}
              onDeselectAll={() => setSelectedVoiceIds(new Set())}
              onGenerate={handleGenerateVoices}
              isGenerating={isProcessing && step === "translated"}
              disabled={step === "input" || versions.length === 0}
            />
          </section>

          {/* History */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <HistoryPanel
              records={historyStore.records} isLoading={historyStore.isLoading}
              onSelect={handleSelectHistory}
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
