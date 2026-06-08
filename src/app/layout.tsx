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
    "输入中文口播文案，AI 自动翻译为自然流畅的英文，并生成真人感语音。面向短视频运营人员的 AI 配音工具。",
  keywords: [
    "AI 配音",
    "英文口播",
    "TikTok 配音",
    "DeepSeek 翻译",
    "ElevenLabs TTS",
    "短视频工具",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="light">
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-b from-purple-50/30 via-white to-white text-gray-800 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
