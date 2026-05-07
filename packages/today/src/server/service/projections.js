import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  buildProgressDisplayState,
  dayLabelForIsoDayOfWeek,
  resolveScheduleExerciseName
} from "@local/main/shared";
import { dayOfWeekFromDate } from "./dateSupport.js";

function buildProgramIndex(programs = []) {
  const index = new Map();
  for (const program of programs) {
    index.set(String(program.id || ""), program);
  }
  return index;
}

function buildScheduleIndex(scheduleEntries = []) {
  const index = new Map();
  for (const entry of scheduleEntries) {
    const programId = String(entry.programId || "");
    const dayOfWeek = Number(entry.dayOfWeek || 0);
    if (!index.has(programId)) {
      index.set(programId, new Map());
    }

    const dayIndex = index.get(programId);
    if (!dayIndex.has(dayOfWeek)) {
      dayIndex.set(dayOfWeek, []);
    }

    dayIndex.get(dayOfWeek).push(entry);
  }

  for (const dayIndex of index.values()) {
    for (const entries of dayIndex.values()) {
      entries.sort((left, right) => Number(left.slotNumber || 0) - Number(right.slotNumber || 0));
    }
  }

  return index;
}

function buildOccurrenceIndex(occurrences = []) {
  const index = new Map();
  for (const occurrence of occurrences) {
    index.set(String(occurrence.scheduledForDate || ""), occurrence);
  }
  return index;
}

function buildOccurrenceExercisesIndex(rows = []) {
  const index = new Map();
  for (const row of rows) {
    const occurrenceId = String(row.workoutOccurrenceId || "");
    if (!index.has(occurrenceId)) {
      index.set(occurrenceId, []);
    }
    index.get(occurrenceId).push(row);
  }

  for (const entries of index.values()) {
    entries.sort((left, right) => Number(left.slotNumber || 0) - Number(right.slotNumber || 0));
  }

  return index;
}

function buildSetLogIndex(rows = []) {
  const index = new Map();
  for (const row of rows) {
    const occurrenceExerciseId = String(row.workoutOccurrenceExerciseId || "");
    if (!index.has(occurrenceExerciseId)) {
      index.set(occurrenceExerciseId, []);
    }
    index.get(occurrenceExerciseId).push(row);
  }

  for (const entries of index.values()) {
    entries.sort((left, right) => {
      const leftLoggedAt = String(left.loggedAt || left.createdAt || "");
      const rightLoggedAt = String(right.loggedAt || right.createdAt || "");
      const loggedAtDelta = leftLoggedAt.localeCompare(rightLoggedAt);
      if (loggedAtDelta !== 0) {
        return loggedAtDelta;
      }

      return Number(left.id || 0) - Number(right.id || 0);
    });
  }

  return index;
}

function buildProgressIndex(progressRows = []) {
  const index = new Map();
  for (const row of progressRows) {
    index.set(String(row.exerciseId || ""), row);
  }
  return index;
}

function buildFirstStepIndex(stepRows = []) {
  const index = new Map();
  for (const row of stepRows) {
    index.set(String(row.exerciseId || ""), row);
  }
  return index;
}

function buildStepIndex(stepRows = []) {
  const index = new Map();
  for (const row of stepRows) {
    index.set(String(row.id || ""), row);
  }
  return index;
}

function buildNextStepIndex(stepRows = []) {
  const groupedRows = new Map();
  const nextStepIndex = new Map();

  for (const row of stepRows) {
    const exerciseId = String(row.exerciseId || "");
    if (!groupedRows.has(exerciseId)) {
      groupedRows.set(exerciseId, []);
    }
    groupedRows.get(exerciseId).push(row);
  }

  for (const rows of groupedRows.values()) {
    rows.sort((left, right) => Number(left.stepNumber || 0) - Number(right.stepNumber || 0));
    for (let index = 0; index < rows.length; index += 1) {
      const currentRow = rows[index];
      const nextRow = rows[index + 1] || null;
      nextStepIndex.set(String(currentRow.id || ""), nextRow);
    }
  }

  return nextStepIndex;
}

function findEffectiveRevision(revisions = [], dateString = "") {
  let activeRevision = null;
  for (const revision of revisions) {
    if (String(revision.effectiveFromDate || "") <= String(dateString || "")) {
      activeRevision = revision;
      continue;
    }
    break;
  }
  return activeRevision;
}

function selectMeasurementUnit(progressRow = null, fallbackStep = null) {
  const variationUnit = String(progressRow?.activeVariation?.measurementUnit || "").trim().toLowerCase();
  if (variationUnit) {
    return variationUnit;
  }

  return String(
    progressRow?.currentStep?.measurementUnit ||
    fallbackStep?.measurementUnit ||
    "reps"
  ).trim().toLowerCase() || "reps";
}

