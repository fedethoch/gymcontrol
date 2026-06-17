import type { Metadata } from "next";
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
  title: "GymControl",
  description: "Shell base del MVP de GymControl para usuario y admin",
  icons: {
    icon: [
      { url: "/logo/logo.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo/logo.png",
  },
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
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
