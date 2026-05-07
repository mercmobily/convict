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

export {
  addDays,
  dayLabelForIsoDayOfWeek,
  dayLabelFromDateOnly,
  formatLocalDateOnly,
  formatLocalDateTime,
  ISO_DAY_LABELS,
  isoDayOfWeekFromDateOnly,
  localNowDateTimeString,
  localTodayDateString,
  normalizeDateOnly,
  parseDateOnly
};
