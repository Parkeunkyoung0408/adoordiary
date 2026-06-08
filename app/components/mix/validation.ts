const regexFourLetters = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]{4}$/;

export function sanitizeFourLettersInput(raw: string) {
  return raw.replace(/\s/g, "").replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]/g, "").slice(0, 4);
}

export function isValidFourLetters(value: string) {
  const clean = sanitizeFourLettersInput(value);
  return regexFourLetters.test(clean);
}

export function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return isIOS() || /Android/i.test(navigator.userAgent);
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

export async function tryBlobDownload(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function tryShareImageFile(
  dataUrl: string,
  filename: string
): Promise<"shared" | "unsupported" | "cancelled"> {
  if (typeof navigator === "undefined" || !navigator.share) return "unsupported";
  try {
    const file = await dataUrlToFile(dataUrl, filename);
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return "unsupported";
    await navigator.share({ files: [file], title: filename });
    return "shared";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}
