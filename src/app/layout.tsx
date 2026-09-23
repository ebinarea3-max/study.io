import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rajdhani, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/common/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-hud",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-hud-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#080b12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "study.io - Collaborative Study & Focus Tracker",
  description: "study.io is a modern full-stack collaborative study application with live virtual study rooms, subject tracking, stopwatch/pomodoro timers, daily planner, and in-depth analytics.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "study.io",
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${chakraPetch.variable} dark antialiased`}
    >
      <body className="min-h-screen overflow-x-hidden flex flex-col text-slate-200 bg-[var(--bg)] dark antialiased selection:bg-[var(--tier-accent)]/30 selection:text-[var(--tier-accent)]">
        <Providers>
          {children}
          </Providers>
      </body>
    </html>
  );
}
