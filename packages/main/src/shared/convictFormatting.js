function formatWorkSetLabel(min, max) {
  const safeMin = Number(min || 0);
  const safeMax = Number(max || 0);
  if (safeMin > 0 && safeMin === safeMax) {
    return `${safeMin} work sets`;
  }
  return `${safeMin}-${safeMax} work sets`;
}

function resolveScheduleExerciseName(entry = {}) {
  return String(entry?.exercise?.name || entry?.exerciseName || "").trim();
}

export {
  formatWorkSetLabel,
  resolveScheduleExerciseName
};
