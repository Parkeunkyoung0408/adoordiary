-- ============================================================
-- Supabase: roulette_words 테이블 생성 가이드
-- ============================================================
-- 1) Supabase Dashboard → SQL Editor → New query
-- 2) 아래 SQL 전체 실행
-- 3) roulette_words.seed.sql 도 이어서 실행 (4word.ini 376개 시드)
-- 4) Project Settings → API 에서 URL / anon key 복사
-- 5) .env.local 에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
-- ============================================================

create table if not exists public.roulette_words (
  id bigint generated always as identity primary key,
  word text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint roulette_words_word_length_check check (char_length(word) = 4),
  constraint roulette_words_word_unique unique (word)
);

create index if not exists roulette_words_is_active_idx
  on public.roulette_words (is_active)
  where is_active = true;

comment on table public.roulette_words is '4글자 룰렛 단어 목록';
comment on column public.roulette_words.word is '정확히 4글자(한글/영문/숫자)';

alter table public.roulette_words enable row level security;

drop policy if exists "Allow public read active roulette words" on public.roulette_words;
create policy "Allow public read active roulette words"
  on public.roulette_words
  for select
  to anon, authenticated
  using (is_active = true);

-- (선택) 관리자만 insert/update/delete 하려면 service_role 또는 authenticated 정책 추가
