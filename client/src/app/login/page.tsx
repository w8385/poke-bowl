import Link from 'next/link';

import { authEnabled, signIn } from '@/auth';

export const metadata = {
  title: '로그인 | Poké Bowl',
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Google 로그인</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          투표는 Google 계정 로그인 후 가능하다. MVP에서는 사용자 이메일 기준으로 중복 투표를 막는다.
        </p>
      </header>

      <form
        action={async () => {
          'use server';
          if (!authEnabled) return;
          await signIn('google', { redirectTo: '/pokemon' });
        }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <button
          type="submit"
          disabled={!authEnabled}
          className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
        >
          {authEnabled ? 'Google로 로그인' : 'Google OAuth 설정 필요'}
        </button>
      </form>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900/90 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100/90">
        <p>운영 메모</p>
        <ul className="mt-2 list-disc pl-5">
          <li>실배포 전에는 Google OAuth 승인된 redirect URL 설정이 필요하다.</li>
          <li>DATABASE_URL과 AUTH_SECRET 없이는 투표 저장이 동작하지 않는다.</li>
        </ul>
      </section>
    </main>
  );
}
