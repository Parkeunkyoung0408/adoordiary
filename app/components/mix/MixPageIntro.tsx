export default function MixPageIntro({ step }: { step?: string }) {
  return (
    <div className="text-center pt-1 pb-2">
      <p className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">adoor gyumdang</p>
      <h1 className="text-[20px] font-extrabold mt-1 leading-snug text-[var(--text-main)]">네 글자 아트웍 믹스</h1>
      {step && <p className="text-[11px] font-bold text-[var(--text-muted)] mt-1">{step}</p>}
      <p className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
        지금 떠오르는 생각을 네 글자로, 16종 아트웍에 담아보세요.
      </p>
    </div>
  );
}
