"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wordSets } from "../maeum/types";
import { splitFourWord } from "../../../lib/roulette/splitWord";
import { shuffleArray } from "../../../lib/shuffleArray";
import { isSupabaseConfigured, supabase, type RouletteWordRow } from "../../../lib/supabase/client";

const FALLBACK_WORDS = wordSets.map((set) => set.words.join(""));

function pickRandomWord(words: string[], exclude?: string) {
  if (words.length === 0) return FALLBACK_WORDS[0];
  if (words.length === 1) return words[0];

  let next = words[Math.floor(Math.random() * words.length)];
  if (exclude && words.length > 1) {
    let guard = 0;
    while (next === exclude && guard < 8) {
      next = words[Math.floor(Math.random() * words.length)];
      guard += 1;
    }
  }
  return next;
}

export function useRouletteWords() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>(FALLBACK_WORDS[0]);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWords() {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured() || !supabase) {
        const fallback = shuffleArray(FALLBACK_WORDS);
        if (cancelled) return;
        wordsRef.current = fallback;
        setWords(fallback);
        setCurrentWord(fallback[0] ?? FALLBACK_WORDS[0]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("roulette_words")
        .select("id, word, is_active, created_at")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        const fallback = shuffleArray(FALLBACK_WORDS);
        wordsRef.current = fallback;
        setWords(fallback);
        setCurrentWord(fallback[0] ?? FALLBACK_WORDS[0]);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as RouletteWordRow[];
      const fetched = shuffleArray(rows.map((row) => row.word.trim()).filter(Boolean));
      const nextWords = fetched.length > 0 ? fetched : shuffleArray(FALLBACK_WORDS);

      wordsRef.current = nextWords;
      setWords(nextWords);
      setCurrentWord(nextWords[0] ?? FALLBACK_WORDS[0]);
      setLoading(false);
    }

    void loadWords();

    return () => {
      cancelled = true;
    };
  }, []);

  const spinRoulette = useCallback(() => {
    const pool = wordsRef.current.length > 0 ? wordsRef.current : FALLBACK_WORDS;
    const nextWord = pickRandomWord(pool, currentWord);
    setCurrentWord(nextWord);
    return splitFourWord(nextWord);
  }, [currentWord]);

  const resetToCurrentWord = useCallback(() => splitFourWord(currentWord), [currentWord]);

  return {
    loading,
    error,
    words,
    currentWord,
    currentLetters: splitFourWord(currentWord),
    spinRoulette,
    resetToCurrentWord,
  };
}
