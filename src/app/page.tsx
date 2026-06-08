"use client";

// ============================================
// 主页面 — AI Voice Studio（浅紫色主题）
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
      // 先清空旧结果，避免旧的 VoicePlayer 在新音频加载时闪烁
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

      if (ttsResult) {
        setTTSResult(ttsResult);
      }
      setWorkflowState("done");

      // 保存历史
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
      if (success && id === currentRecordId) {
        handleReset();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyStore, currentRecordId]
  );

  const handleSearchHistory = useCallback(
    (query: string) => {
      historyStore.loadHistory(query);
    },
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

  // ============================================
  // Render
  // ============================================
  const isProcessing =
    workflowState === "translating" || workflowState === "generating";

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ======== Header ======== */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">
            🎙️ AI Voice Studio
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            DeepSeek 翻译 · ElevenLabs 配音 · AI 英文口播生成
          </p>
        </div>
        {workflowState !== "idle" && (
          <button
            onClick={handleReset}
            className="rounded-xl px-4 py-1.5 text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            + 新建
          </button>
        )}
      </header>

      {/* ======== Main Content ======== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---- Left: 工作流区 ---- */}
        <div className="space-y-4 lg:col-span-2">
          {/* Step 1: 输入区 — 始终固定 */}
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <ScriptInput
              onGenerate={handleGenerate}
              isGenerating={isProcessing}
            />
          </section>

          {/* Step 2 & 3: 结果区 — 固定高度容器，防止布局抖动 */}
          <div className="min-h-[200px] space-y-4">
            {/* Loading: 翻译中 */}
            {workflowState === "translating" && (
              <section className="rounded-2xl border border-purple-100 bg-white shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
                  <span className="text-sm text-gray-500">
                    正在用 DeepSeek 翻译...
                  </span>
                </div>
              </section>
            )}

            {/* Loading: 语音生成中 */}
            {workflowState === "generating" && (
              <>
                {/* 翻译结果已经可以展示 */}
                {translationResult && (
                  <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                    <h2 className="mb-3 text-sm font-semibold text-gray-400">
                      英文翻译
                    </h2>
                    <TranslationResult
                      translatedText={translationResult.translatedText}
                      style={translationResult.style}
                      costUsd={translationResult.costUsd}
                    />
                  </section>
                )}
                <section className="rounded-2xl border border-purple-100 bg-white shadow-sm p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500" />
                    <span className="text-sm text-gray-500">
                      正在用 ElevenLabs 生成语音...
                    </span>
                  </div>
                </section>
              </>
            )}

            {/* Done: 翻译结果 */}
            {translationResult && workflowState !== "generating" && (
              <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-400">
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

            {/* Done: 语音预览 */}
            {ttsResult && workflowState === "done" && (
              <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-400">
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

            {/* Idle 占位：防止页面在初始状态时过于空洞 */}
            {workflowState === "idle" && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
                <p className="text-sm text-gray-400">
                  输入中文文案，选择翻译风格，开始生成 ✨
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Right: 历史记录 ---- */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 lg:sticky lg:top-6">
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
      <footer className="mt-10 pb-6 text-center">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-600 transition-colors underline underline-offset-2"
          >
            DeepSeek
          </a>{" "}
          +{" "}
          <a
            href="https://elevenlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-600 transition-colors underline underline-offset-2"
          >
            ElevenLabs
          </a>
        </p>
      </footer>
    </div>
  );
}
