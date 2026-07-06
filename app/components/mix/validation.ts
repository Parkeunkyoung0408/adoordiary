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

export function sanitizeDownloadFilename(filename: string) {
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot) : ".png";
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  const safe = base.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(0, 80);
  return `${safe || "adoor-mix"}${ext}`;
}

export function dataUrlToBlob(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL");

  const header = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

export function createObjectUrlFromDataUrl(dataUrl: string) {
  return URL.createObjectURL(dataUrlToBlob(dataUrl));
}

export async function tryBlobDownload(dataUrl: string, filename: string) {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = sanitizeDownloadFilename(filename);
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
    return true;
  } catch {
    return false;
  }
}

export async function tryShareImageFile(
  dataUrl: string,
  filename: string
): Promise<"shared" | "unsupported" | "cancelled"> {
  if (typeof navigator === "undefined" || !navigator.share) return "unsupported";

  try {
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], sanitizeDownloadFilename(filename), {
      type: blob.type || "image/png",
    });

    if (navigator.canShare && !navigator.canShare({ files: [file] })) return "unsupported";

    await navigator.share({ files: [file], title: sanitizeDownloadFilename(filename) });
    return "shared";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}
