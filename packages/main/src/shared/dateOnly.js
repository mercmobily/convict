function padDatePart(value) {
  return String(value).padStart(2, "0");
}

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
  formatLocalDateOnly,
  formatLocalDateTime,
  localNowDateTimeString,
  localTodayDateString,
  normalizeDateOnly,
  parseDateOnly
};
