import type { ReactNode } from "react";

import { RecipesMobile } from "@/app/components/recetas/RecipesMobile";
import { RecipeCatalogClient } from "@/app/recetas/RecipeCatalogClient";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { listFoodsForUser } from "@/app/lib/foods";
import { listRecipeCatalogItems } from "@/app/lib/recipes";

export default async function RecetasPage() {
  const auth = await getOptionalAuthContext();
  // Ingredientes: alimentos propios y del catálogo (la receta guarda nombre y macros de cada uno).
  const [recipes, foods] = await Promise.all([listRecipeCatalogItems(), auth ? listFoodsForUser(auth.user.id) : Promise.resolve([])]);
  const viewer = auth ? { profileId: auth.profile.id, isAdmin: auth.profile.role === "admin" } : null;

  return (
    <Responsive
      mobile={<RecipesMobile recipes={recipes} foods={foods} viewer={viewer} />}
      desktop={
        <section className="page-frame content-start bg-[linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Recetas
            </h2>
          </div>

          <div className="-mt-2 sm:-mt-3">
            <RecipeCatalogClient recipes={recipes} foods={foods} viewer={viewer} />
          </div>
        </section>
      }
    />
  );
}

/** Mobile (<1024, DESIGN.md §18) sin `MobileHeader`; desktop con su grilla de siempre. */
function Responsive({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <div className="h-full lg:hidden">
        <section className="page-frame recetas-frame relative isolate auto-rows-max content-start bg-[var(--background)]">
          <div className="flex flex-col">
            <div aria-hidden="true" className="home-safe-top" />
            {mobile}
          </div>
        </section>
      </div>
      <div className="hidden lg:contents">{desktop}</div>
    </>
  );
}
