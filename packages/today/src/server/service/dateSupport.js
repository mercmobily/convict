import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeText } from "@jskit-ai/kernel/shared/support/normalize";
import {
  dayLabelFromDateOnly,
  isoDayOfWeekFromDateOnly,
  monthKeyFromDateOnly,
  normalizeMonthKey
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

function normalizeHistoryMonth(value = "", fallbackDate = "") {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    const fallbackMonth = monthKeyFromDateOnly(fallbackDate);
    if (!fallbackMonth) {
      throw new AppError(500, "Unable to determine the current history month.");
    }
    return fallbackMonth;
  }

  const normalizedMonth = normalizeMonthKey(normalizedValue);
  if (!normalizedMonth) {
    throw new AppError(400, "month must be a valid YYYY-MM month.");
  }

  return normalizedMonth;
}

export {
  dayLabelFromDate,
  dayOfWeekFromDate,
  normalizeHistoryMonth,
  normalizeScheduledForDate
};
