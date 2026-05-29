import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ホール備品 — 在庫連動・発注",
  description: "在庫と連動した発注候補の4ペイン管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-dvh w-full antialiased`}
    >
      <body className="m-0 flex h-dvh min-h-0 w-full flex-col overflow-hidden p-0">
        {children}
      </body>
    </html>
  );
}
