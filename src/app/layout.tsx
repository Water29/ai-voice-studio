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
        className={`${inter.className} min-h-screen antialiased`}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -15%, #e0d5f5 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 85% 75%, #f5d8e5 0%, transparent 55%),
            radial-gradient(ellipse 45% 35% at 10% 35%, #d5dff5 0%, transparent 55%),
            linear-gradient(180deg, #ede5f8 0%, #faf0f5 25%, #f5effa 55%, #ede5f8 100%)
          `,
          backgroundAttachment: "fixed",
        }}
      >
        <div className="h-0.5 bg-gradient-to-r from-purple-400 via-violet-300 to-pink-400" />
        {children}
      </body>
    </html>
  );
}
