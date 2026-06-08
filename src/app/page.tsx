"use client";

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
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ======== Header ======== */}
      <header
        className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4 text-white shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, #b4a5e8 0%, #9baddb 30%, #a8c5e8 60%, #c9b8e8 100%)",
        }}
      >
        <div>
          <h1 className="text-lg font-bold tracking-tight drop-shadow-sm">
            🎙️ AI Voice Studio
          </h1>
          <p className="mt-0.5 text-xs text-white/65">
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

      {/* ======== Main ======== */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* 输入卡片 */}
          <section className="rounded-2xl border border-purple-100/50 bg-white/70 shadow-sm p-5">
            <ScriptInput
              onGenerate={handleGenerate}
              isGenerating={isProcessing}
            />
          </section>

          {/* 结果区域 */}
          <div className="min-h-[140px] space-y-4">
            {/* 翻译中 */}
            {workflowState === "translating" && (
              <div
                className="rounded-xl border border-purple-100/40 p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-400" />
                  <span className="text-sm text-purple-400/80 font-medium">
                    DeepSeek 翻译中...
                  </span>
                </div>
              </div>
            )}

            {/* 翻译结果 */}
            {(workflowState === "generating" ||
              workflowState === "done") &&
              translationResult && (
                <section className="rounded-2xl border border-purple-100/50 bg-white/70 shadow-sm p-5">
                  <h2 className="mb-2 text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
                    英文翻译
                  </h2>
                  <TranslationResult
                    translatedText={translationResult.translatedText}
                    style={translationResult.style}
                    costUsd={translationResult.costUsd}
                    onRegenerate={
                      workflowState === "done"
                        ? () =>
                            handleGenerate(
                              sourceText,
                              translationResult.style
                            )
                        : undefined
                    }
                  />
                </section>
              )}

            {/* 语音生成中 */}
            {workflowState === "generating" && (
              <div
                className="rounded-xl border border-violet-100/40 p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-400" />
                  <span className="text-sm text-violet-400/80 font-medium">
                    ElevenLabs 语音生成中...
                  </span>
                </div>
              </div>
            )}

            {/* 语音结果 */}
            {ttsResult && workflowState === "done" && (
              <section className="rounded-2xl border border-purple-100/50 bg-white/70 shadow-sm p-5">
                <h2 className="mb-2 text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
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

            {/* 空闲 */}
            {workflowState === "idle" && (
              <div
                className="rounded-xl border border-dashed border-purple-200/40 p-8 text-center"
                style={{
                  background:
                    "linear-gradient(180deg, #faf5ff 0%, #fdf2f8 100%)",
                }}
              >
                <p className="text-sm text-purple-300/70">
                  输入中文文案，选择翻译风格，开始生成 ✨
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 历史 */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-purple-100/50 bg-white/70 shadow-sm p-5 lg:sticky lg:top-6">
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

      <footer className="mt-8 pb-6 text-center">
        <p className="text-xs text-purple-200/70">
          Powered by{" "}
          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-purple-400 transition-colors"
          >
            DeepSeek
          </a>{" "}
          +{" "}
          <a
            href="https://elevenlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-purple-400 transition-colors"
          >
            ElevenLabs
          </a>
        </p>
      </footer>
    </div>
  );
}
