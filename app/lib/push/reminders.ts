import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatDayGroups, resolveTodayTraining } from "@/app/lib/home-dashboard";
import { addDaysToDateKey, getLocalMinutesOfDay, getTodayDateKey } from "@/app/lib/local-date";
import { isMealTypePending } from "@/app/lib/meal-diary";
import { getLoggedDatesForUser, getMealLogForDate, listDailyKcal } from "@/app/lib/meal-logs";
import {
  buildPushPayload,
  DEFAULT_NOTIFICATION_PREFERENCES,
  dueReminders,
  mealReminderMessage,
  NOTIFICATION_PREFERENCES_COLUMNS,
  preferencesFromRow,
  trainingReminderMessage,
  weeklySummaryMessage,
  type MealReminderType,
  type NotificationPreferencesRow,
  type PushMessage,
  type ReminderKind,
} from "@/app/lib/notifications";
import { getNutritionProfile } from "@/app/lib/nutrition-profile";
import { sendPush } from "@/app/lib/push/send";
import { listPushTargetsForUsers } from "@/app/lib/push/store";
import { dayMuscleGroups } from "@/app/lib/routine-week";
import {
  findActiveSavedRoutine,
  getSavedRoutineByIdForUser,
  listSavedRoutinesForUser,
} from "@/app/lib/saved-routines";
import { isoWeekday, resolveSchedule } from "@/app/lib/training-schedule";
import { buildWeeklySummary, WEEKLY_WINDOW_DAYS } from "@/app/lib/weekly-summary";
import { getOpenSessionForRoutine, getTrainingOverview } from "@/app/lib/workout-tracking";

type Outcome = { send: true; message: PushMessage; path: string } | { send: false; reason: string };

const skip = (reason: string): Outcome => ({ send: false, reason });

/** Datos de un usuario que comparten sus recordatorios del tick: se leen una sola vez y solo si hacen falta. */
function userData(admin: SupabaseClient, userId: string) {
  const memo = new Map<string, Promise<unknown>>();
  const once = <T>(key: string, load: () => Promise<T>) => {
    if (!memo.has(key)) memo.set(key, load());
    return memo.get(key) as Promise<T>;
  };

  const routine = () =>
    once("routine", async () => {
      const active = findActiveSavedRoutine(await listSavedRoutinesForUser(userId, admin));
      return active ? getSavedRoutineByIdForUser({ savedRoutineId: active.id, userId }, admin) : null;
    });

  const overview = () =>
    once("overview", async () => {
      const current = await routine();
      return getTrainingOverview(
        { userId, savedRoutineId: current?.id ?? null, plannedDays: current?.days.length ?? 0 },
        admin,
      );
    });

  const profile = () => once("profile", () => getNutritionProfile(userId, admin));

  return { routine, overview, profile };
}

async function evaluate(
  admin: SupabaseClient,
  userId: string,
  kind: ReminderKind,
  todayKey: string,
  data: ReturnType<typeof userData>,
): Promise<Outcome> {
  if (kind === "training") {
    const routine = await data.routine();

    if (!routine) {
      return skip("sin rutina activa");
    }

    const [overview, open] = await Promise.all([
      data.overview(),
      getOpenSessionForRoutine({ userId, savedRoutineId: routine.id }, admin),
    ]);
    const today = resolveTodayTraining({
      routine,
      completedRoutineDayIds: overview.completedRoutineDayIds,
      trainedToday: overview.trainedToday,
      openRoutineDayId: open?.routineDayId ?? null,
      todayKey,
    });
    const day = today.todayPlannedDay;

    if (today.heroState !== "ready" || !day) {
      return skip(`hoy: ${today.heroState}`);
    }

    return {
      send: true,
      message: trainingReminderMessage({
        dayOrder: day.dayOrder,
        dayCount: routine.days.length,
        label: formatDayGroups(dayMuscleGroups(day.items), day.dayName),
      }),
      path: `/rutinas/dia?savedRoutineId=${routine.id}&day=${day.dayOrder}`,
    };
  }

  if (kind === "weekly") {
    const [routine, profile] = await Promise.all([data.routine(), data.profile()]);
    const from = addDaysToDateKey(todayKey, -(WEEKLY_WINDOW_DAYS - 1));
    const [overview, loggedDates, days] = await Promise.all([
      routine ? data.overview() : null,
      profile ? getLoggedDatesForUser({ userId, days: WEEKLY_WINDOW_DAYS }, admin) : null,
      profile ? listDailyKcal({ userId, from, to: todayKey }, admin) : null,
    ]);
    const message = weeklySummaryMessage(
      buildWeeklySummary({
        todayKey,
        training:
          routine && overview
            ? {
                trainedDates: overview.completedDates,
                plannedPerWeek: resolveSchedule(routine.trainingWeekdays, routine.days.length)?.length ?? null,
              }
            : null,
        nutrition:
          profile && loggedDates && days
            ? { loggedDates: [...loggedDates], days, currentTargetKcal: profile.plan.targetKcal }
            : null,
      }),
    );

    return message ? { send: true, message, path: "/" } : skip("sin rutina ni perfil");
  }

  const type = kind.slice("meal_".length) as MealReminderType;

  if (!(await data.profile())) {
    return skip("sin perfil de nutrición");
  }

  const log = await getMealLogForDate({ userId, logDate: todayKey }, admin);

  return isMealTypePending(log?.meals ?? [], type)
    ? { send: true, message: mealReminderMessage(type), path: `/nutricion/registro?tipo=${type}` }
    : skip("comida registrada");
}