function buildDerivedExerciseProjection(scheduleEntry, progressRow = null, firstStep = null) {
  const currentStep = progressRow?.currentStep || firstStep || null;
  if (!currentStep?.id) {
    throw new AppError(500, `Missing canonical step data for exercise ${scheduleEntry.exerciseId}.`);
  }

  return {
    occurrenceExerciseId: null,
    slotNumber: Number(scheduleEntry.slotNumber || 0),
    exerciseId: scheduleEntry.exerciseId,
    exerciseName: resolveScheduleExerciseName(scheduleEntry),
    plannedWorkSetsMin: Number(scheduleEntry.workSetsMin || 0),
    plannedWorkSetsMax: Number(scheduleEntry.workSetsMax || 0),
    currentStepId: currentStep.id,
    currentStepNumber: Number(currentStep.stepNumber || 0),
    currentStepName: currentStep.stepName,
    currentStepInstruction: currentStep.instructionText || "",
    measurementUnit: selectMeasurementUnit(progressRow, firstStep),
    activeVariationId: progressRow?.activeVariationId || null,
    activeVariationName: progressRow?.activeVariation?.name || null,
    readyToAdvanceStepId: progressRow?.readyToAdvanceStepId || null,
    progressionSets: currentStep.progressionSets,
    progressionRepsMin: currentStep.progressionRepsMin,
    progressionRepsMax: currentStep.progressionRepsMax,
    progressionSeconds: currentStep.progressionSeconds
  };
}

function buildOccurrenceExerciseProjection(row = {}) {
  return {
    occurrenceExerciseId: row.id,
    slotNumber: Number(row.slotNumber || 0),
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseNameSnapshot,
    plannedWorkSetsMin: Number(row.plannedWorkSetsMin || 0),
    plannedWorkSetsMax: Number(row.plannedWorkSetsMax || 0),
    currentStepId: row.canonicalStepId,
    currentStepNumber: null,
    currentStepName: row.canonicalStepNameSnapshot,
    measurementUnit: row.measurementUnitSnapshot,
    activeVariationId: row.personalStepVariationId,
    activeVariationName: row.variationNameSnapshot,
    readyToAdvanceStepId: null,
    progressionSets: row.progressionSetsSnapshot,
    progressionRepsMin: row.progressionRepsMinSnapshot,
    progressionRepsMax: row.progressionRepsMaxSnapshot,
    progressionSeconds: row.progressionSecondsSnapshot,
    exerciseStatus: row.status
  };
}

function qualifiesSetForProgression(exercise = {}, performedValue = 0) {
  const measurementUnit = String(exercise.measurementUnit || "").trim().toLowerCase();
  if (measurementUnit === "seconds") {
    const threshold = Number(exercise.progressionSeconds || 0);
    return threshold > 0 && performedValue >= threshold;
  }

  const rawThreshold = exercise.progressionRepsMax ?? exercise.progressionRepsMin ?? null;
  const threshold = rawThreshold == null ? 0 : Number(rawThreshold);
  return threshold > 0 && performedValue >= threshold;
}

function decorateSetLogForExercise(exercise = {}, setLog = {}) {
  return {
    ...setLog,
    qualifiesForProgression: qualifiesSetForProgression(exercise, Number(setLog.performedValue || 0))
  };
}

function deriveOccurrenceExerciseStatus(exercise = {}, setLogs = []) {
  if (!Array.isArray(setLogs) || setLogs.length < 1) {
    return "pending";
  }

  const plannedWorkSetsMin = Number(exercise.plannedWorkSetsMin || 0);
  if (plannedWorkSetsMin > 0 && setLogs.length < plannedWorkSetsMin) {
    return "in_progress";
  }

  return "logged";
}

function attachSetLogsToWorkoutProjection(workoutProjection = null, setLogsByOccurrenceExerciseId = new Map()) {
  if (!workoutProjection) {
    return null;
  }

  return {
    ...workoutProjection,
    canStart: workoutProjection.status === "scheduled" || workoutProjection.status === "overdue",
    canLog: workoutProjection.status === "in_progress",
    exercises: Array.isArray(workoutProjection.exercises)
      ? workoutProjection.exercises.map((exercise) => {
          const setLogs = (setLogsByOccurrenceExerciseId.get(String(exercise.occurrenceExerciseId || "")) || [])
            .map((setLog) => decorateSetLogForExercise(exercise, setLog));

          return {
            ...exercise,
            exerciseStatus: deriveOccurrenceExerciseStatus(exercise, setLogs),
            setLogs
          };
        })
      : []
  };
}

