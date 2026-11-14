import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rajdhani, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/common/Providers";
import { THEME_META_MAP, DEFAULT_THEME } from "../lib/themes";

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
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: DEFAULT_THEME.themeColor,
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

const inlineThemeScript = `(function(){try{var m=${JSON.stringify(THEME_META_MAP)};var t=localStorage.getItem('studyio-theme')||'rank';if(!m[t])t='rank';var e=m[t];document.documentElement.dataset.theme=t;if(e.scheme==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}document.documentElement.style.backgroundColor=e.themeColor;var tc=document.getElementById('theme-color-meta');if(tc)tc.setAttribute('content',e.themeColor);var cs=document.getElementById('color-scheme-meta');if(cs)cs.setAttribute('content',e.scheme);var as=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(as)as.setAttribute('content',e.scheme==='light'?'default':'black-translucent');}catch(e){document.documentElement.dataset.theme='rank';}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} ${chakraPetch.variable} dark antialiased`}
    >
      <head>
        <meta name="theme-color" id="theme-color-meta" content={DEFAULT_THEME.themeColor} />
        <meta name="color-scheme" id="color-scheme-meta" content={DEFAULT_THEME.scheme} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: inlineThemeScript,
          }}
        />
      </head>
      <body className="min-h-screen overflow-x-clip flex flex-col text-[var(--text)] bg-[var(--bg)] dark antialiased selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
