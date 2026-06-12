import type { ReactNode } from "react";

import { requireUser } from "@/app/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireUser();

  return children;
}
