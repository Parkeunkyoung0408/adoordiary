"use client";

import { useRouletteWords } from "./useRouletteWords";

type MixRouletteWordsLoaderProps = {
  children: (state: {
    loading: boolean;
    error: string | null;
    words: string[];
    currentWord: string;
    currentLetters: string[];
    spinRoulette: () => string[];
  }) => React.ReactNode;
};

/** Supabase에서 4글자 룰렛 단어를 불러와 shuffle한 뒤, render props로 넘깁니다. */
export default function MixRouletteWordsLoader({ children }: MixRouletteWordsLoaderProps) {
  const { loading, error, words, currentWord, currentLetters, spinRoulette } = useRouletteWords();

  if (loading) {
    return (
      <div className="text-center text-[12px] font-semibold text-[var(--text-muted)] py-2">
        네 글자 불러오는 중...
      </div>
    );
  }

  return <>{children({ loading, error, words, currentWord, currentLetters, spinRoulette })}</>;
}
