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
  // ============================================
  // Hooks
  // ============================================
  const translation = useTranslation();
  const voice = useVoice();
  const historyStore = useHistory();

  // ============================================
  // Local State
  // ============================================
  const [workflowState, setWorkflowState] = useState<WorkflowState>("idle");
  const [sourceText, setSourceText] = useState("");
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [translationResult, setTranslationResult] =
    useState<TranslateResponse | null>(null);
  const [ttsResult, setTTSResult] = useState<TTSResponse | null>(null);

  // 加载音色列表
  useEffect(() => {
    voice.loadVoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // Handlers
  // ============================================

  /** 核心流程：输入中文 → 翻译 → TTS → 保存历史 */
  const handleGenerate = useCallback(
    async (text: string, style: TranslationStyle) => {
      setSourceText(text);
      setWorkflowState("translating");

      // Step 1: 翻译
      const translateResult = await translation.translate(text, style);
      if (!translateResult) {
        setWorkflowState("idle");
        return;
      }
      setTranslationResult(translateResult);

      // Step 2: TTS
      setWorkflowState("generating");
      const selectedVoiceId =
        voice.selectedVoice?.voiceId ??
        "pNInz6obpgDQGcFmaJgB"; // 默认 Adam

      const ttsResult = await voice.generate(
        translateResult.translatedText,
        selectedVoiceId
      );

      if (ttsResult) {
        setTTSResult(ttsResult);
      }
      setWorkflowState("done");

      // Step 3: 保存到历史（通过 API Route）
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

  /** 从历史记录加载 */
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

  /** 删��历史记录 */
  const handleDeleteHistory = useCallback(
    async (id: string) => {
      const success = await historyStore.deleteItem(id);
      if (success && id === currentRecordId) {
        handleReset();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyStore, currentRecordId]
  );

  /** 搜索历史 */
  const handleSearchHistory = useCallback(
    (query: string) => {
      historyStore.loadHistory(query);
    },
    [historyStore]
  );

  /** 重置 */
  const handleReset = useCallback(() => {
    setSourceText("");
    setTranslationResult(null);
    setTTSResult(null);
    setWorkflowState("idle");
    setCurrentRecordId(null);
    translation.reset();
    voice.reset();
  }, [translation, voice]);

  /** 下载音频 */
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

  // ============================================
  // Render
  // ============================================
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ======== Header ======== */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            AI Voice Studio
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            AI 英文口播生成 · DeepSeek 翻译 · ElevenLabs 配音
          </p>
        </div>
        {workflowState !== "idle" && (
          <button
            onClick={handleReset}
            className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            + 新建
          </button>
        )}
      </header>

      {/* ======== Main Content ======== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---- Left: Workflow (2 cols on desktop) ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1: Input */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <ScriptInput
              onGenerate={handleGenerate}
              isGenerating={
                workflowState === "translating" ||
                workflowState === "generating"
              }
            />
          </section>

          {/* Step 2: Translation Result */}
          {translationResult && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-400">
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

          {/* Step 3: Voice Player */}
          {ttsResult && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-400">
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

          {/* Loading state: translating */}
          {workflowState === "translating" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
              <p className="mt-4 text-sm text-zinc-500">
                正在用 DeepSeek 翻译...
              </p>
            </div>
          )}

          {/* Loading state: generating TTS */}
          {workflowState === "generating" && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
              <p className="mt-4 text-sm text-zinc-500">
                正在用 ElevenLabs 生成语音...
              </p>
            </div>
          )}
        </div>

        {/* ---- Right: History Panel ---- */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 lg:sticky lg:top-6">
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
      <footer className="mt-12 pb-6 text-center">
        <p className="text-xs text-zinc-600">
          Powered by{" "}
          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
          >
            DeepSeek
          </a>{" "}
          +{" "}
          <a
            href="https://elevenlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
          >
            ElevenLabs
          </a>
        </p>
      </footer>
    </div>
  );
}
