import { RecipeAdminClient } from "@/app/admin/recetas/RecipeAdminClient";
import { listFoodCatalogItems } from "@/app/lib/foods";
import { listAdminRecipes } from "@/app/lib/recipes";

export default async function AdminRecetasPage() {
  const [recipes, foods] = await Promise.all([listAdminRecipes(), listFoodCatalogItems()]);

  return <RecipeAdminClient initialRecipes={recipes} foods={foods} />;
}