function mergeProgressStateIntoWorkoutProjection(
  workoutProjection = null,
  {
    progressRows = [],
    readyStepRows = [],
    currentStepRows = []
  } = {}
) {
  if (!workoutProjection) {
    return null;
  }

  const progressByExerciseId = buildProgressIndex(progressRows);
  const readyStepsById = buildStepIndex(readyStepRows);
  const currentStepsById = buildStepIndex(currentStepRows);

  return {
    ...workoutProjection,
    exercises: Array.isArray(workoutProjection.exercises)
      ? workoutProjection.exercises.map((exercise) => {
          const progressRow = progressByExerciseId.get(String(exercise.exerciseId || "")) || null;
          const readyStep = readyStepsById.get(String(progressRow?.readyToAdvanceStepId || "")) || null;
          const currentSnapshotStep = currentStepsById.get(String(exercise.currentStepId || "")) || null;
          const currentProgressStep = progressRow?.currentStep || null;
          const progressDisplayState = buildProgressDisplayState(
            {
              progressRow,
              currentStep: currentProgressStep,
              fallbackStep: currentSnapshotStep,
              readyStep,
              base: exercise
            },
            {
              emptyReadyStepName: null
            }
          );

          return {
            ...exercise,
            ...progressDisplayState,
            canApplyAdvancement: Boolean(
              progressRow?.readyToAdvanceStepId &&
              progressDisplayState.currentProgressStepId &&
              exercise.currentStepId &&
              String(progressDisplayState.currentProgressStepId) === String(exercise.currentStepId)
            ),
            hasProgressStepChanged: Boolean(
              progressDisplayState.currentProgressStepId &&
              exercise.currentStepId &&
              String(progressDisplayState.currentProgressStepId) !== String(exercise.currentStepId)
            )
          };
        })
      : []
  };
}

function buildProjectedWorkout(
  dateString,
  {
    todayDate,
    revisions,
    programsById,
    scheduleIndex,
    progressByExerciseId,
    firstStepsByExerciseId,
    occurrence = null,
    occurrenceExercises = []
  } = {}
) {
  const dayOfWeek = dayOfWeekFromDate(dateString);
  const dayLabel = dayLabelForIsoDayOfWeek(dayOfWeek) || "";
  const revision = findEffectiveRevision(revisions, dateString);
  if (!revision?.id) {
    return null;
  }

  const program = programsById.get(String(revision.programId || "")) || null;
  const scheduleEntries = (scheduleIndex.get(String(revision.programId || ""))?.get(dayOfWeek) || []).slice();

  if (scheduleEntries.length < 1) {
    return {
      scheduledForDate: dateString,
      performedOnDate: null,
      status: "rest_day",
      occurrenceId: null,
      revisionId: revision.id,
      programId: revision.programId,
      programName: program?.name || "",
      dayOfWeek,
      dayLabel,
      isRestDay: true,
      exercises: []
    };
  }

  if (occurrence?.id) {
    return {
      scheduledForDate: dateString,
      performedOnDate: occurrence.performedOnDate,
      status: occurrence.status,
      occurrenceId: occurrence.id,
      revisionId: occurrence.userProgramAssignmentRevisionId || revision.id,
      programId: revision.programId,
      programName: program?.name || "",
      dayOfWeek,
      dayLabel,
      isRestDay: false,
      exercises: occurrenceExercises.map(buildOccurrenceExerciseProjection)
    };
  }

  const exercises = scheduleEntries.map((entry) =>
    buildDerivedExerciseProjection(
      entry,
      progressByExerciseId.get(String(entry.exerciseId || "")) || null,
      firstStepsByExerciseId.get(String(entry.exerciseId || "")) || null
    )
  );

  return {
    scheduledForDate: dateString,
    performedOnDate: null,
    status: dateString < todayDate ? "overdue" : "scheduled",
    occurrenceId: null,
    revisionId: revision.id,
    programId: revision.programId,
    programName: program?.name || "",
    dayOfWeek,
    dayLabel,
    isRestDay: false,
    exercises
  };
}

function buildOccurrenceExerciseSnapshots(workoutOccurrenceId, workoutProjection = {}) {
  const exercises = Array.isArray(workoutProjection.exercises) ? workoutProjection.exercises : [];
  return exercises.map((exercise) => ({
    workoutOccurrenceId,
    slotNumber: Number(exercise.slotNumber || 0),
    exerciseId: exercise.exerciseId,
    exerciseNameSnapshot: exercise.exerciseName,
    canonicalStepId: exercise.currentStepId,
    canonicalStepNameSnapshot: exercise.currentStepName,
    personalStepVariationId: exercise.activeVariationId,
    variationNameSnapshot: exercise.activeVariationName,
    measurementUnitSnapshot: exercise.measurementUnit,
    plannedWorkSetsMin: Number(exercise.plannedWorkSetsMin || 0),
    plannedWorkSetsMax: Number(exercise.plannedWorkSetsMax || 0),
    progressionSetsSnapshot: exercise.progressionSets,
    progressionRepsMinSnapshot: exercise.progressionRepsMin,
    progressionRepsMaxSnapshot: exercise.progressionRepsMax,
    progressionSecondsSnapshot: exercise.progressionSeconds,
    status: "pending",
    notes: null
  }));
}

export {
  attachSetLogsToWorkoutProjection,
  buildFirstStepIndex,
  buildNextStepIndex,
  buildOccurrenceExerciseProjection,
  buildOccurrenceExerciseSnapshots,
  buildOccurrenceExercisesIndex,
  buildOccurrenceIndex,
  buildProgramIndex,
  buildProgressIndex,
  buildProjectedWorkout,
  buildScheduleIndex,
  buildSetLogIndex,
  buildStepIndex,
  findEffectiveRevision,
  mergeProgressStateIntoWorkoutProjection,
  qualifiesSetForProgression
};
