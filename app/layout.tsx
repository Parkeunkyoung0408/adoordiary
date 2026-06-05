import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마음써방",
  description: "지금 너의 기분을 네 글자로 기록하는 마음 다이어리",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4f3ef",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)] transition-colors duration-300 p-0 sm:p-6 overflow-hidden">
        {/* Beautiful Device frame container for desktop viewports */}
        <div className="w-full max-w-[402px] h-full sm:h-[840px] sm:rounded-[36px] sm:border-[8px] sm:border-[#2d2d32] sm:shadow-[0_20px_50px_rgba(0,0,0,0.18)] bg-[var(--bg-container)] relative overflow-hidden flex flex-col transition-all duration-300">
          {children}
        </div>
      </body>
    </html>
  );
}
