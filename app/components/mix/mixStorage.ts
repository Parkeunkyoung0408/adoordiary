const MIX_TEXT_KEY = "adoordiary_mix_text";

export function saveMixText(text: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MIX_TEXT_KEY, text);
}

export function getMixText(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(MIX_TEXT_KEY);
}

export function clearMixText() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(MIX_TEXT_KEY);
}
