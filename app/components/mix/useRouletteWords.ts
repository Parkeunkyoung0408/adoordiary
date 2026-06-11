"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wordSets } from "../maeum/types";
import { splitFourWord } from "../../../lib/roulette/splitWord";
import { shuffleArray } from "../../../lib/shuffleArray";

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
  const [source, setSource] = useState<"supabase" | "static" | "fallback" | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>(FALLBACK_WORDS[0]);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWords() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/roulette-words", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as {
          source?: "supabase" | "static";
          words?: string[];
        };

        if (cancelled) return;

        const fetched = shuffleArray((payload.words ?? []).map((w) => w.trim()).filter(Boolean));
        const nextWords = fetched.length > 0 ? fetched : shuffleArray(FALLBACK_WORDS);
        const nextSource =
          fetched.length > 0 ? (payload.source === "supabase" ? "supabase" : "static") : "fallback";

        wordsRef.current = nextWords;
        setWords(nextWords);
        setSource(nextSource);
        setCurrentWord(nextWords[0] ?? FALLBACK_WORDS[0]);
      } catch (fetchError) {
        if (cancelled) return;
        const fallback = shuffleArray(FALLBACK_WORDS);
        wordsRef.current = fallback;
        setWords(fallback);
        setSource("fallback");
        setCurrentWord(fallback[0] ?? FALLBACK_WORDS[0]);
        setError(fetchError instanceof Error ? fetchError.message : "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
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
    source,
    words,
    currentWord,
    currentLetters: splitFourWord(currentWord),
    spinRoulette,
    resetToCurrentWord,
  };
}
