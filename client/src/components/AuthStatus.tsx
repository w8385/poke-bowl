import Link from 'next/link';

import { auth, signOut } from '@/auth';

export async function AuthStatus() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <Link href="/login" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
        Google 로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
      <span className="hidden sm:inline">{session.user.email}</span>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
      >
        <button type="submit" className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          로그아웃
        </button>
      </form>
    </div>
  );
}
