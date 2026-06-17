import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";

import { Toaster } from "sonner";

import { getOptionalAuthContext } from "@/app/lib/auth";

import {
  MobileHeader,
  MobileHeaderStateProvider,
} from "./components/shared/MobileHeader";
import { MobileTabBar } from "./components/shared/MobileTabBar";
import { PrimaryNavigation } from "./components/shared/PrimaryNavigation";
import { AppShell } from "./components/ui/AppShell";
import { PwaRuntime } from "./components/pwa/PwaRuntime";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  applicationName: "GymControl",
  title: "GymControl",
  description: "Shell base del MVP de GymControl para usuario y admin",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymControl",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/logo-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05070b",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getOptionalAuthContext();

  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>
          <PrimaryNavigation
            isAuthenticated={Boolean(auth)}
            role={auth?.profile.role ?? null}
          />
          <MobileHeaderStateProvider>
            <div className="shell-workspace">
              <MobileHeader
                isAuthenticated={Boolean(auth)}
                role={auth?.profile.role ?? null}
                displayName={auth?.profile.displayName ?? null}
              />
              <main className="shell-main">{children}</main>
            </div>
          </MobileHeaderStateProvider>
          <MobileTabBar
            isAuthenticated={Boolean(auth)}
            role={auth?.profile.role ?? null}
          />
        </AppShell>
        <PwaRuntime />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
