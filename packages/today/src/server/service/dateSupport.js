import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeText } from "@jskit-ai/kernel/shared/support/normalize";
import {
  dayLabelFromDateOnly,
  isoDayOfWeekFromDateOnly
} from "@local/main/shared";

function dayOfWeekFromDate(dateString) {
  const dayOfWeek = isoDayOfWeekFromDateOnly(dateString);
  if (!dayOfWeek) {
    throw new AppError(400, `Invalid date-only value "${String(dateString || "").trim()}".`);
  }

  return dayOfWeek;
}

function dayLabelFromDate(dateString) {
  return dayLabelFromDateOnly(dateString) || "";
}

function normalizeScheduledForDate(value = "") {
  const normalized = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(400, "scheduledForDate must be a valid YYYY-MM-DD date.");
  }

  return normalized;
}

export {
  dayLabelFromDate,
  dayOfWeekFromDate,
  normalizeScheduledForDate
};
