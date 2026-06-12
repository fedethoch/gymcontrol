import type { ReactNode } from "react";

import { requireAdmin } from "@/app/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireAdmin();

  return children;
}
