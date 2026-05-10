import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  buildProgressDisplayState,
  dayLabelForIsoDayOfWeek,
  withoutConvictPrefix
} from "@local/main/shared";
import { dayOfWeekFromDate } from "./dateSupport.js";

function buildProgramIndex(programs = []) {
  const index = new Map();
  for (const program of programs) {
    index.set(String(program.id || ""), program);
  }
  return index;
}

function buildRevisionsByAssignmentId(revisions = []) {
  const index = new Map();
  for (const revision of revisions) {
    const assignmentId = String(revision.userProgramAssignmentId || "");
    if (!index.has(assignmentId)) {
      index.set(assignmentId, []);
    }
    index.get(assignmentId).push(revision);
  }
  for (const rows of index.values()) {
    rows.sort((left, right) => {
      const effectiveDateDelta = String(left.effectiveFromDate || "").localeCompare(String(right.effectiveFromDate || ""));
      if (effectiveDateDelta !== 0) {
        return effectiveDateDelta;
      }
      return String(left.createdAt || "").localeCompare(String(right.createdAt || ""));
    });
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

function buildProgramRoutineIndex(programRoutines = []) {
  const index = new Map();
  for (const routine of programRoutines) {
    const programId = String(routine.programId || "");
    if (!index.has(programId)) {
      index.set(programId, []);
    }
    index.get(programId).push(routine);
  }
  for (const rows of index.values()) {
    rows.sort((left, right) => {
      const timingDelta = String(left.timing || "").localeCompare(String(right.timing || ""));
      if (timingDelta !== 0) {
        return timingDelta;
      }
      return Number(left.slotNumber || 0) - Number(right.slotNumber || 0);
    });
  }
  return index;
}

function buildProgramRoutineEntriesIndex(programRoutineEntries = []) {
  const index = new Map();
  for (const entry of programRoutineEntries) {
    const routineId = String(entry.programRoutineId || "");
    if (!index.has(routineId)) {
      index.set(routineId, []);
    }
    index.get(routineId).push(entry);
  }
  for (const rows of index.values()) {
    rows.sort((left, right) => Number(left.slotNumber || 0) - Number(right.slotNumber || 0));
  }
  return index;
}

function occurrenceKey(userProgramAssignmentId, scheduledForDate) {
  return `${String(userProgramAssignmentId || "")}:${String(scheduledForDate || "")}`;
}

function buildOccurrenceIndex(occurrences = []) {
  const index = new Map();
  for (const occurrence of occurrences) {
    index.set(occurrenceKey(occurrence.userProgramAssignmentId, occurrence.scheduledForDate), occurrence);
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
      return loggedAtDelta || Number(left.id || 0) - Number(right.id || 0);
    });
  }

  return index;
}

function buildProgressIndex(progressRows = []) {
  const index = new Map();
  for (const row of progressRows) {
    index.set(String(row.progressionTrackId || ""), row);
  }
  return index;
}

