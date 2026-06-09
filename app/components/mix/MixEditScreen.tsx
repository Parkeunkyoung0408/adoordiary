"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Edit3, RotateCw, Sparkles } from "lucide-react";
import { wordSets } from "../maeum/types";
import MixEditPromoVideo from "./MixEditPromoVideo";
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
    <div className="relative text-[var(--text-main)]">
      <style>{`
        @keyframes pulse-ring-custom {
          0% { box-shadow: 0 0 0 0 rgba(220, 167, 232, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 6px rgba(220, 167, 232, 0.15); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(220, 167, 232, 0); transform: scale(1); }
        }
        .animate-pulse-ring-custom {
          animation: pulse-ring-custom 2s cubic-bezier(0.25, 0, 0, 1) infinite;
        }
        @keyframes modal-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modal-pop {
          animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <div className="px-4 py-4 pb-8 space-y-5">
        <div className="rounded-[24px] bg-white/95 backdrop-blur-md px-4 py-3 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
          <MixPageIntro step="STEP 1 - 네 글자 입력하기" />
        </div>

        <section
          className="rounded-[32px] px-5 py-6 border border-white shadow-[0_20px_50px_rgba(22,66,41,0.08)] backdrop-blur-xl relative overflow-hidden transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 248, 245, 0.96) 100%)",
            boxShadow: "0 20px 50px rgba(22, 66, 41, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)",
          }}
        >
          <div className="text-center mb-2">
            <h2 className="text-[19px] font-black text-[#175138] tracking-tight">네 글자로 써보는 지금 내 생각!</h2>
            <p className="text-[12px] font-semibold text-[var(--text-muted)] mt-1 opacity-90">16종의 아트웍에 네 글자를 섞어드려요</p>
          </div>

          <div className="flex justify-between gap-3 my-5 max-w-[260px] mx-auto w-full relative">
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
                      className={`flex-1 aspect-square rounded-[20px] border flex items-center justify-center bg-white/95 transition-all duration-300 ${
                        isFocused
                          ? "border-[#175138] border-2 scale-105 shadow-[0_8px_20px_rgba(23,81,56,0.12)] animate-pulse-ring-custom"
                          : "border-[var(--border-color)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.015),0_3px_8px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                      <span className={`text-[25px] font-black ${isFocused ? "text-[#175138]" : "text-[var(--text-main)]"}`}>
                        {letter}
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              letters.map((letter, index) => (
                <div
                  key={index}
                  className={`flex-1 aspect-square rounded-[20px] border border-[var(--border-color)] bg-white/95 flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.02)] relative overflow-hidden transition-all duration-300 ${
                    isSpinning ? "animate-spin-letter" : "hover:scale-[1.02] active:scale-[1.02]"
                  }`}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <span className="text-[25px] font-black text-[#175138] tracking-tight">{letter}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
                </div>
              ))
            )}
          </div>

          <div className="space-y-2.5 w-full">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleDirectWrite}
                className={`flex-1 h-12 rounded-[24px] font-bold text-[13px] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 border ${
                  isDirectWrite
                    ? "bg-[#175138] text-white border-transparent shadow-[0_4px_12px_rgba(23,81,56,0.2)] hover:bg-[#11402B]"
                    : "bg-white border-[var(--border-color)] text-[#175138] hover:bg-[var(--bg-card-inner)]/30 hover:border-[#175138]/50 shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                }`}
                style={{ color: isDirectWrite ? "#ffffff" : "#175138" }}
              >
                <Edit3 className="w-4 h-4" />
                {isDirectWrite ? "룰렛 단어 사용" : "내가 직접 쓸랫"}
              </button>

              {!isDirectWrite && (
                <button
                  type="button"
                  onClick={spinRoulette}
                  disabled={isSpinning}
                  className="flex-1 h-12 bg-white border border-[var(--border-color)] hover:border-[#175138]/50 text-[#175138] rounded-[24px] font-bold text-[13px] hover:bg-[var(--bg-card-inner)]/30 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                  style={{ color: "#175138" }}
                >
                  <RotateCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                  네 글자 룰렛
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={goToArtwork}
              disabled={!isValid}
              className="bg-gradient-to-r from-[#12422C] to-[#1D5E3F] w-full h-12 text-white rounded-[24px] font-black text-[14.5px] tracking-wide flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(23,81,56,0.2)] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none transition-all duration-300 mt-1"
              style={{ color: "#ffffff" }}
            >
              아두르 아트웍 고르기
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <MixEditPromoVideo />
      </div>

      {showInvalidPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-6 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-[32px] p-6 max-w-[310px] w-full text-center border border-white/50 shadow-[0_24px_50px_rgba(0,0,0,0.15)] animate-modal-pop relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent-color)] to-[#2fa86a]" />
            <Sparkles className="w-8 h-8 mx-auto text-[#175138] mb-3 opacity-90" />
            <p className="text-[16px] font-black text-[#175138] tracking-tight">딱 네 글자만 채워주세요!</p>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed font-semibold">
              공백·특수문자·이모지 없이 정확히 4글자만 입력할 수 있어요.
            </p>
            <button
              type="button"
              onClick={() => setShowInvalidPopup(false)}
              className="mt-5 w-full h-12 rounded-[24px] bg-[#175138] text-white font-black text-[13.5px] hover:bg-[#11402B] active:scale-95 transition-all duration-200 shadow-[0_4px_12px_rgba(23,81,56,0.2)]"
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
