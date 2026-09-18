"use client";

import { useState } from "react";

import { FoodForm } from "@/app/components/shared/FoodForm";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import type { Food } from "@/app/lib/nutrition-types";

/** `key` cambia en cada apertura para arrancar el formulario limpio. */
export type FoodCreateRequest = { key: number; name: string };

/** "Nuevo alimento" en bottom sheet (DESIGN.md §13.3). `request = null` = cerrado. */
export function FoodCreateDrawer({
  request,
  description = "Solo lo ves vos. Aparece en el catálogo y al registrar comidas.",
  onClose,
  onSaved,
}: {
  request: FoodCreateRequest | null;
  description?: string;
  onClose: () => void;
  onSaved: (food: Food) => void;
}) {
  // Conserva el formulario mientras el sheet se cierra.
  const [displayRequest, setDisplayRequest] = useState(request);

  if (request && request !== displayRequest) {
    setDisplayRequest(request);
  }

  return (
    <Drawer open={request !== null} onOpenChange={(open) => !open && onClose()} autoFocus>
      <DrawerContent className="max-h-[92dvh]">
        <div className="mx-auto flex min-h-0 w-full max-w-xl flex-col">
          <DrawerHeader className="px-5 pb-2 pt-3 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Nuevo alimento</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {displayRequest ? (
              <FoodForm key={displayRequest.key} initialName={displayRequest.name} onSaved={onSaved} onCancel={onClose} />
            ) : null}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
