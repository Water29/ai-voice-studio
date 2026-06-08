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
            radial-gradient(ellipse 80% 60% at 50% -10%, #ede9fe 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 90% 80%, #fce7f3 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 10% 40%, #e0e7ff 0%, transparent 50%),
            linear-gradient(180deg, #f5f3ff 0%, #fff5f9 30%, #faf5ff 60%, #f5f3ff 100%)
          `,
          backgroundAttachment: "fixed",
        }}
      >
        <div className="h-0.5 bg-gradient-to-r from-purple-300 via-violet-200 to-pink-300" />
        {children}
      </body>
    </html>
  );
}
