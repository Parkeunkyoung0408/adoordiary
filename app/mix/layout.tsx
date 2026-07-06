import type { Metadata } from "next";
import MixShell from "../components/mix/MixShell";

const RIA_SANS_WOFF2 =
  "https://cdn.jsdelivr.net/gh/projectnoonnu/2410-1@1.0/RiaSans-ExtraBold.woff2";

export const metadata: Metadata = {
  title: "나만의 네 글자 아트웍 | adoor gyumdang",
  description: "QR로 접속해 네 글자 키워드와 20종 아트웍을 믹스하는 참여형 디지털 굿즈",
};

export default function MixLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="preload"
        href={RIA_SANS_WOFF2}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <MixShell>{children}</MixShell>
    </>
  );
}
