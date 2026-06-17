import { RecipeCatalogClient } from "@/app/recetas/RecipeCatalogClient";
import { listRecipeCatalogItems } from "@/app/lib/recipes";

export default async function RecetasPage() {
  const recipes = await listRecipeCatalogItems();

  return (
    <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
          Recetas
        </h2>
      </div>

      <div className="-mt-2 sm:-mt-3">
        <RecipeCatalogClient recipes={recipes} />
      </div>
    </section>
  );
}
