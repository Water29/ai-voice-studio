"use client";

// ============================================
// 主页面 — AI Voice Studio
// ============================================

import { useState, useCallback, useEffect } from "react";
import { ScriptInput } from "@/components/ScriptInput";
import { TranslationResult } from "@/components/TranslationResult";
import { VoicePlayer } from "@/components/VoicePlayer";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoice } from "@/hooks/useVoice";
import { useHistory } from "@/hooks/useHistory";
import type {
  TranslationStyle,
  HistoryRecord,
  TranslateResponse,
  TTSResponse,
} from "@/types";

type WorkflowState = "idle" | "translating" | "generating" | "done";

export default function Home() {
  const translation = useTranslation();
  const voice = useVoice();
  const historyStore = useHistory();

  const [workflowState, setWorkflowState] = useState<WorkflowState>("idle");
  const [sourceText, setSourceText] = useState("");
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [translationResult, setTranslationResult] =
    useState<TranslateResponse | null>(null);
  const [ttsResult, setTTSResult] = useState<TTSResponse | null>(null);

  useEffect(() => {
    voice.loadVoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(
    async (text: string, style: TranslationStyle) => {
      setSourceText(text);
      setWorkflowState("translating");
      setTranslationResult(null);
      setTTSResult(null);

      const translateResult = await translation.translate(text, style);
      if (!translateResult) {
        setWorkflowState("idle");
        return;
      }
      setTranslationResult(translateResult);

      setWorkflowState("generating");
      const selectedVoiceId =
        voice.selectedVoice?.voiceId ?? "pNInz6obpgDQGcFmaJgB";

      const ttsResult = await voice.generate(
        translateResult.translatedText,
        selectedVoiceId
      );
      if (ttsResult) setTTSResult(ttsResult);
      setWorkflowState("done");

      const recordId = `rec_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const record: HistoryRecord = {
        id: recordId,
        sourceText: text,
        translatedText: translateResult.translatedText,
        translationStyle: style,
        audioUrl: ttsResult?.audioUrl ?? null,
        voiceName: ttsResult?.voiceName ?? voice.selectedVoice?.name ?? null,
        voiceId: selectedVoiceId,
        durationMs: ttsResult?.durationMs ?? null,
        costUsd:
          (translateResult.costUsd ?? 0) + (ttsResult?.costUsd ?? 0),
        createdAt: new Date().toISOString(),
      };

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        setCurrentRecordId(recordId);
        historyStore.refresh();
      } catch {
        console.warn("保存历史记录失败");
      }
    },
    [translation, voice, historyStore]
  );

  const handleSelectHistory = useCallback(
    (record: HistoryRecord) => {
      setSourceText(record.sourceText);
      translation.reset();
      voice.reset();
      setTranslationResult({
        translatedText: record.translatedText,
        style: record.translationStyle,
        tokensUsed: 0,
        costUsd: 0,
      });
      if (record.audioUrl) {
        setTTSResult({
          audioUrl: record.audioUrl,
          durationMs: record.durationMs ?? 0,
          voiceName: record.voiceName ?? "",
          costUsd: 0,
        });
      }
      setWorkflowState("done");
      setCurrentRecordId(record.id);
    },
    [translation, voice]
  );

  const handleDeleteHistory = useCallback(
    async (id: string) => {
      const success = await historyStore.deleteItem(id);
      if (success && id === currentRecordId) handleReset();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyStore, currentRecordId]
  );

  const handleSearchHistory = useCallback(
    (query: string) => historyStore.loadHistory(query),
    [historyStore]
  );

  const handleReset = useCallback(() => {
    setSourceText("");
    setTranslationResult(null);
    setTTSResult(null);
    setWorkflowState("idle");
    setCurrentRecordId(null);
    translation.reset();
    voice.reset();
  }, [translation, voice]);

  const handleDownload = useCallback(() => {
    if (ttsResult?.audioUrl) {
      const link = document.createElement("a");
      link.href = ttsResult.audioUrl;
      link.download = `ai-voice-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [ttsResult]);

  const isProcessing =
    workflowState === "translating" || workflowState === "generating";

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-3 py-3 sm:px-5 sm:py-4">
      {/* ======== Header ======== */}
      <header className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-600 via-violet-500 to-pink-500 px-5 py-4 text-white shadow-lg shadow-purple-200/50">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            🎙️ AI Voice Studio
          </h1>
          <p className="mt-0.5 text-xs text-white/70">
            DeepSeek 翻译 · ElevenLabs 配音 · 英文口播一键生成
          </p>
        </div>
        {workflowState !== "idle" && (
          <button
            onClick={handleReset}
            className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 backdrop-blur-sm transition-all"
          >
            + 新建
          </button>
        )}
      </header>

      {/* ======== Main Content ======== */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ---- Left ---- */}
        <div className="space-y-3 lg:col-span-2">
          {/* Step 1: 输入 */}
          <section className="rounded-2xl border border-purple-100/60 bg-white shadow-sm p-4">
            <ScriptInput
              onGenerate={handleGenerate}
              isGenerating={isProcessing}
            />
          </section>

          {/* Step 2 & 3: 结果区 */}
          <div className="min-h-[160px] space-y-3">
            {workflowState === "translating" && (
              <section className="rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
                  <span className="text-sm text-purple-600 font-medium">
                    DeepSeek 翻译中...
                  </span>
                </div>
              </section>
            )}

            {workflowState === "generating" && translationResult && (
              <section className="rounded-2xl border border-purple-100/60 bg-white shadow-sm p-4">
                <h2 className="mb-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  英文翻译
                </h2>
                <TranslationResult
                  translatedText={translationResult.translatedText}
                  style={translationResult.style}
                  costUsd={translationResult.costUsd}
                />
              </section>
            )}

            {workflowState === "generating" && (
              <section className="rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
                  <span className="text-sm text-violet-600 font-medium">
                    ElevenLabs 语音生成中...
                  </span>
                </div>
              </section>
            )}

            {translationResult && workflowState === "done" && (
              <section className="rounded-2xl border border-purple-100/60 bg-white shadow-sm p-4">
                <h2 className="mb-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  英文翻译
                </h2>
                <TranslationResult
                  translatedText={translationResult.translatedText}
                  style={translationResult.style}
                  costUsd={translationResult.costUsd}
                  onRegenerate={() =>
                    handleGenerate(sourceText, translationResult.style)
                  }
                />
              </section>
            )}

            {ttsResult && workflowState === "done" && (
              <section className="rounded-2xl border border-purple-100/60 bg-white shadow-sm p-4">
                <h2 className="mb-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  语音预览
                </h2>
                <VoicePlayer
                  audioUrl={ttsResult.audioUrl}
                  voiceName={ttsResult.voiceName}
                  durationMs={ttsResult.durationMs}
                  onDownload={handleDownload}
                />
              </section>
            )}

            {workflowState === "idle" && (
              <div className="rounded-xl border border-dashed border-purple-200/60 bg-gradient-to-b from-purple-50/30 to-pink-50/20 p-6 text-center">
                <p className="text-sm text-purple-300">
                  输入中文文案，选择风格，开始生成 ✨
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Right: History ---- */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-purple-100/60 bg-white shadow-sm p-4 lg:sticky lg:top-4">
            <HistoryPanel
              records={historyStore.records}
              isLoading={historyStore.isLoading}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
              onSearch={handleSearchHistory}
            />
          </div>
        </aside>
      </div>

      {/* ======== Footer ======== */}
      <footer className="mt-6 pb-4 text-center">
        <p className="text-xs text-gray-300">
          Powered by{" "}
          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-500 transition-colors"
          >
            DeepSeek
          </a>{" "}
          +{" "}
          <a
            href="https://elevenlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-500 transition-colors"
          >
            ElevenLabs
          </a>
        </p>
      </footer>
    </div>
  );
}
