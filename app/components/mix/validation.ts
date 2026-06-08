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
