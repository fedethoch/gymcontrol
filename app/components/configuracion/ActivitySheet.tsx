"use client";

import { ActivityMeter } from "@/app/components/configuracion/ActivityMeter";
import { OptionList } from "@/app/components/configuracion/OptionList";
import { OfflineNote, ProfileSheet } from "@/app/components/configuracion/ProfileSheet";
import type { ProfileForm } from "@/app/configuracion/useProfileForm";
import { ACTIVITY_LEVELS, type ActivityLevel } from "@/app/lib/nutrition-types";
import { ACTIVITY_COPY } from "@/app/lib/profile-plan";

const ACTIVITY_OPTIONS = ACTIVITY_LEVELS.map((level, index) => ({
  value: level,
  label: ACTIVITY_COPY[level].label,
  hint: ACTIVITY_COPY[level].hint,
  lead: <ActivityMeter level={index} />,
}));

/** Las 5 actividades (S3 y paso 5 del flujo de alta). */
export function ActivityOptions({
  value,
  onChange,
  disabled,
}: {
  value: ActivityLevel;
  onChange: (value: ActivityLevel) => void;
  disabled?: boolean;
}) {
  return (
    <OptionList label="Actividad física" options={ACTIVITY_OPTIONS} value={value} onChange={onChange} disabled={disabled} />
  );
}

/** S3 · Actividad. */
export function ActivitySheet({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ProfileForm;
}) {
  return (
    <ProfileSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Actividad"
      description="Cuánto te movés en la semana. El cambio se guarda solo."
    >
      <div className="pt-2">
        <ActivityOptions value={form.activityLevel} onChange={form.setActivityLevel} disabled={!form.online} />
      </div>
      {form.online ? null : <OfflineNote />}
    </ProfileSheet>
  );
}
