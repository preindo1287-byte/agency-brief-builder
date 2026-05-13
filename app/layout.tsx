import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agency Brief Builder",
  description: "실시간 협업형 에이전시 브리프 빌더",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
