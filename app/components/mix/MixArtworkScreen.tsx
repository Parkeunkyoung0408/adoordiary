"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Send, Sparkles } from "lucide-react";
import { artworkConfigList } from "./artworkConfig";
import { renderMixCard } from "./canvasRenderer";
import MixLoadingVideo from "./MixLoadingVideo";
import MixPageIntro from "./MixPageIntro";
import { getMixText } from "./mixStorage";
import { useMixToast } from "./MixShell";
import {
  isInAppBrowser,
  isIOS,
  isMobileDevice,
  isValidFourLetters,
  tryBlobDownload,
  tryShareImageFile,
} from "./validation";

export default function MixArtworkScreen() {
  const router = useRouter();
  const { showToast } = useMixToast();
  const [mixText, setMixText] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isMixing, setIsMixing] = useState(false);
  const [isVideoDone, setIsVideoDone] = useState(false);
  const [mixSession, setMixSession] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const inApp = useMemo(() => isInAppBrowser(), []);

  useEffect(() => {
    const text = getMixText();
    if (!text || !isValidFourLetters(text)) {
      router.replace("/mix/edit");
      return;
    }
    setMixText(text);
  }, [router]);

  const letters = useMemo(() => {
    if (!mixText) return ["", "", "", ""];
    return Array.from({ length: 4 }, (_, i) => mixText[i] || "");
  }, [mixText]);

  const generatePreview = useCallback(
    async (artworkId: number, text: string) => {
      const config = artworkConfigList.find((item) => item.artwork_id === artworkId);
      if (!config) return;
      setIsRendering(true);
      setPreviewUrl(null);
      try {
        const dataUrl = await renderMixCard(config, text);
        setPreviewUrl(dataUrl);
      } catch {
        showToast("카드 합성에 실패했어요. 다시 시도해주세요.");
        setPreviewUrl(null);
        setIsMixing(false);
        setIsVideoDone(false);
      } finally {
        setIsRendering(false);
      }
    },
    [showToast]
  );

  const handleArtworkPick = (id: number) => {
    if (!mixText) return;
    if (selectedId !== id) {
      setPreviewUrl(null);
      setIsMixing(false);
      setIsVideoDone(false);
    }
    setSelectedId(id);
  };

  const handleMix = () => {
    if (!mixText || selectedId === null) return;
    setIsMixing(true);
    setIsVideoDone(false);
    setPreviewUrl(null);
    setMixSession((s) => s + 1);
    generatePreview(selectedId, mixText);
  };

  const handleVideoEnded = useCallback(() => {
    setIsVideoDone(true);
  }, []);

  const handleBackToSelect = () => {
    setPreviewUrl(null);
    setIsMixing(false);
    setIsVideoDone(false);
    setIsRendering(false);
  };

  const showCard = previewUrl !== null && isVideoDone;
  const showLoading = isMixing && !showCard;

  const handleDownload = async () => {
    if (!previewUrl || !mixText) return;
    const filename = `adoor-mix-${mixText}.png`;

    if (inApp) {
      setShowGuide(true);
      return;
    }

    if (isIOS()) {
      const shareResult = await tryShareImageFile(previewUrl, filename);
      if (shareResult === "shared") {
        showToast("공유 메뉴에서 '이미지 저장'을 선택해 주세요");
        return;
      }
      if (shareResult === "cancelled") return;
      setShowGuide(true);
      return;
    }

    if (isMobileDevice()) {
      try {
        await tryBlobDownload(previewUrl, filename);
        showToast("이미지를 저장했어요!");
        return;
      } catch {
        const shareResult = await tryShareImageFile(previewUrl, filename);
        if (shareResult === "shared") {
          showToast("공유 메뉴에서 '이미지 저장'을 선택해 주세요");
          return;
        }
        if (shareResult === "cancelled") return;
        setShowGuide(true);
        return;
      }
    }

    try {
      await tryBlobDownload(previewUrl, filename);
      showToast("이미지를 저장했어요!");
    } catch {
      showToast("저장에 실패했어요. 다시 시도해주세요.");
    }
  };

  const handleSend = async () => {
    if (!previewUrl || selectedId === null || !mixText) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/visitor-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_text: mixText,
          artwork_id: selectedId,
          imageDataUrl: previewUrl,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      showToast("작가에게 전송했어요! 방명록에 남겼습니다");
    } catch {
      showToast("전송에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  if (!mixText) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--text-muted)]">
        네 글자를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="relative text-[var(--text-main)]">
      <div
        className={
          showCard && previewUrl
            ? "flex flex-col min-h-[calc(100dvh-88px)] overflow-hidden px-4 py-4"
            : showLoading
              ? "flex items-center justify-center min-h-[calc(100dvh-88px)] px-4 py-4"
              : "px-4 py-4 pb-8"
        }
      >
        {showCard && previewUrl ? (
          <div className="relative flex flex-col h-full justify-between">
            <div className="mb-2">
              <MixPageIntro step="STEP 3 - 아트웍 저장하기" />
            </div>

            <div className="flex-1 flex flex-col justify-between gap-4 min-h-0 my-2">
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="relative w-full max-w-[300px] aspect-[9/16] rounded-[20px] overflow-hidden border border-[var(--border-color)] shadow-[var(--shadow-md)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="믹스 카드 결과" className="w-full h-full object-cover block" />
                </div>
              </div>

              <div className="space-y-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="h-11 rounded-[30px] bg-[var(--button-secondary-bg)] border-2 border-[#175138] text-[var(--button-secondary-text)] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform touch-manipulation"
                  >
                    <Download className="w-4 h-4" />
                    저장하기
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="h-11 rounded-[30px] bg-[#175138] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 border-2 border-[#175138] disabled:opacity-40 active:scale-[0.98] transition-transform touch-manipulation"
                    style={{ color: "#ffffff" }}
                  >
                    <Send className="w-4 h-4" />
                    {isSending ? "전송 중..." : "작가에게 전송"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleBackToSelect}
                  className="w-full h-11 rounded-[30px] bg-white border-2 border-[var(--border-color)] text-[#175138] font-bold text-[13px] flex items-center justify-center active:scale-[0.98] transition-transform"
                  style={{ color: "#175138" }}
                >
                  다시 선택
                </button>
              </div>
            </div>
          </div>
        ) : showLoading ? (
          <div className="flex flex-1 items-center justify-center min-h-[calc(100dvh-120px)]">
            {isVideoDone && isRendering ? (
              <p className="text-[13px] text-[var(--text-muted)]">마무리 중...</p>
            ) : (
              <MixLoadingVideo key={mixSession} onEnded={handleVideoEnded} />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <MixPageIntro step="STEP 2 - 아트웍 선택" />

            <section
              className="rounded-[24px] px-4 py-4 space-y-3 border border-[var(--border-color)] shadow-[var(--shadow-sm)]"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-extrabold text-[var(--text-main)]">1개의 아트웍을 골라주세요</p>
                <Link
                  href="/mix/edit"
                  className="text-[11px] font-bold text-[var(--nav-active-text)] underline underline-offset-2"
                >
                  네 글자 바꾸기
                </Link>
              </div>

              <div className="flex justify-center gap-2">
                {letters.map((letter, index) => (
                  <span
                    key={index}
                    className="w-11 h-11 rounded-xl bg-[var(--bg-card-inner)] flex items-center justify-center text-[20px] font-black border border-[var(--border-color)] text-[var(--text-main)]"
                  >
                    {letter}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {artworkConfigList.map((item) => {
                  const active = selectedId === item.artwork_id;
                  return (
                    <button
                      key={item.artwork_id}
                      type="button"
                      onClick={() => handleArtworkPick(item.artwork_id)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all touch-manipulation active:scale-[0.97] ${
                        active
                          ? "border-[#175138] ring-2 ring-[#175138]/25 scale-[1.02]"
                          : "border-[var(--border-color)]"
                      }`}
                    >
                      <Image
                        src={`/assets/artworks/${item.filename}`}
                        alt={`아트웍 ${item.artwork_id}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/45 text-white px-1 rounded">
                        {item.artwork_id}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedId !== null && (
                <button
                  type="button"
                  onClick={handleMix}
                  disabled={isMixing}
                  className="w-full h-11 rounded-[30px] bg-[#175138] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 border-2 border-[#175138] active:scale-[0.98] transition-transform disabled:opacity-40"
                  style={{ color: "#ffffff" }}
                >
                  <Sparkles className="w-4 h-4" />
                  작품 만들기
                </button>
              )}
            </section>
          </div>
        )}
      </div>

      {showGuide && previewUrl && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-8">
          <div className="bg-[var(--bg-card)] text-[var(--text-main)] rounded-[28px] p-5 w-full max-w-[340px] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
            <p className="text-[14px] font-extrabold">사진 앱에 저장하는 방법</p>
            <p className="text-[12px] mt-2 leading-relaxed text-[var(--text-muted)]">
              아래 이미지를 <strong className="text-[var(--text-main)]">길게 눌러</strong> 「이미지 저장」 또는 「사진에
              추가」를 선택해 주세요.
            </p>
            <div className="mt-3 rounded-xl overflow-hidden border border-[var(--border-color)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="저장용 이미지" className="w-full h-auto" />
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full h-11 rounded-[30px] bg-[#175138] text-white font-bold text-[13px]"
              style={{ color: "#ffffff" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
