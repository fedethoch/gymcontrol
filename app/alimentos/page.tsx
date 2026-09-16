import type { ReactNode } from "react";

import { NutritionCatalogClient } from "@/app/alimentos/NutritionCatalogClient";
import { FoodsMobile } from "@/app/components/alimentos/FoodsMobile";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { listFoodCatalogItems, listFoodsForUser } from "@/app/lib/foods";
import { listFrequentItems } from "@/app/lib/meal-logs";
import type { FrequentItem } from "@/app/lib/nutrition-types";

/** Frecuentes es opcional: si falla la lectura, la pantalla sigue sin esa sección. */
async function readFrequentItems(userId: string): Promise<FrequentItem[]> {
  try {
    const items = await listFrequentItems({ userId, limit: 30 });
    return items.filter((item) => item.kind === "food");
  } catch {
    return [];
  }
}

export default async function AlimentosPage() {
  const auth = await getOptionalAuthContext();
  const [foods, frequent] = auth
    ? await Promise.all([listFoodsForUser(auth.user.id), readFrequentItems(auth.user.id)])
    : [await listFoodCatalogItems(), []];

  return (
    <Responsive
      mobile={<FoodsMobile foods={foods} frequent={frequent} canCreate={auth !== null} />}
      desktop={
        <section className="page-frame content-start bg-[linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
              Catálogo de alimentos
            </h2>
          </div>

          <div className="-mt-2 sm:-mt-3">
            <NutritionCatalogClient foods={foods} canCreate={auth !== null} />
          </div>
        </section>
      }
    />
  );
}

/** Mobile (<1024, DESIGN.md §13) sin `MobileHeader`; desktop con su lista de siempre. */
function Responsive({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <div className="h-full lg:hidden">
        <section className="page-frame alimentos-frame relative isolate auto-rows-max content-start bg-[var(--background)]">
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
