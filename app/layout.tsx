import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";

import { Toaster } from "sonner";

import { getOptionalAuthContext } from "@/app/lib/auth";

import {
  MobileHeader,
  MobileHeaderStateProvider,
} from "./components/shared/MobileHeader";
import { MobileTabBar } from "./components/shared/MobileTabBar";
import { PrimaryNavigation } from "./components/shared/PrimaryNavigation";
import { WorkoutSyncRunner } from "./components/shared/WorkoutSyncRunner";
import { AppShell } from "./components/ui/AppShell";
import { MotionProvider } from "./components/ui/MotionProvider";
import { PushRuntime } from "./components/pwa/PushRuntime";
import { PwaRuntime } from "./components/pwa/PwaRuntime";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const bodyFont = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = Geist_Mono({
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
        <MotionProvider>
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
        </MotionProvider>
        <PwaRuntime />
        {auth ? <WorkoutSyncRunner userId={auth.user.id} /> : null}
        {auth ? <PushRuntime /> : null}
        <Toaster
          theme="dark"
          richColors
          position="top-center"
          offset={{ top: "calc(env(safe-area-inset-top) + 24px)" }}
          mobileOffset={{
            top: "calc(env(safe-area-inset-top) + 16px)",
            left: 16,
            right: 16,
          }}
        />
      </body>
    </html>
  );
}
