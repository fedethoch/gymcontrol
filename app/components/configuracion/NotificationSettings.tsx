"use client";

import type { ReactNode } from "react";
import { Bell, BellOff, CalendarCheck, Dumbbell, Share, SquarePlus, Timer, Utensils } from "lucide-react";

import type { PushDevice } from "@/app/components/configuracion/usePushDevice";
import { Button } from "@/app/components/ui/Button";
import { LoadingDots } from "@/app/components/ui/LoadingDots";
import { Switch } from "@/app/components/ui/Switch";
import type { NotificationPrefsForm } from "@/app/configuracion/useNotificationPrefs";
import {
  MEAL_REMINDER_TYPES,
  normalizeTime,
  type MealReminderType,
  type ReminderSetting,
} from "@/app/lib/notifications";
import { WEEKDAYS } from "@/app/lib/training-schedule";
import { cn } from "@/app/lib/utils";

const MEAL_LABELS: Record<MealReminderType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
};

const ROW = "flex items-center gap-2.5 border-b border-[var(--border)]";
const GROUP_LABEL = "mb-1 mt-7 text-[13px] font-medium text-[var(--foreground-muted)]";
const TITLE = "font-display text-xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)]";
const BODY = "text-[15px] leading-normal text-[var(--foreground-muted)]";

/** Contenido de S7 (DESIGN.md §15.2): estado del dispositivo y, activadas, qué avisos y a qué hora. */
export function NotificationSettings({
  device,
  form,
  hasNutritionProfile,
}: {
  device: PushDevice;
  form: NotificationPrefsForm;
  hasNutritionProfile: boolean;
}) {
  return (
    <div className="flex flex-col pt-4">
      <DeviceBlock device={device} />
      {device.status === "subscribed" ? (
        <Preferences form={form} hasNutritionProfile={hasNutritionProfile} />
      ) : null}
      {device.swVersion ? (
        <p className="mt-6 text-xs text-[var(--foreground-subtle)]">Versión de avisos {device.swVersion}</p>
      ) : null}
    </div>
  );
}

