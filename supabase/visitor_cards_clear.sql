-- 방명록(visitor_cards) DB 레코드 전체 삭제
-- Supabase Dashboard → SQL Editor에서 실행

DELETE FROM public.visitor_cards;

-- Storage 이미지는 Dashboard → Storage → visitor-cards 버킷에서
-- 폴더를 선택 후 삭제하거나, service role 키로 scripts/clear-visitor-cards.mjs 실행
