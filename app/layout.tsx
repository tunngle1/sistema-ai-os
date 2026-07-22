import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Система AI OS",
  description: "AI Operating System для ведущих игры «Система»",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
