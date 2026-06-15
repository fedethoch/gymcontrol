"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type StatusToastProps = {
  message: string | null;
  isError?: boolean;
  /** Query params to strip from the URL after showing the toast. */
  clearParams: string[];
};

export function StatusToast({ message, isError, clearParams }: StatusToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!message) {
      return;
    }

    const toastId = `status-toast:${clearParams.join(",")}:${message}`;

    if (isError) {
      toast.error(message, { id: toastId });
    } else {
      toast.success(message, { id: toastId });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    let changed = false;
    for (const param of clearParams) {
      if (nextParams.has(param)) {
        nextParams.delete(param);
        changed = true;
      }
    }

    if (changed) {
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return null;
}
