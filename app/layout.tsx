import type { Metadata } from "next";
import {
  DM_Serif_Display,
  JetBrains_Mono,
  Instrument_Sans,
  Noto_Sans_SC,
} from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-zh",
});

export const metadata: Metadata = {
  title: "投资决策平台",
  description: "Interactive Investment Decision Platform — 交互式投资决策平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${dmSerif.variable} ${jetbrainsMono.variable} ${instrumentSans.variable} ${notoSansSC.variable} font-[family-name:var(--font-zh)] antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
