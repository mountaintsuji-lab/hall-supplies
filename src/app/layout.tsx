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
  title: "ポチっとな — 備品発注・管理ツール",
  description: "備品の現数入力と発注を、4ペインで直観的に行うツール",
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
