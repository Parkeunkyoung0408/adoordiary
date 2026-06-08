"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Send } from "lucide-react";
import { artworkConfigList } from "./artworkConfig";
import { renderMixCard } from "./canvasRenderer";
import MixPageIntro from "./MixPageIntro";
import { getMixText } from "./mixStorage";
import { useMixToast } from "./MixShell";
import { isInAppBrowser, isValidFourLetters } from "./validation";

export default function MixArtworkScreen() {
  const router = useRouter();
  const { showToast } = useMixToast();
  const [mixText, setMixText] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
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
      } finally {
        setIsRendering(false);
      }
    },
    [showToast]
  );

  const handleArtworkPick = (id: number) => {
    if (!mixText) return;
    setSelectedId(id);
    generatePreview(id, mixText);
  };

  const handleDownload = () => {
    if (!previewUrl || !mixText) return;
    if (inApp) {
      setShowGuide(true);
      return;
    }
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `adoor-mix-${mixText}.png`;
    link.click();
    showToast("이미지를 저장했어요!");
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
    <div className="flex flex-col flex-1 min-h-0 text-[var(--text-main)]">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <MixPageIntro step="STEP 2 · 아트웍 선택" />

        <section className="glass-panel-sm rounded-[24px] px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-extrabold text-[var(--text-main)]">16종 중 하나를 골라주세요</p>
            <Link
              href="/mix/edit"
              className="text-[11px] font-bold text-[var(--nav-active-text)] underline underline-offset-2"
            >
              글자 수정
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
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
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
        </section>

        {(isRendering || previewUrl) && (
          <section className="glass-panel-sm rounded-[24px] px-4 py-4 space-y-3">
            <div>
              <p className="text-[11px] font-bold text-[var(--text-muted)]">STEP 3</p>
              <p className="text-[14px] font-extrabold text-[var(--text-main)]">믹스 결과</p>
            </div>

            {isRendering ? (
              <div className="aspect-[9/16] rounded-[20px] bg-[var(--bg-card-inner)] border border-[var(--border-color)] flex items-center justify-center text-[13px] text-[var(--text-muted)]">
                합성 중...
              </div>
            ) : previewUrl ? (
              <div className="rounded-[20px] overflow-hidden border border-[var(--border-color)] shadow-[var(--shadow-md)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="믹스 카드 결과" className="w-full h-auto block" />
              </div>
            ) : null}

            {previewUrl && !isRendering && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="h-11 rounded-[30px] bg-[var(--button-secondary-bg)] border-2 border-[#175138] text-[var(--button-secondary-text)] font-bold text-[13px] flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  저장하기
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="h-11 rounded-[30px] bg-[#175138] text-white font-bold text-[13px] flex items-center justify-center gap-1.5 border-2 border-[#175138] disabled:opacity-40"
                  style={{ color: "#ffffff" }}
                >
                  <Send className="w-4 h-4" />
                  {isSending ? "전송 중..." : "작가에게 전송"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {showGuide && previewUrl && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-8">
          <div className="bg-[var(--bg-card)] text-[var(--text-main)] rounded-[28px] p-5 w-full max-w-[340px] border border-[var(--border-color)] shadow-[var(--shadow-lg)]">
            <p className="text-[14px] font-extrabold">사진 앱에 저장하는 방법</p>
            <p className="text-[12px] mt-2 leading-relaxed text-[var(--text-muted)]">
              기기 제약으로 인해 이미지를 <strong className="text-[var(--text-main)]">1초간 길게 눌러</strong> [사진 앱에
              저장]을 진행해 주세요.
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
