import type { Metadata } from "next";
import "./globals.css";
import { GlobalKeyboardHandler } from "@/components/GlobalKeyboardHandler";

export const metadata: Metadata = {
  title: "Music Practice App",
  description: "실용음악 연습을 위한 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <GlobalKeyboardHandler />
        {children}
      </body>
    </html>
  );
}
