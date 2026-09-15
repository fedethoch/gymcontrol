import { RecipeCatalogClient } from "@/app/recetas/RecipeCatalogClient";
import { getOptionalAuthContext } from "@/app/lib/auth";
import { listFoodCatalogItems } from "@/app/lib/foods";
import { listRecipeCatalogItems } from "@/app/lib/recipes";

export default async function RecetasPage() {
  const auth = await getOptionalAuthContext();
  // Ingredientes solo del catálogo global: una receta pública no puede usar alimentos privados.
  const [recipes, foods] = await Promise.all([listRecipeCatalogItems(), auth ? listFoodCatalogItems() : Promise.resolve([])]);

  return (
    <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.06em] text-white">
          Recetas
        </h2>
      </div>

      <div className="-mt-2 sm:-mt-3">
        <RecipeCatalogClient
          recipes={recipes}
          foods={foods}
          viewer={auth ? { profileId: auth.profile.id, isAdmin: auth.profile.role === "admin" } : null}
        />
      </div>
    </section>
  );
}
