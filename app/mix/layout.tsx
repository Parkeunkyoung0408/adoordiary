import type { Metadata } from "next";
import MixShell from "../components/mix/MixShell";

export const metadata: Metadata = {
  title: "나만의 네 글자 아트웍 | adoor gyumdang",
  description: "QR로 접속해 네 글자 키워드와 16종 아트웍을 믹스하는 참여형 디지털 굿즈",
};

export default function MixLayout({ children }: { children: React.ReactNode }) {
  return <MixShell>{children}</MixShell>;
}
