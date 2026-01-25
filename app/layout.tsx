export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "가족 웹앱",
  description: "가족용 웹 애플리케이션",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}