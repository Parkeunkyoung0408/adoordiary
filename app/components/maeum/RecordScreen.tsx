"use client";

import { ArrowRight, Edit3, RotateCw, Trash2, Info, RefreshCw } from "lucide-react";
import { useMaeum } from "./MaeumContext";
import { moods } from "./types";

export default function RecordScreen() {
  const {
    weekDays,
    savedDates,
    selectedFullDate,
    setSelectedFullDate,
    userName,
    mood,
    setMood,
    saveCurrentEntry,
    triggerToast,
    isDirectWrite,
    customWords,
    setCustomWords,
    fourWords,
    isSpinning,
    spinRoulette,
    toggleDirectWrite,
    emblaRef,
    emblaApi,
    selectedIndex,
    heartText,
    setHeartText,
    releaseText,
    setReleaseText,
    isReleased,
    setIsReleased,
    isReleasing,
    particles,
    handleRelease,
  } = useMaeum();

  return (
    <>
      {/* Weekly Date Picker */}
      <div className="shrink-0 px-4 pt-3 pb-1">
        <div className="flex justify-between items-center bg-[var(--bg-card-inner)] rounded-2xl p-1.5 border border-[var(--border-color)] transition-colors duration-300">
          {weekDays.map((item) => {
            const hasEntry = savedDates[item.fullDate];
            const isSelected = selectedFullDate === item.fullDate;
            const moodColor = moods.find((m) => m.id === hasEntry)?.color.split(" ")[0] || "";

            return (
              <button
                key={item.fullDate}
                onClick={() => setSelectedFullDate(item.fullDate)}
                className={`relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold border border-[var(--border-color)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/40"
                }`}
              >
                {item.isToday && (
                  <div className="absolute top-1.5 w-1 h-1 bg-[var(--accent-color)] rounded-full animate-pulse" />
                )}
                <span className="text-[10px] uppercase font-medium leading-[14px]">{item.day}</span>
                <span className="text-[13px] font-bold mt-0.5 leading-[16px]">{item.date}</span>
                {hasEntry && (
                  <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${moodColor || "bg-[var(--text-muted)]"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood Selection Card */}
      <div className="shrink-0 px-4 pb-2">
        <div className="glass-panel-sm rounded-[24px] px-4 py-3.5 transition-colors duration-300">
          <p className="text-[14px] text-center mb-3 text-[var(--text-main)] font-medium">
            <span className="opacity-60">오늘, </span>
            <span className="font-bold">{userName}</span>
            <span className="opacity-60">의 기분은 어떤가요?</span>
          </p>
          <div className="flex justify-between gap-1.5">
            {moods.map((m) => {
              const isActive = mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMood(m.id);
                    saveCurrentEntry({ mood: m.id });
                    triggerToast(`오늘 기분을 '${m.label}'(으)로 선택했습니다.`);
                  }}
                  className="flex flex-col items-center flex-1 transition-all duration-300"
                  style={{ outline: "none" }}
                >
                  <div
                    className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[22px] border transition-colors duration-300 ${
                      isActive
                        ? `${m.color} border-[var(--accent-color)]`
                        : "bg-[var(--bg-card-inner)] border-transparent opacity-60 hover:opacity-100"
                    }`}
                    style={isActive ? { borderColor: "#175138" } : undefined}
                  >
                    {m.emoji}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-medium transition-colors duration-300 ${
                      isActive ? "text-[var(--text-main)] font-bold" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Swipeable Carousel Container */}
      <div className="flex-1 px-4 pb-3 min-h-0">
        <div className="overflow-hidden h-full rounded-[24px]" ref={emblaRef}>
          <div className="flex h-full gap-4">
            {/* Card 1: Four Words Roulette */}
            <div className="flex-[0_0_100%] min-w-0 h-full">
              <div
                className="glass-panel rounded-[24px] p-5 h-full flex flex-col justify-between transition-colors duration-300"
                style={{ borderWidth: "1px", borderColor: "#175138", backgroundColor: "#FFF7F4" }}
              >
                <div className="text-center">
                  <h2 className="text-[18px] font-extrabold text-[var(--text-main)] mb-0.5 leading-snug">
                    지금 마음을 네 글자로 적어줘
                  </h2>
                  <p className="text-[12px] text-[var(--text-muted)]">잠시 숨을 고르고, 떠오르는 단어를 기록해요.</p>
                </div>

                {/* Animated Blocks with IME-friendly unified Korean support overlay */}
                <div className="flex justify-between gap-2.5 my-4 max-w-[250px] mx-auto w-full relative">
                  {isDirectWrite ? (
                    <>
                      <input
                        type="text"
                        value={customWords.join("")}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s/g, "").slice(0, 4);
                          const newWords = Array.from({ length: 4 }, (_, idx) => val[idx] || "");
                          setCustomWords(newWords);
                          saveCurrentEntry({ fourWords: newWords });
                        }}
                        maxLength={4}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                        placeholder=""
                      />
                      {Array.from({ length: 4 }).map((_, index) => {
                        const word = customWords[index] || "";
                        const currentLength = customWords.join("").length;
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
                            <span className="text-[22px] font-extrabold text-[var(--text-main)]">{word}</span>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    fourWords.map((word, index) => (
                      <div
                        key={index}
                        className={`flex-1 aspect-square rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-card-inner)] flex items-center justify-center shadow-sm relative overflow-hidden transition-all duration-300 ${
                          isSpinning ? "animate-spin-letter" : ""
                        }`}
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        <span className="text-[22px] font-extrabold text-[var(--text-main)]">{word}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Interaction Buttons */}
                <div className="space-y-2 w-full">
                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    className="bg-[#175138] w-full h-11 text-white rounded-[30px] font-black text-[14px] tracking-wide flex items-center justify-center gap-1.5 border-2 border-[#175138]"
                    style={{ color: "#ffffff" }}
                  >
                    이 단어로 마음 풀기
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
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
              </div>
            </div>

            {/* Card 2: Heart */}
            <div className="flex-[0_0_100%] min-w-0 h-full">
              <div
                className="glass-panel rounded-[24px] p-6 h-full flex flex-col transition-colors duration-300"
                style={{ borderColor: "#175138" }}
              >
                <div className="flex items-center justify-center mb-4 border-b border-[var(--border-color)] pb-3">
                  <div className="flex gap-2.5">
                    {(isDirectWrite ? customWords : fourWords).map((w, idx) => (
                      <span
                        key={idx}
                        className="w-12 h-12 rounded-xl bg-[var(--bg-card-inner)] flex items-center justify-center text-[22px] font-black border border-[var(--border-color)] text-[var(--text-main)]"
                      >
                        {w || "-"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-0 relative bg-[var(--bg-card-inner)] rounded-2xl border border-[var(--border-color)] p-4 flex flex-col justify-between transition-all duration-300">
                  <textarea
                    value={heartText}
                    onChange={(e) => {
                      setHeartText(e.target.value);
                      saveCurrentEntry({ heartText: e.target.value });
                    }}
                    placeholder={`선택한 단어를 보며, 지금 드는 솔직한 생각이나 감정을 자유롭게 써내려가 보세요.\n(예: 마음 속이 몽글몽글해지는 기분이다...)`}
                    className="w-full flex-1 bg-transparent border-none focus:outline-none text-[14px] text-[var(--text-main)] resize-none leading-relaxed placeholder-[var(--text-muted)]/80"
                  />
                  <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mt-2">
                    <span className="flex items-center gap-1">
                      <Info className="w-3 h-3" /> 실시간 저장 중
                    </span>
                    <span>{heartText.length} 자</span>
                  </div>
                </div>

                <button
                  onClick={() => emblaApi?.scrollNext()}
                  className="bg-[#175138] w-full h-11 mt-4 text-white rounded-[30px] font-bold text-[13px] tracking-wide flex items-center justify-center gap-1 border border-white/10"
                  style={{ color: "#ffffff" }}
                >
                  내 마음에 한걸음 더
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card 3: Release */}
            <div className="flex-[0_0_100%] min-w-0 h-full">
              <div
                className="glass-panel rounded-[24px] p-6 h-full flex flex-col transition-colors duration-300 relative"
                style={{ borderWidth: "1px", borderColor: "#175138" }}
              >
                {particles.map((p) => (
                  <div
                    key={p.id}
                    className="animate-ash"
                    style={
                      {
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        "--x": `${p.x}px`,
                        "--y": `${p.y}px`,
                        "--r": `${p.r}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}

                <div className="flex items-center justify-center mb-4 border-b border-[var(--border-color)] pb-3">
                  <div className="flex gap-2.5">
                    {(isDirectWrite ? customWords : fourWords).map((w, idx) => (
                      <span
                        key={idx}
                        className="w-12 h-12 rounded-xl bg-[var(--bg-card-inner)] flex items-center justify-center text-[22px] font-black border border-[var(--border-color)] text-[var(--text-main)]"
                      >
                        {w || "-"}
                      </span>
                    ))}
                  </div>
                </div>

                {isReleased ? (
                  <div className="bg-[var(--bg-card-inner)] border border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center my-6 flex flex-col items-center justify-center min-h-[200px]">
                    <div className="w-14 h-14 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[24px] mb-3 animate-pulse">
                      🕊️
                    </div>
                    <h3 className="text-[15px] font-bold text-[var(--text-main)] mb-1">마음을 훌훌 털어냈습니다</h3>
                    <p className="text-[12px] text-[var(--text-muted)] max-w-[200px] leading-relaxed">
                      비워낸 마음 대신 따뜻한 평온함이 채워졌기를 바랄게요.
                    </p>
                    <button
                      onClick={() => {
                        setIsReleased(false);
                        saveCurrentEntry({ released: false });
                      }}
                      className="mt-4 text-[11px] font-bold text-[var(--nav-active-text)] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> 다시 적기
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex-1 min-h-0 relative bg-[var(--bg-card-inner)] rounded-2xl border border-[var(--border-color)] p-4 flex flex-col justify-between transition-all duration-300 ${
                      isReleasing ? "animate-shred-text" : ""
                    }`}
                  >
                    <textarea
                      value={releaseText}
                      onChange={(e) => {
                        setReleaseText(e.target.value);
                        saveCurrentEntry({ releaseText: e.target.value });
                      }}
                      disabled={isReleasing}
                      placeholder={`나를 힘들게 하거나 집착하게 만드는 복잡한 감정들을 여기에 적어보세요.\n적은 뒤 아래 '마음 비우기' 버튼을 누르면 연기처럼 흩어져 사라집니다.`}
                      className="w-full flex-1 bg-transparent border-none focus:outline-none text-[14px] text-[var(--text-main)] resize-none leading-relaxed placeholder-[var(--text-muted)]/80 disabled:opacity-50"
                    />
                    <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mt-2">
                      <span>비울 감정 기록</span>
                      <span>{releaseText.length} 자</span>
                    </div>
                  </div>
                )}

                {!isReleased && (
                  <button
                    onClick={handleRelease}
                    disabled={!releaseText.trim() || isReleasing}
                    className="w-full h-11 mt-4 disabled:cursor-not-allowed text-white rounded-[30px] font-bold text-[13px] flex items-center justify-center gap-1.5"
                    style={{ color: "#ffffff", backgroundColor: "#175138" }}
                  >
                    <Trash2 className="w-4 h-4" />
                    {isReleasing ? "비워내는 중..." : "글과 함께 마음 날려버리기"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="shrink-0 flex gap-1.5 justify-center py-2">
        {Array.from({ length: 3 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === selectedIndex ? "bg-[#175138] w-5" : "bg-[var(--border-color)] w-1.5"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </>
  );
}
