"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Edit3, RotateCw, Sparkles } from "lucide-react";
import { wordSets } from "../maeum/types";
import MixPageIntro from "./MixPageIntro";
import { saveMixText } from "./mixStorage";
import { isValidFourLetters, sanitizeFourLettersInput } from "./validation";

export default function MixEditScreen() {
  const router = useRouter();
  const [isDirectWrite, setIsDirectWrite] = useState(false);
  const [fourWords, setFourWords] = useState<string[]>(wordSets[0].words);
  const [directLetters, setDirectLetters] = useState("");
  const [currentWordSetIndex, setCurrentWordSetIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);

  const cleanText = useMemo(() => {
    if (isDirectWrite) return sanitizeFourLettersInput(directLetters);
    return fourWords.join("");
  }, [isDirectWrite, directLetters, fourWords]);

  const letters = useMemo(() => {
    if (isDirectWrite) return Array.from({ length: 4 }, (_, i) => cleanText[i] || "");
    return fourWords;
  }, [isDirectWrite, cleanText, fourWords]);

  const isValid = isValidFourLetters(cleanText);

  const handleInputChange = (value: string) => {
    setDirectLetters(sanitizeFourLettersInput(value));
    setShowInvalidPopup(false);
  };

  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      const nextIndex = (currentWordSetIndex + 1) % wordSets.length;
      setCurrentWordSetIndex(nextIndex);
      setFourWords(wordSets[nextIndex].words);
      setIsDirectWrite(false);
      setIsSpinning(false);
    }, 600);
  };

  const toggleDirectWrite = () => {
    const next = !isDirectWrite;
    setIsDirectWrite(next);
    if (next) {
      setDirectLetters("");
    } else {
      setFourWords(wordSets[currentWordSetIndex].words);
    }
  };

  const goToArtwork = () => {
    if (!isValid) {
      setShowInvalidPopup(true);
      return;
    }
    saveMixText(cleanText);
    router.push("/mix/artwork");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 text-[var(--text-main)]">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <MixPageIntro step="STEP 1 · 네 글자 입력" />

        <section className="glass-panel-sm rounded-[24px] px-4 py-5">
          <div className="text-center mb-1">
            <h2 className="text-[18px] font-extrabold text-[var(--text-main)]">지금 마음을 네 글자로 적어줘</h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">공백·특수문자 없이 정확히 4글자만 입력해요.</p>
          </div>

          <div className="flex justify-between gap-2.5 my-4 max-w-[250px] mx-auto w-full relative">
            {isDirectWrite ? (
              <>
                <input
                  type="text"
                  value={cleanText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  maxLength={4}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  placeholder=""
                  aria-label="네 글자 입력"
                />
                {letters.map((letter, index) => {
                  const currentLength = cleanText.length;
                  const isFocused = currentLength === index || (index === 3 && currentLength === 4);
                  return (
                    <div
                      key={index}
                      className={`flex-1 aspect-square rounded-[18px] border-2 flex items-center justify-center bg-[var(--bg-card-inner)] shadow-inner transition-all duration-300 ${
                        isFocused
                          ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20"
                          : "border-[var(--border-color)]"
                      }`}
                    >
                      <span className="text-[22px] font-extrabold text-[var(--text-main)]">{letter}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              letters.map((letter, index) => (
                <div
                  key={index}
                  className={`flex-1 aspect-square rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-card-inner)] flex items-center justify-center shadow-sm relative overflow-hidden transition-all duration-300 ${
                    isSpinning ? "animate-spin-letter" : ""
                  }`}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <span className="text-[22px] font-extrabold text-[var(--text-main)]">{letter}</span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 w-full">
            <button
              type="button"
              onClick={goToArtwork}
              disabled={!isValid}
              className="bg-[#175138] w-full h-11 text-white rounded-[30px] font-black text-[14px] tracking-wide flex items-center justify-center gap-1.5 border-2 border-[#175138] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{ color: "#ffffff" }}
            >
              아트웍 고르기
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleDirectWrite}
                className={`flex-1 h-11 rounded-[30px] font-bold text-[13px] transition-all duration-300 flex items-center justify-center gap-1.5 border-2 ${
                  isDirectWrite
                    ? "bg-[var(--accent-bg)] text-[var(--nav-active-text)] border-transparent"
                    : "bg-[var(--button-secondary-bg)] border-[#175138] text-[var(--button-secondary-text)] hover:bg-[var(--bg-card-inner)]"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isDirectWrite ? "룰렛 단어 사용" : "내가 직접 쓰기"}
              </button>

              {!isDirectWrite && (
                <button
                  type="button"
                  onClick={spinRoulette}
                  disabled={isSpinning}
                  className="flex-1 h-11 bg-[var(--button-secondary-bg)] border-2 border-[#175138] text-[var(--button-secondary-text)] rounded-[30px] font-bold text-[13px] hover:bg-[var(--bg-card-inner)] transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <RotateCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                  룰렛 돌리기
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {showInvalidPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-[var(--bg-card)] rounded-[28px] p-6 max-w-[300px] text-center border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
            <Sparkles className="w-8 h-8 mx-auto text-[var(--accent-color)] mb-3" />
            <p className="text-[15px] font-extrabold text-[var(--text-main)]">딱 네 글자만 채워주세요!</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-2 leading-relaxed">
              공백·특수문자·이모지 없이 정확히 4글자만 입력할 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => setShowInvalidPopup(false)}
              className="mt-4 w-full h-11 rounded-[30px] bg-[#175138] text-white font-bold text-[13px]"
              style={{ color: "#ffffff" }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
