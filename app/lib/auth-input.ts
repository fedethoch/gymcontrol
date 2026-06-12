import { z } from "zod";

const emailSchema = z.string().email();
const otpTokenSchema = z.string().regex(/^\d{6}$/);

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return emailSchema.safeParse(normalizeEmail(value)).success;
}

export function normalizeOtpToken(value: string) {
  return value.trim();
}

export function isValidOtpToken(value: string) {
  return otpTokenSchema.safeParse(normalizeOtpToken(value)).success;
}
