import type { Metadata, Viewport } from "next";
import { Roboto_Mono } from "next/font/google";

const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "카드 뒤집기 | adoor gyumdang",
  description: "16종 아트웍 카드를 뒤집어 작가의 그림을 만나보세요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#222222",
};

export default function FlipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${robotoMono.className} fixed inset-0 z-[300] flex flex-col w-screen h-dvh max-w-none overflow-visible bg-[#222222] sm:rounded-none sm:border-0 sm:shadow-none`}
    >
      {children}
    </div>
  );
}
