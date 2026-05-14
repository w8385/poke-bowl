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
          poke-bowl은 비공식 팬 프로젝트다. 포켓몬/볼 관련 사실 데이터와 취향 추천 데이터를 분리해서 다룬다.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">데이터 소스 역할</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <li><strong>PokeAPI</strong>: 구조화 기초 데이터 기본축</li>
          <li><strong>Serebii</strong>: 볼/입수 가능 여부 1차 검증</li>
          <li><strong>Pokémon Database</strong>: 사람이 읽는 사실 보조 검증</li>
          <li><strong>Bulbapedia</strong>: 예외 케이스 보조 참고</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">투표 기준</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <li>투표는 사실 검증이 아니라 추천 후보군에 대한 선호도 수집이다.</li>
          <li>익명 사용자는 조회만 가능하고, Google 로그인 후에만 투표할 수 있다.</li>
          <li>중복 투표는 `pokemon_slug + ball_key + user_email` 기준으로 막는다.</li>
        </ul>
      </section>
    </main>
  );
}
