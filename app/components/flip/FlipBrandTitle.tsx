/* eslint-disable @next/next/no-img-element */

export default function FlipBrandTitle() {
  return (
    <div
      className="pointer-events-none fixed z-[60]"
      style={{
        left: 100,
        top: "max(100px, calc(env(safe-area-inset-top) + 100px))",
      }}
    >
      <img
        src="/assets/flip/gugak-cheobang-logo.png"
        alt="국악처방"
        width={240}
        height={240}
        decoding="async"
        draggable={false}
        className="block h-auto w-[240px] max-w-[40vw]"
      />
    </div>
  );
}
