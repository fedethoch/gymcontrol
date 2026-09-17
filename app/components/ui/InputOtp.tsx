"use client";

import * as React from "react";
import { OTPInput, type SlotProps } from "input-otp";

import { cn } from "@/app/lib/utils";

type InputOtpProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
  success?: boolean;
  /** `display`: dígitos grandes con línea y hueco 3 + 3 (acceso mobile, DESIGN.md §17.2). */
  variant?: "cells" | "display";
  invalid?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

function Slot({
  char,
  isActive,
  hasFakeCaret,
  success,
}: SlotProps & { success?: boolean }) {
  return (
    <div
      data-slot="otp-slot"
      className={cn(
        "relative flex h-12 w-full items-center justify-center rounded-xl border bg-[var(--card-alt)] font-display text-lg font-semibold tabular-nums text-[var(--foreground)] transition-[border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        success
          ? "border-[var(--success)] text-[var(--success)] shadow-[0_0_0_3px_rgba(163,230,53,0.28)]"
          : isActive
            ? "border-[var(--accent)] shadow-[var(--focus-glow)]"
            : "border-[var(--border)]",
      )}
    >
      {char}
      {hasFakeCaret && !success ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="otp-caret h-5 w-px bg-[var(--accent-bright)]" />
        </div>
      ) : null}
    </div>
  );
}

function DisplaySlot({
  char,
  isActive,
  hasFakeCaret,
  success,
  invalid,
}: SlotProps & { success?: boolean; invalid?: boolean }) {
  return (
    <div
      data-slot="otp-slot"
      className={cn(
        "relative flex h-[4.25rem] min-w-0 flex-1 items-end justify-center border-b-2 pb-3 font-display text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums transition-[border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        success
          ? "border-[var(--success)] text-[var(--success)]"
          : invalid
            ? "border-[var(--danger)] text-[var(--danger)]"
            : isActive
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-[var(--border-strong)] text-[var(--foreground)]",
      )}
    >
      {char}
      {hasFakeCaret && !success ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3.5 flex justify-center">
          <div className="otp-caret h-9 w-0.5 bg-[var(--accent-bright)]" />
        </div>
      ) : null}
    </div>
  );
}

function InputOtp({
  value,
  onChange,
  disabled,
  autoFocus,
  onComplete,
  success,
  variant = "cells",
  invalid,
  id,
  "aria-label": ariaLabel = "Código de 6 dígitos",
  "aria-describedby": ariaDescribedBy,
}: InputOtpProps) {
  if (variant === "display") {
    return (
      <OTPInput
        id={id}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        maxLength={6}
        disabled={disabled || success}
        autoFocus={autoFocus}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy}
        containerClassName={cn(
          "group flex w-full items-end gap-2 transition-opacity duration-200",
          !success && "has-[:disabled]:opacity-50",
        )}
        render={({ slots }) => (
          <>
            {slots.map((slot, index) => (
              <React.Fragment key={index}>
                {index === 3 ? <div aria-hidden="true" className="w-2 shrink-0" /> : null}
                <DisplaySlot {...slot} success={success} invalid={invalid} />
              </React.Fragment>
            ))}
          </>
        )}
      />
    );
  }

  return (
    <OTPInput
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      maxLength={6}
      disabled={disabled || success}
      autoFocus={autoFocus}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      aria-label={ariaLabel}
      containerClassName="group flex w-full items-center gap-2 has-[:disabled]:opacity-50"
      render={({ slots }) => (
        <>
          {slots.map((slot, index) => (
            <Slot key={index} {...slot} success={success} />
          ))}
        </>
      )}
    />
  );
}

export { InputOtp };
