// ============================================
// Root Layout — AI Voice Studio
// ============================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Voice Studio — AI 英文口播生成工具",
  description:
    "输入中文口播文案，AI 自动翻译为自然流畅的英文，并生成真人感语音。",
  keywords: ["AI 配音", "英文口播", "DeepSeek 翻译", "ElevenLabs TTS"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="light">
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-br from-purple-50/40 via-white to-pink-50/30 text-gray-800 antialiased`}
      >
        {/* 顶部装饰条 */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-400 to-pink-500" />
        {children}
      </body>
    </html>
  );
}
