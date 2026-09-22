"use client";

import { NotificationSettings } from "@/app/components/configuracion/NotificationSettings";
import { ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import type { PushDevice } from "@/app/components/configuracion/usePushDevice";
import type { NotificationPrefsForm } from "@/app/configuracion/useNotificationPrefs";

/** S7 · Notificaciones (DESIGN.md §15.2). */
export function NotificationsSheet({
  open,
  onOpenChange,
  device,
  form,
  hasNutritionProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: PushDevice;
  form: NotificationPrefsForm;
  hasNutritionProfile: boolean;
}) {
  return (
    <ProfileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Notificaciones"
      description="Qué avisos te llegan al celu y a qué hora."
    >
      <NotificationSettings device={device} form={form} hasNutritionProfile={hasNutritionProfile} />
    </ProfileSheet>
  );
}