/**
 * Tick del cron (cada 5 min, DESIGN.md §6.4): por cada usuario con avisos activados, los recordatorios cuya
 * hora llegó y que hoy todavía no salieron. `push_deliveries` es el reclamo idempotente (una vez por día).
 */
export async function runReminderTick(admin: SupabaseClient, now = new Date()) {
  const todayKey = getTodayDateKey(now);
  const local = { minutes: getLocalMinutesOfDay(now), isoDay: isoWeekday(todayKey) };

  const { data: subscriptionRows, error: subscriptionsError } = await admin.from("push_subscriptions").select("user_id");

  if (subscriptionsError) {
    throw new Error("No se pudieron leer las suscripciones.");
  }

  const userIds = [...new Set((subscriptionRows ?? []).map((row) => row.user_id as string))];

  if (userIds.length === 0) {
    return { due: 0, sent: 0 };
  }

  const { data: preferenceRows } = await admin
    .from("notification_preferences")
    .select(`user_id, ${NOTIFICATION_PREFERENCES_COLUMNS}`)
    .in("user_id", userIds);
  const preferences = new Map(
    ((preferenceRows ?? []) as unknown as Array<NotificationPreferencesRow & { user_id: string }>).map((row) => [
      row.user_id,
      preferencesFromRow(row),
    ]),
  );

  const due = userIds.flatMap((userId) =>
    dueReminders(preferences.get(userId) ?? DEFAULT_NOTIFICATION_PREFERENCES, local).map((kind) => ({ userId, kind })),
  );

  if (due.length === 0) {
    return { due: 0, sent: 0 };
  }

  const dueUserIds = [...new Set(due.map((reminder) => reminder.userId))];
  const { data: deliveredRows } = await admin
    .from("push_deliveries")
    .select("user_id, kind")
    .eq("local_date", todayKey)
    .in("user_id", dueUserIds);
  const delivered = new Set((deliveredRows ?? []).map((row) => `${row.user_id}:${row.kind}`));
  const pending = due.filter((reminder) => !delivered.has(`${reminder.userId}:${reminder.kind}`));
  const targets = await listPushTargetsForUsers(admin, [...new Set(pending.map((reminder) => reminder.userId))]);
  const dataByUser = new Map<string, ReturnType<typeof userData>>();
  let sent = 0;

  for (const { userId, kind } of pending) {
    const data = dataByUser.get(userId) ?? userData(admin, userId);
    dataByUser.set(userId, data);
    let outcome: Outcome;

    try {
      outcome = await evaluate(admin, userId, kind, todayKey, data);
    } catch (error) {
      // Sin fila en push_deliveries: el próximo tick lo vuelve a intentar dentro de la ventana.
      console.error("push: no se pudo evaluar un recordatorio", {
        kind,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    const key = { user_id: userId, kind, local_date: todayKey };
    const { data: claimed } = await admin
      .from("push_deliveries")
      .upsert(
        { ...key, status: outcome.send ? "sending" : "skipped", detail: outcome.send ? null : outcome.reason },
        { onConflict: "user_id,kind,local_date", ignoreDuplicates: true },
      )
      .select("user_id");

    if (!claimed?.length || !outcome.send) {
      continue;
    }

    const message = outcome.message;
    const path = outcome.path;
    const results = await Promise.all(
      targets
        .filter((target) => target.userId === userId)
        .map((target) => sendPush(admin, target, buildPushPayload({ kind, message, origin: target.origin, path }))),
    );
    const ok = results.includes("sent");

    await admin
      .from("push_deliveries")
      .update({ status: ok ? "sent" : "failed", detail: ok ? null : results.join(",") || "sin dispositivos" })
      .match(key);

    if (ok) sent += 1;
  }

  return { due: pending.length, sent };
}
