"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useMaeum } from "./MaeumContext";
import { DiaryEntry, moods, archiveCardColors, bucketTypeMeta } from "./types";
import BucketTypeIcon from "./BucketTypeIcon";

export default function ArchiveScreen() {
  const router = useRouter();
  const { savedDates, bucketItems, flippedDate, setFlippedDate, setSelectedFullDate, stats, deleteDiaryEntry, deleteBucketItem } = useMaeum();

  const archivedBuckets = bucketItems.filter((i) => i.archived);
  const isEmpty = Object.keys(savedDates).length === 0 && archivedBuckets.length === 0;

  return (
    <div className="flex-1 px-5 py-6 flex flex-col">
      <div className="mb-5">
        <h2 className="text-[20px] font-extrabold text-[var(--text-main)]">기록 보관소</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">그동안 기록해 온 아름다운 기분들의 조각들입니다.</p>
      </div>

      {/* Statistics Banner */}
      <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
        <div className="bg-[var(--bg-card-inner)] rounded-2xl p-4 border border-[var(--border-color)] text-center transition-colors">
          <p className="text-[11px] text-[var(--text-muted)] font-medium">작성한 일기</p>
          <p className="text-[22px] font-black mt-1 text-[var(--text-main)]">
            {stats.writeCount} <span className="text-[12px] font-normal">일</span>
          </p>
        </div>
        <div className="bg-[var(--bg-card-inner)] rounded-2xl p-4 border border-[var(--border-color)] text-center transition-colors">
          <p className="text-[11px] text-[var(--text-muted)] font-medium">비워낸 무거운 생각</p>
          <p className="text-[22px] font-black mt-1 text-[var(--text-main)]">
            {stats.releaseCount} <span className="text-[12px] font-normal">개</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
        <div className="bg-[var(--bg-card-inner)] rounded-2xl p-4 border border-[var(--border-color)] text-center transition-colors">
          <p className="text-[11px] text-[var(--text-muted)] font-medium">진행 중 습관</p>
          <p className="text-[22px] font-black mt-1 text-[var(--text-main)]">
            {stats.bucketActiveCount} <span className="text-[12px] font-normal">개</span>
          </p>
        </div>
        <div className="bg-[var(--bg-card-inner)] rounded-2xl p-4 border border-[var(--border-color)] text-center transition-colors">
          <p className="text-[11px] text-[var(--text-muted)] font-medium">달성한 습관</p>
          <p className="text-[22px] font-black mt-1 text-[var(--text-main)]">
            {stats.bucketArchivedCount} <span className="text-[12px] font-normal">개</span>
          </p>
        </div>
      </div>

      {/* History Cards Scroll */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1 content-start">
        {isEmpty ? (
          <div className="col-span-2 text-center py-16 bg-[var(--bg-card-inner)] rounded-2xl border border-dashed border-[var(--border-color)]">
            <p className="text-[13px] text-[var(--text-muted)]">아직 보관된 마음 기록이 없습니다.</p>
            <p className="text-[11px] text-[var(--text-muted)]/80 mt-1">오늘 첫 마음 기록을 채워보세요!</p>
          </div>
        ) : (
          <>
            {Object.keys(savedDates)
              .sort((a, b) => b.localeCompare(a))
              .map((dateKey) => {
                const saved = localStorage.getItem(`maeum_entry_${dateKey}`);
                if (!saved) return null;

                try {
                  const entry: DiaryEntry = JSON.parse(saved);
                  const entryMood = moods.find((m) => m.id === entry.mood);
                  const palette = archiveCardColors[entry.mood as string] || { bg: "#FFF7F4", ink: "#175138" };
                  const words = entry.fourWords?.filter(Boolean) || [];
                  const line1 = words.slice(0, 2).join("");
                  const line2 = words.slice(2, 4).join("");
                  const shortDate = dateKey.slice(5).replace("-", ".");
                  const formattedDate = dateKey.slice(5).replace("-", "월 ") + "일";
                  const note = entry.heartText || entry.releaseText || "";
                  const isFlipped = flippedDate === dateKey;

                  return (
                    <div
                      key={dateKey}
                      className="group relative aspect-[3/4] select-none"
                      style={{ perspective: "1000px" }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`${formattedDate} 기록을 삭제할까요?`)) {
                            deleteDiaryEntry(dateKey);
                          }
                        }}
                        className="absolute top-1.5 right-1.5 z-20 p-1 rounded-full bg-white/75 opacity-80 hover:opacity-100 transition-opacity shadow-sm"
                        style={{ color: palette.ink }}
                        aria-label="기록 삭제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div
                        onClick={() => setFlippedDate((prev) => (prev === dateKey ? null : dateKey))}
                        className="relative w-full h-full cursor-pointer"
                      >
                      <div
                        className="relative w-full h-full transition-transform duration-500"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        {/* FRONT */}
                        <div
                          className="absolute inset-0 rounded-2xl p-3 shadow-sm overflow-hidden"
                          style={{ backfaceVisibility: "hidden", backgroundColor: palette.bg }}
                        >
                          <div className="absolute top-2.5 left-3 flex flex-col items-center leading-none" style={{ color: palette.ink }}>
                            <span className="text-[18px]">{entryMood?.emoji || "📝"}</span>
                            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{shortDate}</span>
                          </div>

                          <div className="absolute bottom-2.5 right-3 flex flex-col items-center leading-none rotate-180" style={{ color: palette.ink }}>
                            <span className="text-[18px]">{entryMood?.emoji || "📝"}</span>
                            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{shortDate}</span>
                          </div>

                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                            <p className="font-black leading-[1.04] tracking-tight" style={{ color: palette.ink }}>
                              <span className="block text-[30px]">{line1 || "-"}</span>
                              {line2 && <span className="block text-[30px]">{line2}</span>}
                            </p>
                          </div>
                        </div>

                        {/* BACK */}
                        <div
                          className="absolute inset-0 rounded-2xl p-3 shadow-sm overflow-hidden"
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            backgroundColor: palette.bg,
                          }}
                        >
                          <div className="w-full h-full rounded-xl bg-white/85 p-3 flex flex-col">
                            <div className="flex items-center justify-between mb-2" style={{ color: palette.ink }}>
                              <span className="text-[11px] font-extrabold tracking-tight">{formattedDate}</span>
                              <span className="text-[15px]">{entryMood?.emoji || "📝"}</span>
                            </div>
                            <p className="flex-1 text-[12px] leading-relaxed text-[#3a3a3a] overflow-y-auto whitespace-pre-wrap">
                              {note || "이 날의 기록이 없어요."}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFullDate(dateKey);
                                router.push("/edit");
                              }}
                              className="text-[10px] font-bold mt-2 self-end hover:underline"
                              style={{ color: palette.ink }}
                            >
                              자세히 보기 ›
                            </button>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })}

            {archivedBuckets
              .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0))
              .map((item) => {
                const meta = bucketTypeMeta[item.type];
                const total = item.units.length;
                const archDate = item.archivedAt ? new Date(item.archivedAt) : null;
                const shortDate = archDate
                  ? `${String(archDate.getMonth() + 1).padStart(2, "0")}.${String(archDate.getDate()).padStart(2, "0")}`
                  : "";
                return (
                  <div
                    key={item.id}
                    className="relative aspect-[3/4] rounded-2xl p-3 shadow-sm overflow-hidden flex flex-col"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <button
                      type="button"
                      onClick={() => deleteBucketItem(item.id)}
                      className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-white/75 opacity-80 hover:opacity-100 transition-opacity shadow-sm"
                      style={{ color: meta.ink }}
                      aria-label="달성 기록 삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex flex-col items-start gap-0.5 pr-7" style={{ color: meta.ink }}>
                      <BucketTypeIcon type={item.type} size={18} color={meta.ink} />
                      {shortDate && (
                        <span className="text-[9px] font-extrabold tracking-tight">{shortDate}</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
                      <p className="font-black text-[15px] leading-tight" style={{ color: meta.ink }}>
                        {item.text}
                      </p>
                    </div>
                    <div className="text-center text-[10px] font-bold" style={{ color: meta.ink }}>
                      달성 ✓ {total}/{total}
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}
