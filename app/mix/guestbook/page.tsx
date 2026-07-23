import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GuestbookPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type VisitorCardRow = {
  id: string;
  user_text: string;
  artwork_id: number;
  storage_url: string;
  created_at: string;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function getGuestbookKey() {
  return process.env.MIX_GUESTBOOK_KEY ?? process.env.VISITOR_CARDS_ACCESS_KEY ?? "";
}

function LockedView({ invalid = false }: { invalid?: boolean }) {
  return (
    <div className="px-4 py-5 text-[var(--text-main)]">
      <section className="rounded-[24px] border border-[var(--border-color)] bg-white px-5 py-6 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] font-bold text-[var(--text-muted)]">작가 전용</p>
        <h1 className="mt-1 text-[22px] font-black text-[#175138]">방명록 갤러리</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
          저장된 작품 이미지를 보려면 작가용 접근 키를 입력해 주세요.
        </p>

        <form action="/mix/guestbook" className="mt-5 space-y-3">
          <input
            type="password"
            name="key"
            autoComplete="current-password"
            placeholder="접근 키"
            className="h-12 w-full rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-card-inner)] px-4 text-[14px] font-bold outline-none focus:border-[#175138]"
          />
          {invalid ? (
            <p className="text-[12px] font-bold text-red-600">접근 키가 맞지 않습니다.</p>
          ) : null}
          <button
            type="submit"
            className="h-12 w-full rounded-[24px] bg-[#175138] text-[14px] font-black text-white active:scale-[0.98]"
            style={{ color: "#ffffff" }}
          >
            열기
          </button>
        </form>
      </section>
    </div>
  );
}

function SetupRequiredView() {
  return (
    <div className="px-4 py-5 text-[var(--text-main)]">
      <section className="rounded-[24px] border border-[var(--border-color)] bg-white px-5 py-6 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] font-bold text-[var(--text-muted)]">설정 필요</p>
        <h1 className="mt-1 text-[22px] font-black text-[#175138]">작가용 키가 없습니다</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">
          Vercel 환경변수에 <span className="font-black text-[var(--text-main)]">MIX_GUESTBOOK_KEY</span>를 추가한 뒤
          재배포하면 이 페이지를 사용할 수 있습니다.
        </p>
      </section>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="px-4 py-5 text-[var(--text-main)]">
      <section className="rounded-[24px] border border-[var(--border-color)] bg-white px-5 py-6 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] font-bold text-[var(--text-muted)]">불러오기 실패</p>
        <h1 className="mt-1 text-[22px] font-black text-[#175138]">이미지를 볼 수 없습니다</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-muted)]">{message}</p>
      </section>
    </div>
  );
}

export default async function MixGuestbookPage({ searchParams }: GuestbookPageProps) {
  const params = searchParams ? await searchParams : {};
  const configuredKey = getGuestbookKey();
  const givenKey = getSingleParam(params.key);

  if (!configuredKey) {
    return <SetupRequiredView />;
  }

  if (givenKey !== configuredKey) {
    return <LockedView invalid={Boolean(givenKey)} />;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return <ErrorView message="Supabase 환경변수가 설정되어 있지 않습니다." />;
  }

  const { data, error } = await supabase
    .from("visitor_cards")
    .select("id,user_text,artwork_id,storage_url,created_at")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<VisitorCardRow[]>();

  if (error) {
    return <ErrorView message="Supabase에서 방명록 데이터를 불러오지 못했습니다." />;
  }

  const cards = data ?? [];

  return (
    <div className="px-4 py-5 pb-8 text-[var(--text-main)]">
      <header className="mb-4 rounded-[24px] border border-[var(--border-color)] bg-white px-5 py-5 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] font-bold text-[var(--text-muted)]">작가 전용</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-black text-[#175138]">방명록 갤러리</h1>
            <p className="mt-1 text-[12px] font-bold text-[var(--text-muted)]">
              최근 저장 이미지 {cards.length}개
            </p>
          </div>
          <Link
            href="/mix/edit"
            className="shrink-0 rounded-full border border-[var(--border-color)] bg-[var(--bg-card-inner)] px-3 py-2 text-[12px] font-black text-[#175138]"
          >
            만들기
          </Link>
        </div>
      </header>

      {cards.length === 0 ? (
        <section className="rounded-[24px] border border-[var(--border-color)] bg-white px-5 py-8 text-center shadow-[var(--shadow-sm)]">
          <p className="text-[14px] font-black text-[#175138]">아직 전송된 이미지가 없습니다.</p>
          <p className="mt-2 text-[12px] font-bold text-[var(--text-muted)]">
            사용자가 작가에게 보내기를 누르면 여기에 쌓입니다.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.id}
              className="overflow-hidden rounded-[18px] border border-[var(--border-color)] bg-white shadow-[var(--shadow-sm)]"
            >
              <a href={card.storage_url} target="_blank" rel="noreferrer" className="block bg-[var(--bg-card-inner)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.storage_url}
                  alt={`${card.user_text} 작품 이미지`}
                  className="aspect-[3/4] h-auto w-full object-cover"
                  loading="lazy"
                />
              </a>
              <div className="space-y-1 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-black text-[#175138]">{card.user_text}</p>
                  <p className="shrink-0 rounded-full bg-[var(--bg-card-inner)] px-2 py-1 text-[10px] font-black text-[var(--text-muted)]">
                    #{card.artwork_id}
                  </p>
                </div>
                <p className="text-[10px] font-bold leading-tight text-[var(--text-muted)]">{formatDate(card.created_at)}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
