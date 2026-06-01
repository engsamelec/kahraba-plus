import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Pull a human-readable message out of an Axios/Error/unknown thrown value.
 * Returns undefined when nothing useful is found, so callers can fall back to
 * a translated generic message: `getErrorMessage(err) ?? t("error_generic")`.
 */
export function getErrorMessage(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null) {
    const resp = (err as { response?: { data?: { error?: unknown } } }).response;
    const apiError = resp?.data?.error;
    if (typeof apiError === "string" && apiError) return apiError;
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return undefined;
}

