"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Download, Instagram, Send, Sparkles } from "lucide-react";
import { artworkConfigList, getArtworkConfig, getCanvasSize, getArtworkAssetUrl } from "./artworkConfig";
import { renderMixCardForInstagramFromArtwork } from "./mixInstagramExport";
import { renderMixCard } from "./canvasRenderer";
import MixLoadingVideo from "./MixLoadingVideo";
import MixModalOverlay from "./MixModalOverlay";
import MixPageIntro from "./MixPageIntro";
import { getMixText } from "./mixStorage";
import { useMixToast } from "./MixShell";
import {
  createObjectUrlFromDataUrl,
  isInAppBrowser,
  isIOS,
  isMobileDevice,
  isValidFourLetters,
  tryBlobDownload,
  tryShareImageFile,
} from "./validation";

const SERVER_UPLOAD_WEBP_QUALITY = 0.92;

async function convertDataUrlToWebp(dataUrl: string, quality = SERVER_UPLOAD_WEBP_QUALITY) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image conversion failed"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(image, 0, 0);
  const webpDataUrl = canvas.toDataURL("image/webp", quality);
  if (!webpDataUrl.startsWith("data:image/webp;base64,")) {
    throw new Error("WebP export is not supported");
  }

  return webpDataUrl;
}

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
  const [showInstaModal, setShowInstaModal] = useState(false);
  const [instaPreviewUrl, setInstaPreviewUrl] = useState<string | null>(null);
  const [guideImageUrl, setGuideImageUrl] = useState<string | null>(null);
  const [guideBlobUrl, setGuideBlobUrl] = useState<string | null>(null);
  const [isGeneratingInsta, setIsGeneratingInsta] = useState(false);
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
      const config = getArtworkConfig(artworkId);
      if (!config) return;
      setIsRendering(true);
      setPreviewUrl(null);
      try {
        const dataUrl = await renderMixCard(artworkId, text);
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
  const previewCanvasSize =
    selectedId !== null ? getCanvasSize(getArtworkConfig(selectedId) ?? artworkConfigList[0]) : null;

  const handleDownload = async () => {
    if (!previewUrl || !mixText) return;
    await downloadImage(previewUrl, `adoor-mix-${mixText}.png`);
  };

  useEffect(() => {
    if (!showGuide || !guideImageUrl) {
      setGuideBlobUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    try {
      objectUrl = createObjectUrlFromDataUrl(guideImageUrl);
      setGuideBlobUrl(objectUrl);
    } catch {
      setGuideBlobUrl(guideImageUrl);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [showGuide, guideImageUrl]);

  const openSaveGuide = (dataUrl: string) => {
    setGuideImageUrl(dataUrl);
    setShowInstaModal(false);
    setShowGuide(true);
  };

  const downloadImage = async (dataUrl: string, filename: string) => {
    if (inApp) {
      openSaveGuide(dataUrl);
      return;
    }

    if (isIOS()) {
      const shareResult = await tryShareImageFile(dataUrl, filename);
      if (shareResult === "shared") {
        showToast("공유 메뉴에서 '이미지 저장'을 선택해 주세요");
        return;
      }
      if (shareResult === "cancelled") return;
      openSaveGuide(dataUrl);
      return;
    }

    if (isMobileDevice()) {
      const downloaded = await tryBlobDownload(dataUrl, filename);
      if (downloaded) {
        showToast("이미지를 저장했어요!");
        return;
      }

      const shareResult = await tryShareImageFile(dataUrl, filename);
      if (shareResult === "shared") {
        showToast("공유 메뉴에서 '이미지 저장'을 선택해 주세요");
        return;
      }
      if (shareResult === "cancelled") return;
      openSaveGuide(dataUrl);
      return;
    }

    const downloaded = await tryBlobDownload(dataUrl, filename);
    if (downloaded) {
      showToast("이미지를 저장했어요!");
      return;
    }

    showToast("저장에 실패했어요. 다시 시도해주세요.");
  };

  const handleGuideShare = async () => {
    if (!guideImageUrl || !mixText) return;
    const shareResult = await tryShareImageFile(guideImageUrl, `adoor-mix-${mixText}.png`);
    if (shareResult === "shared") {
      showToast("공유 메뉴에서 '이미지 저장'을 선택해 주세요");
    }
  };

  const handleInstagram = async () => {
    if (!previewUrl || selectedId === null) return;
    const config = getArtworkConfig(selectedId);
    if (!config) return;

    setIsGeneratingInsta(true);
    try {
      const url = await renderMixCardForInstagramFromArtwork(previewUrl, config);
      setInstaPreviewUrl(url);
      setShowInstaModal(true);
    } catch {
      showToast("인스타용 이미지 만들기에 실패했어요.");
    } finally {
      setIsGeneratingInsta(false);
    }
  };

  const handleInstaDownload = async () => {
    if (!instaPreviewUrl || !mixText) return;
    await downloadImage(instaPreviewUrl, `adoor-mix-${mixText}-instagram.png`);
  };

  const handleSend = async () => {
    if (!previewUrl || selectedId === null || !mixText) return;
    setIsSending(true);
    try {
      const uploadImageUrl = await convertDataUrlToWebp(previewUrl);
      const res = await fetch("/api/visitor-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_text: mixText,
          artwork_id: selectedId,
          imageDataUrl: uploadImageUrl,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      showToast("작가에게 전송했어요! 방명록에 남겼습니다");
      router.push("/mix/guestbook");
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
            ? "flex flex-col min-h-[calc(100dvh-88px)] overflow-hidden px-4 py-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))]"
            : showLoading
              ? "relative w-full h-[calc(100dvh-88px)] px-4"
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
                <div
                  className="relative shrink-0 w-[min(100%,300px)] rounded-[20px] overflow-hidden border border-[var(--border-color)] shadow-[var(--shadow-md)]"
                  style={
                    previewCanvasSize
                      ? { aspectRatio: `${previewCanvasSize.width} / ${previewCanvasSize.height}` }
                      : undefined
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="믹스 카드 결과"
                    width={previewCanvasSize?.width}
                    height={previewCanvasSize?.height}
                    className="block h-full w-full object-contain"
                  />
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
                  onClick={handleInstagram}
                  disabled={isGeneratingInsta}
                  className="w-full h-11 rounded-[30px] bg-white border-2 border-[#175138] text-[#175138] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform touch-manipulation disabled:opacity-40"
                  style={{ color: "#175138" }}
                >
                  <Instagram className="w-4 h-4" />
                  {isGeneratingInsta ? "만드는 중..." : "인스타 올리기"}
                </button>
                <Link
                  href="/mix/guestbook"
                  className="w-full h-11 rounded-[30px] bg-white border-2 border-[var(--border-color)] text-[#175138] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                  style={{ color: "#175138" }}
                >
                  <BookOpen className="w-4 h-4" />
                  방명록 보기
                </Link>
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
          <div className="absolute left-0 right-0 flex justify-center" style={{ top: "120px" }}>
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
                        src={getArtworkAssetUrl(item.filename)}
                        alt={`아트웍 ${item.artwork_id}`}
                        fill
                        sizes="96px"
                        unoptimized
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

      {showInstaModal && instaPreviewUrl && (
        <MixModalOverlay>
          <div className="bg-[var(--bg-card)] text-[var(--text-main)] rounded-[28px] p-5 w-full max-w-[340px] border border-[var(--border-color)] shadow-[var(--shadow-lg)] flex flex-col max-h-[min(72dvh,calc(100dvh-220px))]">
            <p className="text-[14px] font-extrabold shrink-0">인스타그램용 이미지</p>
            <p className="text-[12px] mt-2 leading-relaxed text-[var(--text-muted)] shrink-0">
              4:5 비율(1080×1350) · 카드 형태 그대로 저장할 수 있어요.
            </p>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-inner)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={instaPreviewUrl}
                alt="인스타그램용 이미지"
                className="w-full h-auto max-h-[36dvh] object-contain block mx-auto"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={handleInstaDownload}
                className="h-11 rounded-[30px] bg-[#175138] text-white font-bold text-[13px] flex items-center justify-center gap-1.5"
                style={{ color: "#ffffff" }}
              >
                <Download className="w-4 h-4" />
                저장하기
              </button>
              <button
                type="button"
                onClick={() => setShowInstaModal(false)}
                className="h-11 rounded-[30px] bg-white border-2 border-[var(--border-color)] text-[#175138] font-bold text-[13px]"
                style={{ color: "#175138" }}
              >
                닫기
              </button>
            </div>
          </div>
        </MixModalOverlay>
      )}

      {showGuide && guideImageUrl && (
        <MixModalOverlay>
          <div className="bg-[var(--bg-card)] text-[var(--text-main)] rounded-[28px] p-5 w-full max-w-[340px] border border-[var(--border-color)] shadow-[var(--shadow-lg)] flex flex-col max-h-[min(72dvh,calc(100dvh-220px))]">
            <p className="text-[14px] font-extrabold shrink-0">사진 앱에 저장하는 방법</p>
            <p className="text-[12px] mt-2 leading-relaxed text-[var(--text-muted)] shrink-0">
              아래 이미지를 <strong className="text-[var(--text-main)]">길게 눌러</strong> 「이미지 저장」 또는 「사진에
              추가」를 선택해 주세요.
            </p>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-inner)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={guideBlobUrl ?? guideImageUrl}
                alt="저장용 이미지"
                className="w-full h-auto max-h-[36dvh] object-contain block mx-auto touch-manipulation"
              />
            </div>
            {!inApp && typeof navigator !== "undefined" && "share" in navigator ? (
              <button
                type="button"
                onClick={() => void handleGuideShare()}
                className="mt-3 w-full h-11 shrink-0 rounded-[30px] bg-[var(--button-secondary-bg)] border-2 border-[#175138] text-[#175138] font-bold text-[13px]"
              >
                공유 메뉴로 저장
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setShowGuide(false);
                setGuideImageUrl(null);
              }}
              className="mt-3 w-full h-11 shrink-0 rounded-[30px] bg-[#175138] text-white font-bold text-[13px]"
              style={{ color: "#ffffff" }}
            >
              닫기
            </button>
          </div>
        </MixModalOverlay>
      )}
    </div>
  );
}
