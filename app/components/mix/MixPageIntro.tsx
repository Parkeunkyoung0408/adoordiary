import type { ReactNode } from "react";

export default function MixPageIntro({
  step,
  stepAction,
}: {
  step?: string;
  stepAction?: ReactNode;
}) {
  return (
    <div className="text-center pt-1 pb-2">
      <p className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">adoor gyumdang</p>
      <h1 className="text-[20px] font-extrabold mt-1 leading-snug text-[var(--text-main)]">나만의 네 글자 아트웍</h1>
      {step &&
        (stepAction ? (
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-[11px] font-bold text-[var(--text-muted)]">{step}</p>
            {stepAction}
          </div>
        ) : (
          <p className="text-[11px] font-bold text-[var(--text-muted)] mt-1">{step}</p>
        ))}
    </div>
  );
}