function DeviceBlock({ device }: { device: PushDevice }) {
  switch (device.status) {
    case "loading":
      return (
        <div aria-busy="true" className="flex h-24 items-center justify-center">
          <LoadingDots />
        </div>
      );
    case "subscribed":
      return (
        <div className="flex flex-col gap-3.5 rounded-[14px] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--card-alt)]">
              <Bell aria-hidden="true" className="size-5 text-[var(--accent-bright)]" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-[15px] font-medium text-[var(--foreground)]">Activadas en {device.deviceLabel}</p>
              <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
                Llegan a cada celu donde las actives.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent text-[15px]"
              disabled={device.busy !== null}
              onClick={() => void device.test()}
            >
              {device.busy === "test" ? <LoadingDots /> : "Probar notificación"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-3 text-[15px] font-medium"
              disabled={device.busy !== null}
              onClick={() => void device.disable()}
            >
              {device.busy === "disable" ? <LoadingDots /> : "Desactivar"}
            </Button>
          </div>
        </div>
      );
    case "default":
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className={TITLE}>Enterate sin abrir la app</h3>
            <p className={BODY}>Te avisamos en el momento justo. Vos elegís cuáles y a qué hora.</p>
          </div>
          <ul className="border-t border-[var(--border)]">
            <FeatureItem icon={<Dumbbell aria-hidden="true" className="size-[18px]" />}>Qué entreno te toca hoy</FeatureItem>
            <FeatureItem icon={<Utensils aria-hidden="true" className="size-[18px]" />}>Cuándo registrar cada comida</FeatureItem>
            <FeatureItem icon={<Timer aria-hidden="true" className="size-[18px]" />}>Cuándo termina el descanso</FeatureItem>
            <FeatureItem icon={<CalendarCheck aria-hidden="true" className="size-[18px]" />}>Cómo te fue en la semana</FeatureItem>
          </ul>
          <div className="flex flex-col gap-2.5">
            <Button
              type="button"
              className="h-[52px] rounded-[14px] text-base"
              disabled={device.busy !== null}
              onClick={() => void device.enable()}
            >
              {device.busy === "enable" ? <LoadingDots /> : "Activar notificaciones"}
            </Button>
            <p className="text-center text-[13px] text-[var(--foreground-muted)]">Tu celu te va a pedir permiso.</p>
          </div>
        </div>
      );
    case "needs_install":
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className={TITLE}>Instalá la app para recibir avisos</h3>
            <p className={BODY}>
              En iPhone los avisos llegan solo con GymControl en la pantalla de inicio (iOS 16.4 o más nuevo).
            </p>
          </div>
          <ol className="border-t border-[var(--border)]">
            <InstallStep number={1} icon={<Share aria-hidden="true" className="size-5" />}>
              Tocá Compartir en Safari
            </InstallStep>
            <InstallStep number={2} icon={<SquarePlus aria-hidden="true" className="size-5" />}>
              Elegí “Agregar a inicio”
            </InstallStep>
            <InstallStep number={3}>Abrí GymControl desde el ícono y volvé acá</InstallStep>
          </ol>
          <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
            Dentro de la app vas a tener que iniciar sesión otra vez.
          </p>
        </div>
      );
    case "denied":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--card-alt)]">
              <BellOff aria-hidden="true" className="size-5 text-[var(--warning)]" />
            </span>
            <h3 className={TITLE}>Los avisos están bloqueados</h3>
          </div>
          <p className={BODY}>Activalos en Ajustes › Notificaciones › GymControl y volvé a esta pantalla.</p>
          <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
            En Android: tocá el candado de la barra de direcciones › Permisos › Notificaciones.
          </p>
        </div>
      );
    case "updating":
      return (
        <div className="flex flex-col gap-2">
          <h3 className={TITLE}>Actualizando la app…</h3>
          <p className={BODY}>Si tarda, cerrala del todo y volvé a abrirla.</p>
        </div>
      );
    default:
      return (
        <div className="flex flex-col gap-2">
          <h3 className={TITLE}>Avisos no disponibles</h3>
          <p className={BODY}>Este navegador no puede recibir avisos. Probá desde el celu con la app instalada.</p>
        </div>
      );
  }
}

function FeatureItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex min-h-[52px] items-center gap-3 border-b border-[var(--border)] text-[15px] text-[var(--foreground)]">
      <span className="text-[var(--foreground-muted)]">{icon}</span>
      {children}
    </li>
  );
}

function InstallStep({ number, icon, children }: { number: number; icon?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex min-h-[52px] items-center gap-3 border-b border-[var(--border)]">
      <span className="w-5 font-mono text-[13px] text-[var(--foreground-muted)]">{number}</span>
      <span className="flex-1 text-[15px] text-[var(--foreground)]">{children}</span>
      {icon ? <span className="text-[var(--foreground-muted)]">{icon}</span> : null}
    </li>
  );
}

