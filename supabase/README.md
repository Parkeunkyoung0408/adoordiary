# Supabase 4글자 룰렛 연동 가이드

## 1. 테이블 생성

Supabase Dashboard → **SQL Editor** → New query

1. `supabase/roulette_words.sql` 실행 (테이블 + RLS)
2. `supabase/roulette_words.seed.sql` 실행 (`4word.ini` 기준 **376개** 단어 시드)

### 테이블 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | int8 (PK, identity) | 자동 증가 |
| `word` | text (NOT NULL, UNIQUE) | 4글자 (`char_length(word) = 4` CHECK) |
| `is_active` | boolean (default true) | 활성화 여부 |
| `created_at` | timestamptz (default now()) | 생성 시각 |

### 시드 재생성

`4word.ini` 수정 후:

```bash
node scripts/generate-roulette-seed.mjs
```

## 2. 환경 변수

Project Settings → **API** 에서 복사 후 `.env.local` 작성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`.env.example` 참고.

## 3. Next.js 코드

| 파일 | 역할 |
|------|------|
| `lib/supabase/client.ts` | Supabase 브라우저 클라이언트 |
| `lib/shuffleArray.ts` | Fisher-Yates shuffle |
| `app/components/mix/useRouletteWords.ts` | `is_active=true` 조회 + shuffle + loading |
| `app/components/mix/MixRouletteWordsLoader.tsx` | render props 래퍼 예시 |
| `app/components/mix/MixEditScreen.tsx` | 실제 `/mix/edit` 연동 |

### 동작

- Supabase 미설정/오류 시 → 기존 `wordSets` 폴백
- 조회 성공 시 → 배열 **shuffle** 후 랜덤 룰렛
- `is_active = true` 만 SELECT (RLS + 쿼리 필터)

## 4. 단어 관리 (Dashboard)

```sql
-- 비활성화
update public.roulette_words set is_active = false where word = '토닥토닥';

-- 추가
insert into public.roulette_words (word) values ('새로운글');
```
