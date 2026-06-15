import { FoodAdminClient } from "@/app/admin/alimentos/FoodAdminClient";
import { listAdminFoods } from "@/app/lib/foods";

export default async function AdminFoodsPage() {
  const foods = await listAdminFoods();

  return <FoodAdminClient initialFoods={foods} />;
}