function buildFirstStepIndex(stepRows = []) {
  const index = new Map();
  for (const row of stepRows) {
    index.set(String(row.progressionTrackId || ""), row);
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
    const progressionTrackId = String(row.progressionTrackId || "");
    if (!groupedRows.has(progressionTrackId)) {
      groupedRows.set(progressionTrackId, []);
    }
    groupedRows.get(progressionTrackId).push(row);
  }

  for (const rows of groupedRows.values()) {
    rows.sort((left, right) => Number(left.stepNumber || 0) - Number(right.stepNumber || 0));
    for (let index = 0; index < rows.length; index += 1) {
      nextStepIndex.set(String(rows[index].id || ""), rows[index + 1] || null);
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

function selectMeasurementUnit(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized) {
      return normalized;
    }
  }
  return "reps";
}

function buildProgressionExerciseProjection(scheduleEntry, progressRow = null, firstStep = null, slotNumber = 0) {
  const currentStep = progressRow?.currentProgressionTrackStep || firstStep || null;
  if (!currentStep?.id) {
    throw new AppError(500, `Missing progression step data for track ${scheduleEntry.progressionTrackId}.`);
  }

  const exercise = currentStep.exercise || null;
  if (!exercise?.id) {
    throw new AppError(500, `Missing concrete exercise data for progression step ${currentStep.id}.`);
  }

  return {
    occurrenceExerciseId: null,
    slotNumber,
    section: "main",
    sourceKind: "program_schedule_entry",
    programScheduleEntryId: scheduleEntry.id,
    programRoutineEntryId: null,
    entryKind: "progression_track",
    isProgression: true,
    progressionTrackId: scheduleEntry.progressionTrackId,
    progressionTrackName: withoutConvictPrefix(scheduleEntry.progressionTrack?.name || ""),
    progressionTrackStepId: currentStep.id,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    plannedWorkSetsMin: Number(scheduleEntry.workSetsMin || 0),
    plannedWorkSetsMax: Number(scheduleEntry.workSetsMax || 0),
    currentStepId: currentStep.id,
    currentStepNumber: Number(currentStep.stepNumber || 0),
    currentStepName: currentStep.stepLabel,
    currentStepInstruction: currentStep.instructionText || "",
    measurementUnit: selectMeasurementUnit(currentStep.measurementUnit, exercise.defaultMeasurementUnit),
    readyToAdvanceStepId: progressRow?.readyToAdvanceProgressionTrackStepId || null,
    progressionSets: currentStep.progressionSets,
    progressionRepsMin: currentStep.progressionRepsMin,
    progressionRepsMax: currentStep.progressionRepsMax,
    progressionSeconds: currentStep.progressionSeconds,
    targetRepsMin: scheduleEntry.targetRepsMin ?? null,
    targetRepsMax: scheduleEntry.targetRepsMax ?? null,
    targetSeconds: scheduleEntry.targetSeconds ?? null,
    restSeconds: scheduleEntry.restSeconds ?? null,
    notes: scheduleEntry.notes ?? null
  };
}

function buildDirectScheduleExerciseProjection(scheduleEntry, slotNumber = 0) {
  const exercise = scheduleEntry.exercise || null;
  if (!exercise?.id) {
    throw new AppError(500, `Missing direct exercise data for schedule entry ${scheduleEntry.id}.`);
  }

  return {
    occurrenceExerciseId: null,
    slotNumber,
    section: "main",
    sourceKind: "program_schedule_entry",
    programScheduleEntryId: scheduleEntry.id,
    programRoutineEntryId: null,
    entryKind: "direct_exercise",
    isProgression: false,
    progressionTrackId: null,
    progressionTrackName: "",
    progressionTrackStepId: null,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    plannedWorkSetsMin: Number(scheduleEntry.workSetsMin || 0),
    plannedWorkSetsMax: Number(scheduleEntry.workSetsMax || 0),
    currentStepId: null,
    currentStepNumber: null,
    currentStepName: exercise.name,
    currentStepInstruction: exercise.instructionText || "",
    measurementUnit: selectMeasurementUnit(scheduleEntry.measurementUnit, exercise.defaultMeasurementUnit),
    readyToAdvanceStepId: null,
    progressionSets: null,
    progressionRepsMin: null,
    progressionRepsMax: null,
    progressionSeconds: null,
    targetRepsMin: scheduleEntry.targetRepsMin ?? null,
    targetRepsMax: scheduleEntry.targetRepsMax ?? null,
    targetSeconds: scheduleEntry.targetSeconds ?? null,
    restSeconds: scheduleEntry.restSeconds ?? null,
    notes: scheduleEntry.notes ?? null
  };
}

function buildRoutineExerciseProjection(programRoutine, routineEntry, section, slotNumber = 0) {
  return {
    occurrenceExerciseId: null,
    slotNumber,
    section,
    sourceKind: "program_routine_entry",
    programScheduleEntryId: null,
    programRoutineEntryId: routineEntry.id,
    entryKind: "direct_exercise",
    isProgression: false,
    progressionTrackId: null,
    progressionTrackName: "",
    progressionTrackStepId: null,
    exerciseId: routineEntry.exerciseId,
    exerciseName: routineEntry.exerciseNameSnapshot || routineEntry.exercise?.name || "",
    routineName: programRoutine.nameSnapshot || "",
    plannedWorkSetsMin: Number(routineEntry.targetSets || 0),
    plannedWorkSetsMax: Number(routineEntry.targetSets || 0),
    currentStepId: null,
    currentStepNumber: null,
    currentStepName: routineEntry.exerciseNameSnapshot || routineEntry.exercise?.name || "",
    currentStepInstruction: routineEntry.exercise?.instructionText || "",
    measurementUnit: selectMeasurementUnit(routineEntry.measurementUnit, routineEntry.exercise?.defaultMeasurementUnit),
    readyToAdvanceStepId: null,
    progressionSets: null,
    progressionRepsMin: null,
    progressionRepsMax: null,
    progressionSeconds: null,
    targetRepsMin: routineEntry.targetRepsMin ?? null,
    targetRepsMax: routineEntry.targetRepsMax ?? null,
    targetSeconds: routineEntry.targetSeconds ?? null,
    restSeconds: routineEntry.restSeconds ?? null,
    notes: routineEntry.notes ?? null
  };
}

function routineAppliesToDay(programRoutine = {}, dayOfWeek = 0) {
  return programRoutine.dayOfWeek == null || Number(programRoutine.dayOfWeek) === Number(dayOfWeek);
}

function buildRoutineSectionExercises(programRoutines = [], routineEntriesByRoutineId = new Map(), section = "", dayOfWeek = 0, startSlot = 1) {
  const rows = [];
  let slotNumber = startSlot;
  const matchingRoutines = programRoutines
    .filter((routine) => String(routine.timing || "").trim().toLowerCase() === section)
    .filter((routine) => routineAppliesToDay(routine, dayOfWeek))
    .sort((left, right) => Number(left.slotNumber || 0) - Number(right.slotNumber || 0));

  for (const routine of matchingRoutines) {
    const routineEntries = routineEntriesByRoutineId.get(String(routine.id || "")) || [];
    for (const entry of routineEntries) {
      rows.push(buildRoutineExerciseProjection(routine, entry, section, slotNumber));
      slotNumber += 1;
    }
  }

  return {
    rows,
    nextSlotNumber: slotNumber
  };
}

function buildPlannedExerciseProjections(
  {
    scheduleEntries = [],
    programRoutines = [],
    routineEntriesByRoutineId = new Map(),
    progressByTrackId = new Map(),
    firstStepsByTrackId = new Map(),
    dayOfWeek = 0
  } = {}
) {
  let slotNumber = 1;
  const warmup = buildRoutineSectionExercises(programRoutines, routineEntriesByRoutineId, "warmup", dayOfWeek, slotNumber);
  slotNumber = warmup.nextSlotNumber;

  const main = [];
  for (const entry of scheduleEntries) {
    if (String(entry.entryKind || "").trim().toLowerCase() === "direct_exercise") {
      main.push(buildDirectScheduleExerciseProjection(entry, slotNumber));
    } else {
      main.push(
        buildProgressionExerciseProjection(
          entry,
          progressByTrackId.get(String(entry.progressionTrackId || "")) || null,
          firstStepsByTrackId.get(String(entry.progressionTrackId || "")) || null,
          slotNumber
        )
      );
    }
    slotNumber += 1;
  }

  const cooldown = buildRoutineSectionExercises(programRoutines, routineEntriesByRoutineId, "cooldown", dayOfWeek, slotNumber);

  return [...warmup.rows, ...main, ...cooldown.rows];
}

function buildOccurrenceExerciseProjection(row = {}) {
  return {
    occurrenceExerciseId: row.id,
    slotNumber: Number(row.slotNumber || 0),
    section: String(row.section || "main").trim(),
    sourceKind: String(row.sourceKind || "").trim(),
    programScheduleEntryId: row.programScheduleEntryId || null,
    programRoutineEntryId: row.programRoutineEntryId || null,
    entryKind: row.progressionTrackId ? "progression_track" : "direct_exercise",
    isProgression: Boolean(row.progressionTrackId && row.progressionTrackStepId),
    progressionTrackId: row.progressionTrackId || null,
    progressionTrackName: row.progressionTrackNameSnapshot || withoutConvictPrefix(row.progressionTrack?.name || ""),
    progressionTrackStepId: row.progressionTrackStepId || null,
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseNameSnapshot,
    plannedWorkSetsMin: Number(row.plannedSetsMin || 0),
    plannedWorkSetsMax: Number(row.plannedSetsMax || 0),
    currentStepId: row.progressionTrackStepId || null,
    currentStepNumber: row.progressionTrackStep?.stepNumber ?? null,
    currentStepName: row.progressionStepLabelSnapshot || row.exerciseNameSnapshot,
    currentStepInstruction: row.progressionTrackStep?.instructionText || row.exercise?.instructionText || "",
    measurementUnit: row.measurementUnitSnapshot,
    readyToAdvanceStepId: null,
    progressionSets: row.progressionSetsSnapshot,
    progressionRepsMin: row.progressionRepsMinSnapshot,
    progressionRepsMax: row.progressionRepsMaxSnapshot,
    progressionSeconds: row.progressionSecondsSnapshot,
    targetRepsMin: row.targetRepsMinSnapshot,
    targetRepsMax: row.targetRepsMaxSnapshot,
    targetSeconds: row.targetSecondsSnapshot,
    restSeconds: row.restSecondsSnapshot,
    notes: row.notesSnapshot || row.notes || null,
    exerciseStatus: row.status
  };
}

function qualifiesSetForProgression(exercise = {}, performedValue = 0) {
  if (!exercise.isProgression) {
    return false;
  }

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

  const progressByTrackId = buildProgressIndex(progressRows);
  const readyStepsById = buildStepIndex(readyStepRows);
  const currentStepsById = buildStepIndex(currentStepRows);

  return {
    ...workoutProjection,
    exercises: Array.isArray(workoutProjection.exercises)
      ? workoutProjection.exercises.map((exercise) => {
          if (!exercise.isProgression) {
            return exercise;
          }

          const progressRow = progressByTrackId.get(String(exercise.progressionTrackId || "")) || null;
          const readyStep = readyStepsById.get(String(progressRow?.readyToAdvanceProgressionTrackStepId || "")) || null;
          const currentSnapshotStep = currentStepsById.get(String(exercise.currentStepId || "")) || null;
          const progressDisplayState = buildProgressDisplayState(
            {
              progressRow,
              currentStep: progressRow?.currentProgressionTrackStep || null,
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
              progressRow?.readyToAdvanceProgressionTrackStepId &&
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
    assignment = null,
    todayDate,
    revisions,
    programsById,
    scheduleIndex,
    programRoutineIndex,
    routineEntriesByRoutineId,
    progressByTrackId,
    firstStepsByTrackId,
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
  const programRoutines = programRoutineIndex.get(String(revision.programId || "")) || [];

  if (occurrence?.id) {
    return {
      userProgramAssignmentId: assignment?.id || occurrence.userProgramAssignmentId || null,
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

  const exercises = buildPlannedExerciseProjections({
    scheduleEntries,
    programRoutines,
    routineEntriesByRoutineId,
    progressByTrackId,
    firstStepsByTrackId,
    dayOfWeek
  });

  if (exercises.length < 1) {
    return {
      userProgramAssignmentId: assignment?.id || null,
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

  return {
    userProgramAssignmentId: assignment?.id || null,
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
    section: exercise.section || "main",
    sourceKind: exercise.sourceKind || "program_schedule_entry",
    programScheduleEntryId: exercise.programScheduleEntryId || null,
    programRoutineEntryId: exercise.programRoutineEntryId || null,
    progressionTrackId: exercise.progressionTrackId || null,
    progressionTrackStepId: exercise.progressionTrackStepId || exercise.currentStepId || null,
    exerciseId: exercise.exerciseId,
    exerciseNameSnapshot: exercise.exerciseName,
    progressionTrackNameSnapshot: exercise.progressionTrackName || null,
    progressionStepLabelSnapshot: exercise.currentStepName || null,
    measurementUnitSnapshot: exercise.measurementUnit,
    plannedSetsMin: Number(exercise.plannedWorkSetsMin || 0),
    plannedSetsMax: Number(exercise.plannedWorkSetsMax || 0),
    targetRepsMinSnapshot: exercise.targetRepsMin ?? null,
    targetRepsMaxSnapshot: exercise.targetRepsMax ?? null,
    targetSecondsSnapshot: exercise.targetSeconds ?? null,
    progressionSetsSnapshot: exercise.progressionSets,
    progressionRepsMinSnapshot: exercise.progressionRepsMin,
    progressionRepsMaxSnapshot: exercise.progressionRepsMax,
    progressionSecondsSnapshot: exercise.progressionSeconds,
    restSecondsSnapshot: exercise.restSeconds ?? null,
    notesSnapshot: exercise.notes ?? null,
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
  buildProgramRoutineEntriesIndex,
  buildProgramRoutineIndex,
  buildProgressIndex,
  buildProjectedWorkout,
  buildRevisionsByAssignmentId,
  buildScheduleIndex,
  buildSetLogIndex,
  buildStepIndex,
  findEffectiveRevision,
  mergeProgressStateIntoWorkoutProjection,
  occurrenceKey,
  qualifiesSetForProgression
};
