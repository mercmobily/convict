function formatWorkSetLabel(min, max) {
  const safeMin = Number(min || 0);
  const safeMax = Number(max || 0);
  if (safeMin > 0 && safeMin === safeMax) {
    return `${safeMin} work sets`;
  }
  return `${safeMin}-${safeMax} work sets`;
}

function withoutConvictPrefix(value = "") {
  return String(value || "").replace(/^Convict\s+/i, "").trim();
}

function resolveScheduleEntryName(entry = {}) {
  const entryKind = String(entry?.entryKind || "").trim().toLowerCase();
  if (entryKind === "progression") {
    return withoutConvictPrefix(
      entry?.instanceProgression?.name ||
        entry?.progression?.name ||
        entry?.instanceProgressionName ||
        entry?.progressionName ||
        ""
    );
  }
  return String(entry?.exercise?.name || entry?.exerciseName || "").trim();
}

export {
  formatWorkSetLabel,
  resolveScheduleEntryName,
  withoutConvictPrefix
};
