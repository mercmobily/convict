import { ConflictError, NotFoundError } from "@jskit-ai/kernel/server/runtime/errors";

function assertSchedulableWorkout(workoutProjection, { scheduledForDate, allowOverdue = true } = {}) {
  if (!workoutProjection) {
    throw new NotFoundError(`No scheduled workout exists for ${scheduledForDate}.`);
  }

  if (workoutProjection.status === "rest_day") {
    throw new ConflictError(`${scheduledForDate} is a rest day.`);
  }

  if (workoutProjection.status === "not_started_yet") {
    throw new ConflictError("This program has not started yet.");
  }

  if (workoutProjection.status === "completed") {
    throw new ConflictError("This workout is already completed.");
  }

  if (workoutProjection.status === "definitely_missed") {
    throw new ConflictError("This workout is already marked definitely missed.");
  }

  if (!allowOverdue && workoutProjection.status === "overdue") {
    throw new ConflictError("Only overdue workouts can be resolved this way.");
  }
}

function assertLoggableWorkout(workoutProjection, { scheduledForDate } = {}) {
  if (!workoutProjection) {
    throw new NotFoundError(`No open workout exists for ${scheduledForDate}.`);
  }

  if (workoutProjection.status !== "in_progress") {
    throw new ConflictError("Open this workout before logging sets.");
  }
}

function countSavedSetLogs(exercise = {}) {
  return Array.isArray(exercise.setLogs) ? exercise.setLogs.length : 0;
}

function countSavedSetsAcrossWorkout(workoutProjection = null) {
  const exercises = Array.isArray(workoutProjection?.exercises) ? workoutProjection.exercises : [];
  return exercises.reduce((totalCount, exercise) => totalCount + countSavedSetLogs(exercise), 0);
}

function assertSubmittableWorkout(workoutProjection, { scheduledForDate } = {}) {
  assertLoggableWorkout(workoutProjection, {
    scheduledForDate
  });

  if (countSavedSetsAcrossWorkout(workoutProjection) < 1) {
    throw new ConflictError("Save at least one set before finishing this workout.");
  }
}

function requiredProgressionSetCount(exercise = {}) {
  const explicitProgressionSets = Number(exercise.progressionSets || 0);
  if (explicitProgressionSets > 0) {
    return explicitProgressionSets;
  }

  if (String(exercise.measurementUnit || "").trim().toLowerCase() === "seconds") {
    return Number(exercise.progressionSeconds || 0) > 0 ? 1 : 0;
  }

  return 0;
}

function deriveEarnedReadyStepId(exercise = {}, nextStep = null) {
  if (!nextStep?.id) {
    return null;
  }

  const requiredSetCount = requiredProgressionSetCount(exercise);
  if (requiredSetCount < 1) {
    return null;
  }

  const qualifyingSetCount = Array.isArray(exercise.setLogs)
    ? exercise.setLogs.filter((setLog) => setLog.qualifiesForProgression).length
    : 0;

  return qualifyingSetCount >= requiredSetCount ? nextStep.id : null;
}

export {
  assertLoggableWorkout,
  assertSchedulableWorkout,
  assertSubmittableWorkout,
  countSavedSetLogs,
  countSavedSetsAcrossWorkout,
  deriveEarnedReadyStepId
};
