import type { Metadata } from "next";
import Link from 'next/link';
import { Geist, Geist_Mono } from "next/font/google";

import { AuthStatus } from '@/components/AuthStatus';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Poké Bowl',
  description: '포켓몬별 볼맞춤 추천을 위한 비공식 팬 프로젝트',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
            <div className="flex items-center gap-5">
              <Link href="/" className="text-sm font-semibold tracking-[0.15em] text-zinc-900 dark:text-zinc-100">
                POKÉ BOWL
              </Link>
              <nav className="hidden items-center gap-4 md:flex">
                <Link href="/stats" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">통계</Link>
                <Link href="/pokemon" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">도감</Link>
                <Link href="/play" className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">미니게임</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <AuthStatus />
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
