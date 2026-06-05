"use client";

import { useState } from "react";
import { Plus, Check, X, Droplets } from "lucide-react";
import { useMaeum } from "./MaeumContext";
import {
  BucketItem,
  bucketTypeMeta,
  bucketPresets,
  createOrderLabels,
  createOrderProgress,
  orderLabelPlaceholder,
  OrderProgress,
} from "./types";
import BucketTypeIcon from "./BucketTypeIcon";

export default function BucketScreen() {
  const {
    newBucketText,
    setNewBucketText,
    handleAddBucketItem,
    addPresetBucket,
    bucketItems,
    deleteBucketItem,
    toggleBucketUnit,
    updateBucketLabel,
    advanceOrderProgress,
    selectedFullDate,
  } = useMaeum();

  const [showPresets, setShowPresets] = useState(false);

  const renderBucketUnits = (item: BucketItem) => {
    const { ink } = bucketTypeMeta[item.type];

    if (item.type === "hydrate") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {item.units.map((on, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleBucketUnit(item.id, i)}
              aria-label={`물컵 ${i + 1}`}
              className="w-7 h-8 rounded-b-xl rounded-t-sm border-2 flex items-end justify-center pb-0.5 text-[12px] transition-all duration-200 active:scale-90"
              style={{ borderColor: ink, backgroundColor: on ? ink : "transparent" }}
            >
              {on ? <Droplets size={12} color="#ffffff" strokeWidth={2.5} /> : ""}
            </button>
          ))}
        </div>
      );
    }

    if (item.type === "mood") {
      return (
        <div className="flex flex-wrap gap-2">
          {item.units.map((on, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleBucketUnit(item.id, i)}
              aria-label={`동그라미 ${i + 1}`}
              className="w-8 h-8 rounded-full border-2 transition-all duration-200 active:scale-90"
              style={{ borderColor: ink, backgroundColor: on ? ink : "transparent" }}
            />
          ))}
        </div>
      );
    }

    if (item.type === "habit") {
      return (
        <div className="grid grid-cols-7 gap-1.5">
          {item.units.map((on, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleBucketUnit(item.id, i)}
              aria-label={`격자 ${i + 1}`}
              className="aspect-square rounded-md border-2 flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{ borderColor: ink, backgroundColor: on ? ink : "transparent" }}
            >
              {on && <Check className="w-3.5 h-3.5 stroke-[3]" style={{ color: "#ffffff" }} />}
            </button>
          ))}
        </div>
      );
    }

    // order — 3단계: 0 적기 → 1 작성완료 → 2 수행완료
    const labels = item.labels ?? createOrderLabels(item.units.length);
    const progress = item.orderProgress ?? createOrderProgress(item.units.length);

    const stepLabel = (step: OrderProgress) => {
      if (step === 0) return "작성 전";
      if (step === 1) return "작성됨";
      return "수행완료";
    };

    return (
      <div className="space-y-1.5">
        {progress.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => advanceOrderProgress(item.id, i)}
              aria-label={`${labels[i] || orderLabelPlaceholder(i)} ${stepLabel(step)}`}
              className="w-6 h-6 rounded-md border-2 flex items-center justify-center text-[11px] font-black shrink-0 transition-all duration-200 active:scale-90"
              style={{
                borderColor: ink,
                backgroundColor: step === 0 ? "transparent" : step === 1 ? `${ink}44` : ink,
                color: step === 2 ? "#ffffff" : ink,
              }}
            >
              {step === 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" style={{ color: "#ffffff" }} /> : i + 1}
            </button>
            <input
              type="text"
              value={labels[i] ?? ""}
              onChange={(e) => updateBucketLabel(item.id, i, e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              maxLength={24}
              disabled={step === 2}
              className="flex-1 min-w-0 rounded-lg px-2 py-1 text-[12px] font-bold border focus:outline-none placeholder:opacity-50 disabled:opacity-70"
              style={{
                color: ink,
                backgroundColor:
                  step === 0 ? "rgba(255,255,255,0.55)" : step === 1 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)",
                borderColor: step === 1 ? ink : `${ink}33`,
                textDecoration: step === 2 ? "line-through" : "none",
              }}
              placeholder={orderLabelPlaceholder(i)}
            />
            <span className="text-[9px] font-bold shrink-0 w-10 text-right opacity-70">{stepLabel(step)}</span>
          </div>
        ))}
      </div>
    );
  };

  const activeItems = bucketItems.filter((i) => !i.archived);

  const renderTrackerCard = (item: BucketItem, idx: number) => {
    const meta = bucketTypeMeta[item.type];
    const filled =
      item.type === "order"
        ? (item.orderProgress ?? createOrderProgress(item.units.length)).filter((step) => step === 2).length
        : item.units.filter(Boolean).length;
    const total = item.units.length;
    const formattedDate = selectedFullDate ? selectedFullDate.slice(5).replace("-", "월 ") + "일" : "";

    return (
      <div
        key={item.id}
        className="relative rounded-2xl p-4 shadow-sm transition-all duration-300"
        style={{
          backgroundColor: meta.bg,
          color: meta.ink,
          transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.6}deg)`,
        }}
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 rounded-sm bg-white/55 rotate-[-3deg] shadow-sm pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between mb-3">
          <div className="min-w-0">
            {formattedDate && (
              <p className="text-[10px] font-bold">{formattedDate}</p>
            )}
            <h3 className="text-[15px] font-extrabold leading-snug truncate">{item.text}</h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              deleteBucketItem(item.id);
            }}
            className="p-1 shrink-0 hover:opacity-80 transition-opacity"
            aria-label="습관 삭제"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10">
          {item.type === "hydrate" && (
            <div className="flex flex-wrap gap-1.5">
              {item.units.map((on, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleBucketUnit(item.id, i)}
                  aria-label={`물컵 ${i + 1}`}
                  className="w-7 h-8 rounded-b-xl rounded-t-sm border-2 flex items-end justify-center pb-0.5 transition-all duration-200 active:scale-90"
                  style={{ borderColor: meta.ink, backgroundColor: on ? meta.ink : "transparent" }}
                >
                  {on ? <Droplets size={12} color="#ffffff" strokeWidth={2.5} /> : null}
                </button>
              ))}
            </div>
          )}
          {item.type !== "hydrate" && renderBucketUnits(item)}
        </div>

        <div className="relative z-10 flex items-center justify-between mt-3 text-[10px] font-bold">
          <span>
            {item.type === "order" ? "적기 → 번호 탭(작성) → 다시 탭(수행)" : "탭하여 채워보세요"}
          </span>
          <span>
            {filled} / {total}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 px-5 py-6 flex flex-col">
      <div className="mb-4">
        <h2 className="text-[20px] font-extrabold text-[var(--text-main)]">마음 버킷리스트</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">
          작은 약속을 골라 메모지에 채워가며, 따뜻한 성취감을 쌓아보세요.
        </p>
      </div>

      {/* Add Item Input */}
      <form onSubmit={handleAddBucketItem} className="flex gap-2 mb-3 shrink-0">
        <input
          type="text"
          value={newBucketText}
          onChange={(e) => setNewBucketText(e.target.value)}
          placeholder="나만의 습관을 적어보세요..."
          maxLength={40}
          className="flex-1 px-4 py-2.5 bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl text-[14px] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
        />
        <button
          type="button"
          onClick={() => setShowPresets((prev) => !prev)}
          aria-expanded={showPresets}
          aria-label={showPresets ? "포맷 선택 닫기" : "포맷 선택 열기"}
          className="w-10 h-10 bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm"
        >
          <Plus
            className="w-5 h-5 transition-transform duration-300"
            style={{ color: "#ffffff", transform: showPresets ? "rotate(45deg)" : "rotate(0deg)" }}
          />
        </button>
      </form>

      {/* Preset Template Cards */}
      {showPresets && (
        <div className="grid grid-cols-4 gap-2 mb-4 shrink-0 animate-preset-grid-in overflow-hidden">
          {bucketPresets.map((preset, idx) => {
            const meta = bucketTypeMeta[preset.type];
            return (
              <button
                key={preset.type}
                onClick={() => {
                  addPresetBucket(preset);
                  setShowPresets(false);
                }}
                className="rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 transition-all duration-300 active:scale-95 hover:scale-[1.03] animate-preset-card-in bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:shadow-md cursor-pointer"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ backgroundColor: `${meta.ink}15` }}
                >
                  <BucketTypeIcon type={preset.type} size={22} color={meta.ink} />
                </div>
                <span className="text-[10.5px] font-extrabold leading-tight text-center text-[var(--text-main)] tracking-tighter whitespace-nowrap">
                  {preset.phrase}
                </span>
                <span className="text-[9px] font-bold leading-none text-center text-[var(--text-muted)] opacity-80 whitespace-nowrap">
                  {preset.type === "hydrate"
                    ? "8회 분량"
                    : preset.type === "mood"
                    ? "5회 순환"
                    : preset.type === "order"
                    ? "우선순위 3개"
                    : "7개 체크"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bucket Trackers (memo notes) */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {activeItems.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[var(--bg-card-inner)] rounded-2xl border border-dashed border-[var(--border-color)]">
            <p className="text-[14px] font-bold text-[var(--text-muted)]">습관을 추가해주세요</p>
            <p className="text-[11px] text-[var(--text-muted)]/80 mt-1.5">+ 버튼으로 포맷을 골라 시작해보세요</p>
          </div>
        ) : (
          activeItems.map((item, idx) => renderTrackerCard(item, idx))
        )}
      </div>
    </div>
  );
}
