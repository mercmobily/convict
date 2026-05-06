import { formatWorkSetLabel } from "@local/main/shared";

function workoutStatusLabel(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "scheduled":
      return "Scheduled";
    case "overdue":
      return "Overdue";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "definitely_missed":
      return "Definitely missed";
    case "rest_day":
      return "Rest day";
    case "not_started_yet":
      return "Starts later";
    default:
      return "Planned";
  }
}

function workoutStatusColor(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "scheduled":
      return "primary";
    case "overdue":
      return "warning";
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    case "definitely_missed":
      return "error";
    case "rest_day":
      return "surface-variant";
    case "not_started_yet":
      return "secondary";
    default:
      return "default";
  }
}

function exerciseCurrentStepNumber(exercise = {}) {
  const rawValue = exercise.currentProgressStepNumber ?? exercise.currentStepNumber ?? null;
  const normalizedValue = Number(rawValue || 0);
  return normalizedValue > 0 ? normalizedValue : null;
}

function exerciseCurrentStepName(exercise = {}) {
  return String(exercise.currentProgressStepName || exercise.currentStepName || "").trim();
}

function measurementLabel(unit = "") {
  const normalized = String(unit || "").trim().toLowerCase();
  return normalized === "seconds" ? "seconds" : "reps";
}

function progressionTargetSetCount(exercise = {}) {
  const explicitSetCount = Number(exercise.progressionSets || 0);
  if (explicitSetCount > 0) {
    return explicitSetCount;
  }

  return measurementLabel(exercise.measurementUnit) === "seconds" &&
    Number(exercise.progressionSeconds || 0) > 0
    ? 1
    : null;
}

function progressionTargetValue(exercise = {}) {
  if (measurementLabel(exercise.measurementUnit) === "seconds") {
    const seconds = Number(exercise.progressionSeconds || 0);
    return seconds > 0 ? seconds : null;
  }

  const reps = exercise.progressionRepsMax ?? exercise.progressionRepsMin ?? null;
  const normalizedReps = Number(reps || 0);
  return normalizedReps > 0 ? normalizedReps : null;
}

function progressionTargetLabel(exercise = {}) {
  const setCount = progressionTargetSetCount(exercise);
  const targetValue = progressionTargetValue(exercise);
  if (!targetValue) {
    return "";
  }

  const unit = measurementLabel(exercise.measurementUnit);
  return setCount && setCount > 0
    ? `${setCount} x ${targetValue} ${unit}`
    : `${targetValue} ${unit}`;
}

function exerciseStatusLabel(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    case "in_progress":
      return "In progress";
    case "logged":
      return "Logged";
    case "definitely_missed":
      return "Definitely missed";
    default:
      return "Pending";
  }
}

function exerciseStatusColor(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "success";
    case "logged":
      return "success";
    case "in_progress":
      return "info";
    case "definitely_missed":
      return "error";
    default:
      return "surface-variant";
  }
}

function exerciseDetailLine(exercise = {}) {
  const detailParts = [];
  const currentStepNumber = exerciseCurrentStepNumber(exercise);
  const currentStepName = exerciseCurrentStepName(exercise);
  const variationName = String(exercise.activeVariationName || "").trim();

  if (currentStepNumber && currentStepName) {
    detailParts.push(`Step ${currentStepNumber}: ${currentStepName}`);
  } else if (currentStepName) {
    detailParts.push(currentStepName);
  }
  if (variationName) {
    detailParts.push(`Variation: ${variationName}`);
  }

  return detailParts.join(" • ");
}

function useConvictWorkoutPresentation() {
  return {
    exerciseCurrentStepName,
    exerciseCurrentStepNumber,
    exerciseDetailLine,
    exerciseStatusColor,
    exerciseStatusLabel,
    formatWorkSetLabel,
    measurementLabel,
    progressionTargetLabel,
    workoutStatusColor,
    workoutStatusLabel
  };
}

export { useConvictWorkoutPresentation };
