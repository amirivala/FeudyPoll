import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const display = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body", weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "FeudyPoll",
  description: "Vote on your friends. The host reveals the board.",
};

export const viewport: Viewport = { themeColor: "#141a3a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
