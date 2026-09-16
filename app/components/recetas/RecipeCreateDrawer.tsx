"use client";

import { useState } from "react";

import { RecipeForm } from "@/app/components/shared/RecipeForm";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/Drawer";
import type { Food, Recipe } from "@/app/lib/nutrition-types";

/** `key` cambia en cada apertura para arrancar el formulario limpio. */
export type RecipeCreateRequest = { key: number; name: string };

/** "Nueva receta" en bottom sheet (DESIGN.md §18.3). `request = null` = cerrado. */
export function RecipeCreateDrawer({
  request,
  foods,
  onClose,
  onSaved,
}: {
  request: RecipeCreateRequest | null;
  foods: Food[];
  onClose: () => void;
  onSaved: (recipe: Recipe) => void;
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
            <DrawerTitle className="text-xl font-bold tracking-[-0.02em]">Nueva receta</DrawerTitle>
            <DrawerDescription>Queda pública para todos. Calculamos kcal y macros por porción.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {displayRequest ? (
              <RecipeForm
                key={displayRequest.key}
                initialName={displayRequest.name}
                foods={foods}
                onSaved={onSaved}
                onCancel={onClose}
              />
            ) : null}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
