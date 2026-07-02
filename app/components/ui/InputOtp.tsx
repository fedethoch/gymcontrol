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
  "aria-label"?: string;
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
        "relative flex h-12 w-full items-center justify-center rounded-xl border bg-[var(--card-alt)] font-mono text-lg text-[var(--foreground)] transition-[border-color,box-shadow,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
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

function InputOtp({
  value,
  onChange,
  disabled,
  autoFocus,
  onComplete,
  success,
  "aria-label": ariaLabel = "Codigo de 6 digitos",
}: InputOtpProps) {
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
