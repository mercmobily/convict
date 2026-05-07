function padDatePart(value) {
  return String(value).padStart(2, "0");
}

const ISO_DAY_LABELS = Object.freeze({
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday"
});

function formatLocalDateOnly(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join("-");
}

function normalizeDateOnly(value = null) {
  if (value == null || value === "") {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatLocalDateOnly(parsedDate);
}

function parseDateOnly(dateString) {
  const source = String(dateString || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source)) {
    return null;
  }

  const [year, month, day] = source.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseMonthKey(monthKey) {
  const source = String(monthKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(source)) {
    return null;
  }

  const [year, month] = source.split("-").map(Number);
  if (month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function isoDayOfWeekFromDateOnly(dateString) {
  const date = parseDateOnly(dateString);
  if (!date) {
    return null;
  }

  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function dayLabelForIsoDayOfWeek(dayOfWeek) {
  return ISO_DAY_LABELS[Number(dayOfWeek || 0)] || "";
}

function dayLabelFromDateOnly(dateString) {
  return dayLabelForIsoDayOfWeek(isoDayOfWeekFromDateOnly(dateString));
}

function addDays(dateString, dayOffset) {
  const date = parseDateOnly(dateString);
  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + Number(dayOffset || 0));
  return formatLocalDateOnly(date);
}

function formatLocalDateTime(date) {
  return [
    formatLocalDateOnly(date),
    [padDatePart(date.getHours()), padDatePart(date.getMinutes()), padDatePart(date.getSeconds())].join(":")
  ].join(" ");
}

function localTodayDateString() {
  return formatLocalDateOnly(new Date());
}

function localNowDateTimeString() {
  return formatLocalDateTime(new Date());
}

function normalizeMonthKey(value = null) {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return [value.getFullYear(), padDatePart(value.getMonth() + 1)].join("-");
  }

  const parsedMonth = parseMonthKey(value);
  if (!parsedMonth) {
    return null;
  }

  return [parsedMonth.getFullYear(), padDatePart(parsedMonth.getMonth() + 1)].join("-");
}

function monthKeyFromDateOnly(dateString = "") {
  const parsedDate = parseDateOnly(dateString);
  if (!parsedDate) {
    return null;
  }

  return normalizeMonthKey(parsedDate);
}

function firstDateOfMonth(monthKey = "") {
  const monthDate = parseMonthKey(monthKey);
  if (!monthDate) {
    return null;
  }

  return formatLocalDateOnly(monthDate);
}

function lastDateOfMonth(monthKey = "") {
  const monthDate = parseMonthKey(monthKey);
  if (!monthDate) {
    return null;
  }

  const lastDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  return formatLocalDateOnly(lastDate);
}

function shiftMonthKey(monthKey = "", monthOffset = 0) {
  const monthDate = parseMonthKey(monthKey);
  if (!monthDate) {
    return null;
  }

  monthDate.setMonth(monthDate.getMonth() + Number(monthOffset || 0));
  return normalizeMonthKey(monthDate);
}

function firstDateOfCalendarGrid(monthKey = "") {
  const firstDate = firstDateOfMonth(monthKey);
  if (!firstDate) {
    return null;
  }

  const isoDay = isoDayOfWeekFromDateOnly(firstDate);
  if (!isoDay) {
    return null;
  }

  return addDays(firstDate, 1 - isoDay);
}

function lastDateOfCalendarGrid(monthKey = "") {
  const lastDate = lastDateOfMonth(monthKey);
  if (!lastDate) {
    return null;
  }

  const isoDay = isoDayOfWeekFromDateOnly(lastDate);
  if (!isoDay) {
    return null;
  }

  return addDays(lastDate, 7 - isoDay);
}

export {
  addDays,
  dayLabelForIsoDayOfWeek,
  dayLabelFromDateOnly,
  firstDateOfCalendarGrid,
  firstDateOfMonth,
  formatLocalDateOnly,
  formatLocalDateTime,
  ISO_DAY_LABELS,
  isoDayOfWeekFromDateOnly,
  lastDateOfCalendarGrid,
  lastDateOfMonth,
  localNowDateTimeString,
  localTodayDateString,
  monthKeyFromDateOnly,
  normalizeDateOnly,
  normalizeMonthKey,
  parseDateOnly,
  shiftMonthKey
};
