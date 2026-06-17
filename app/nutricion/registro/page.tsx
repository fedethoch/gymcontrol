import { RegistroClient } from "@/app/nutricion/registro/RegistroClient";
import { requireUser } from "@/app/lib/auth";
import { listFoodCatalogItems } from "@/app/lib/foods";
import { calculateNutritionPlan } from "@/app/lib/nutrition-calc";
import { MOCK_PROFILE_DEFAULTS } from "@/app/lib/nutrition-mock";
import {
  getDailyKcalAverage,
  getLocalTrainingDate,
  getLoggedDatesForUser,
  getMealLogForDate,
} from "@/app/lib/meal-logs";
import { getNutritionProfile } from "@/app/lib/nutrition-profile";

export default async function RegistroNutricionPage() {
  const auth = await requireUser();
  const logDate = getLocalTrainingDate();

  const [foods, mealLog, profile, loggedDates, avgDailyKcal] = await Promise.all([
    listFoodCatalogItems(),
    getMealLogForDate({ userId: auth.user.id, logDate }),
    getNutritionProfile(auth.user.id),
    getLoggedDatesForUser({ userId: auth.user.id, days: 70 }),
    getDailyKcalAverage({ userId: auth.user.id, days: 30 }),
  ]);

  const plan = profile?.plan ?? calculateNutritionPlan(MOCK_PROFILE_DEFAULTS);

  return (
    <section className="page-frame content-start bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.15),transparent_31%),linear-gradient(180deg,#070a12_0%,#090d16_52%,#05070b_100%)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b985ff]">Nutrición</p>
      </div>

      <RegistroClient
        foods={foods}
        logDate={logDate}
        initialMeals={mealLog?.meals ?? []}
        targetKcal={plan.targetKcal}
        targetMacros={plan.macros}
        loggedDates={[...loggedDates]}
        avgDailyKcal={avgDailyKcal}
      />
    </section>
  );
}