function Preferences({ form, hasNutritionProfile }: { form: NotificationPrefsForm; hasNutritionProfile: boolean }) {
  const { prefs, setPrefs } = form;

  function setMeal(type: MealReminderType, next: ReminderSetting) {
    setPrefs((current) => ({ ...current, meals: { ...current.meals, [type]: next } }));
  }

  return (
    <>
      <p className={GROUP_LABEL}>Entrenamiento</p>
      <div className="border-t border-[var(--border)]">
        <ReminderRow
          label="Hoy toca entrenar"
          hint="En tus días de entreno"
          setting={prefs.training}
          onChange={(training) => setPrefs((current) => ({ ...current, training }))}
        />
        <div className={cn(ROW, "min-h-16 py-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[15px] font-medium text-[var(--foreground)]">Fin del descanso</p>
            <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
              Cuando termina el timer, con el celu bloqueado
            </p>
          </div>
          <Switch
            label="Fin del descanso"
            checked={prefs.restEnd}
            onCheckedChange={(restEnd) => setPrefs((current) => ({ ...current, restEnd }))}
          />
        </div>
      </div>

      <p className={GROUP_LABEL}>Comidas</p>
      <div className="border-t border-[var(--border)]">
        {MEAL_REMINDER_TYPES.map((type) => (
          <ReminderRow
            key={type}
            label={MEAL_LABELS[type]}
            setting={prefs.meals[type]}
            onChange={(next) => setMeal(type, next)}
          />
        ))}
      </div>
      <p className="mt-2.5 text-[13px] leading-snug text-[var(--foreground-muted)]">
        {hasNutritionProfile
          ? "Solo te avisamos si esa comida sigue sin registrar."
          : "Te llegan cuando calcules tu plan de nutrición."}
      </p>

      <p className={GROUP_LABEL}>Resumen semanal</p>
      <div className="border-t border-[var(--border)]">
        <div className={cn(ROW, "min-h-16 py-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[15px] font-medium text-[var(--foreground)]">Tus últimos 7 días</p>
            <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">
              Entrenos, días registrados y en objetivo
            </p>
          </div>
          <Switch
            label="Resumen semanal"
            checked={prefs.weekly.enabled}
            onCheckedChange={(enabled) => setPrefs((current) => ({ ...current, weekly: { ...current.weekly, enabled } }))}
          />
        </div>
        <div role="radiogroup" aria-label="Día del resumen" className="grid grid-cols-7 gap-1.5 py-3.5">
          {WEEKDAYS.map((day) => {
            const checked = prefs.weekly.isoDay === day.iso;
            return (
              <button
                key={day.iso}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={day.name}
                disabled={!prefs.weekly.enabled}
                onClick={() => setPrefs((current) => ({ ...current, weekly: { ...current.weekly, isoDay: day.iso } }))}
                className={cn(
                  "h-12 min-w-0 rounded-[14px] border font-display text-[15px] font-bold outline-none transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:shadow-[var(--focus-glow)] active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100",
                  checked
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                    : "border-[var(--border-strong)] text-[var(--foreground-muted)]",
                )}
              >
                {day.short}
              </button>
            );
          })}
        </div>
        <div className={cn(ROW, "min-h-14 border-t")}>
          <p className="flex-1 text-[15px] font-medium text-[var(--foreground)]">Hora</p>
          <TimeInput
            label="Hora del resumen semanal"
            value={prefs.weekly.time}
            disabled={!prefs.weekly.enabled}
            onChange={(time) => setPrefs((current) => ({ ...current, weekly: { ...current.weekly, time } }))}
          />
        </div>
      </div>
    </>
  );
}

function ReminderRow({
  label,
  hint,
  setting,
  onChange,
}: {
  label: string;
  hint?: string;
  setting: ReminderSetting;
  onChange: (next: ReminderSetting) => void;
}) {
  return (
    <div className={cn(ROW, hint ? "min-h-16 py-2" : "min-h-14")}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "text-[15px] font-medium",
            setting.enabled ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
          )}
        >
          {label}
        </p>
        {hint ? <p className="text-[13px] leading-snug text-[var(--foreground-muted)]">{hint}</p> : null}
      </div>
      <TimeInput
        label={`Hora del aviso: ${label.toLowerCase()}`}
        value={setting.time}
        disabled={!setting.enabled}
        onChange={(time) => onChange({ ...setting, time })}
      />
      <Switch label={label} checked={setting.enabled} onCheckedChange={(enabled) => onChange({ ...setting, enabled })} />
    </div>
  );
}

/** `<input type="time">` nativo (rueda de iOS) en una pastilla mono de 36px. */
function TimeInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="time"
      aria-label={label}
      value={value}
      disabled={disabled}
      data-vaul-no-drag=""
      onChange={(event) => onChange(normalizeTime(event.target.value, value))}
      className="h-9 w-[5.5rem] shrink-0 appearance-none rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-2 text-center font-mono text-[15px] tabular-nums text-[var(--foreground)] outline-none focus-visible:shadow-[var(--focus-glow)] disabled:bg-transparent disabled:text-[var(--foreground-subtle)] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-date-and-time-value]:text-center"
    />
  );
}
