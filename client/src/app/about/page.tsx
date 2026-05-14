import Link from 'next/link';

export const metadata = {
  title: 'About | Poké Bowl',
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10 dark:text-zinc-100">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          ← 홈으로
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">프로젝트 기준</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          poke-bowl은 비공식 팬 프로젝트다. 기본 볼 추천은 시트 기반 큐레이션으로 쌓고, 투표는 취향 데이터를 덧붙이는 방식으로 운영한다.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">데이터 소스 역할</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <li><strong>Google Sheet</strong>: 기본 볼 추천 원본</li>
          <li><strong>PokeAPI</strong>: 도감 번호, 이름, 타입, 스프라이트 같은 구조화 기초 데이터</li>
          <li><strong>투표 데이터</strong>: 유저 선호와 대표 추천 흐름 누적</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">투표 기준</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <li>투표는 추천 후보군에 대한 선호도 수집이다.</li>
          <li>익명 사용자는 조회만 가능하고, Google 로그인 후에만 투표할 수 있다.</li>
          <li>중복 투표는 `pokemon_slug + ball_key + user_email` 기준으로 막는다.</li>
        </ul>
      </section>
    </main>
  );
}
