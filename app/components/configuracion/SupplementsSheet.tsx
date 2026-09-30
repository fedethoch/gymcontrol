"use client";

import { ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import {
  SupplementSettings,
  type SupplementRemindersState,
} from "@/app/components/configuracion/SupplementSettings";
import type { SupplementsForm } from "@/app/configuracion/useSupplements";

/** S8 · Suplementos (DESIGN.md §15.2). */
export function SupplementsSheet({
  open,
  onOpenChange,
  form,
  reminders,
  onOpenNotifications,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SupplementsForm;
  reminders: SupplementRemindersState;
  onOpenNotifications: () => void;
}) {
  return (
    <ProfileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Suplementos"
      description="Qué suplementos tomás y a qué hora te los recordamos."
    >
      <SupplementSettings form={form} reminders={reminders} onOpenNotifications={onOpenNotifications} />
    </ProfileSheet>
  );
}
