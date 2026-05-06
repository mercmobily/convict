import { AppError, ConflictError, NotFoundError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeText } from "@jskit-ai/kernel/shared/support/normalize";
import {
  addDays,
  localNowDateTimeString,
  localTodayDateString,
  parseDateOnly,
  resolveScheduleExerciseName
} from "@local/main/shared";
import { resolveCurrentUserId, resolveCurrentWorkspace, resolveCurrentWorkspaceId } from "@local/main/shared/requestContext";

const DAY_LABELS = Object.freeze({
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday"
});

function dayOfWeekFromDate(dateString) {
  const date = parseDateOnly(dateString);
  if (!date) {
    throw new AppError(400, `Invalid date-only value "${String(dateString || "").trim()}".`);
  }
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function dayLabelFromDate(dateString) {
  return DAY_LABELS[dayOfWeekFromDate(dateString)] || "";
}

function normalizeScheduledForDate(value = "") {
  const normalized = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(400, "scheduledForDate must be a valid YYYY-MM-DD date.");
  }
  return normalized;
}

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
      const setNumberDelta = Number(left.setNumber || 0) - Number(right.setNumber || 0);
      if (setNumberDelta !== 0) {
        return setNumberDelta;
      }
      return String(left.side || "").localeCompare(String(right.side || ""));
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

  return String(progressRow?.currentStep?.measurementUnit || fallbackStep?.measurementUnit || "reps").trim().toLowerCase() || "reps";
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

function attachSetLogsToWorkoutProjection(workoutProjection = null, setLogsByOccurrenceExerciseId = new Map()) {
  if (!workoutProjection) {
    return null;
  }

  return {
    ...workoutProjection,
    canStart: workoutProjection.status === "scheduled" || workoutProjection.status === "overdue",
    canLog: workoutProjection.status === "in_progress",
    exercises: Array.isArray(workoutProjection.exercises)
      ? workoutProjection.exercises.map((exercise) => ({
          ...exercise,
          setLogs: setLogsByOccurrenceExerciseId.get(String(exercise.occurrenceExerciseId || "")) || []
        }))
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
          const currentProgressStepId = currentProgressStep?.id || exercise.currentStepId || null;

          return {
            ...exercise,
            currentProgressStepId,
            currentProgressStepNumber: currentProgressStep?.stepNumber ?? currentSnapshotStep?.stepNumber ?? exercise.currentStepNumber ?? null,
            currentProgressStepName: currentProgressStep?.stepName || currentSnapshotStep?.stepName || exercise.currentStepName || "",
            currentProgressStepInstruction: currentProgressStep?.instructionText || currentSnapshotStep?.instructionText || exercise.currentStepInstruction || "",
            readyToAdvanceStepId: progressRow?.readyToAdvanceStepId || exercise.readyToAdvanceStepId || null,
            readyToAdvanceStepNumber: readyStep?.stepNumber ?? null,
            readyToAdvanceStepName: readyStep?.stepName || null,
            readyToAdvanceAt: progressRow?.readyToAdvanceAt || null,
            canApplyAdvancement: Boolean(
              progressRow?.readyToAdvanceStepId &&
              currentProgressStepId &&
              exercise.currentStepId &&
              String(currentProgressStepId) === String(exercise.currentStepId)
            ),
            hasProgressStepChanged: Boolean(
              currentProgressStepId &&
              exercise.currentStepId &&
              String(currentProgressStepId) !== String(exercise.currentStepId)
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
  const dayLabel = DAY_LABELS[dayOfWeek] || "";
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
    const projectionExercises = occurrenceExercises.map(buildOccurrenceExerciseProjection);
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
      exercises: projectionExercises
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

async function buildTodayState(todayRepository, { userId, todayDate, workspace = null, context = null } = {}) {
  const repositoryOptions = context ? { context } : {};
  const assignment = await todayRepository.findActiveAssignmentByUserId(userId, repositoryOptions);
  if (!assignment?.id) {
    return {
      date: todayDate,
      assignment: null,
      today: null,
      overdue: [],
      rules: {
        hasActiveAssignment: false,
        hasOverdue: false,
        canStartToday: false,
        canResumeToday: false
      }
    };
  }

  const revisions = await todayRepository.listAssignmentRevisions(assignment.id, repositoryOptions);
  const programIds = [...new Set(revisions.map((revision) => revision.programId).filter(Boolean))];
  const [programs, scheduleEntries] = await Promise.all([
    todayRepository.listProgramsByIds(programIds, repositoryOptions),
    todayRepository.listScheduleEntriesForProgramIds(programIds, repositoryOptions)
  ]);

  const programsById = buildProgramIndex(programs);
  const scheduleIndex = buildScheduleIndex(scheduleEntries);
  const allExerciseIds = [...new Set(scheduleEntries.map((entry) => entry.exerciseId).filter(Boolean))];
  const [progressRows, firstSteps] = await Promise.all([
    allExerciseIds.length > 0
      ? todayRepository.listExerciseProgressByUserAndExerciseIds(userId, allExerciseIds, repositoryOptions)
      : Promise.resolve([]),
    allExerciseIds.length > 0
      ? todayRepository.listFirstStepsByExerciseIds(allExerciseIds, repositoryOptions)
      : Promise.resolve([])
  ]);

  const progressByExerciseId = buildProgressIndex(progressRows);
  const firstStepsByExerciseId = buildFirstStepIndex(firstSteps);
  const readyStepIds = [...new Set(progressRows.map((row) => row.readyToAdvanceStepId).filter(Boolean))];
  const readyStepRows = readyStepIds.length > 0
    ? await todayRepository.listStepsByIds(readyStepIds, repositoryOptions)
    : [];
  const occurrenceRangeStart = assignment.startsOn <= todayDate ? assignment.startsOn : todayDate;
  const occurrences = occurrenceRangeStart <= todayDate
    ? await todayRepository.listOccurrencesByAssignmentBetweenDates(
        assignment.id,
        occurrenceRangeStart,
        todayDate,
        repositoryOptions
      )
    : [];
  const occurrenceIndex = buildOccurrenceIndex(occurrences);
  const occurrenceExercises = occurrences.length > 0
    ? await todayRepository.listOccurrenceExercisesByOccurrenceIds(
        occurrences.map((occurrence) => occurrence.id),
        repositoryOptions
      )
    : [];
  const occurrenceExercisesByOccurrenceId = buildOccurrenceExercisesIndex(occurrenceExercises);

  const currentProgram = (() => {
    const revision = findEffectiveRevision(revisions, todayDate) || revisions[revisions.length - 1] || null;
    return revision ? programsById.get(String(revision.programId || "")) || null : null;
  })();

  let todayProjection = null;
  if (assignment.startsOn > todayDate) {
    todayProjection = {
      scheduledForDate: assignment.startsOn,
      performedOnDate: null,
      status: "not_started_yet",
      occurrenceId: null,
      revisionId: null,
      programId: currentProgram?.id || null,
      programName: currentProgram?.name || "",
      dayOfWeek: dayOfWeekFromDate(assignment.startsOn),
      dayLabel: dayLabelFromDate(assignment.startsOn),
      isRestDay: false,
      exercises: []
    };
  } else {
    const todayOccurrence = occurrenceIndex.get(todayDate) || null;
    todayProjection = buildProjectedWorkout(todayDate, {
      todayDate,
      assignment,
      revisions,
      programsById,
      scheduleIndex,
      progressByExerciseId,
      firstStepsByExerciseId,
      occurrence: todayOccurrence,
      occurrenceExercises: todayOccurrence?.id
        ? occurrenceExercisesByOccurrenceId.get(String(todayOccurrence.id || "")) || []
        : []
    });
    todayProjection = mergeProgressStateIntoWorkoutProjection(todayProjection, {
      progressRows,
      readyStepRows,
      currentStepRows: firstSteps
    });
  }

  const overdue = [];
  if (assignment.startsOn < todayDate) {
    for (let date = assignment.startsOn; date < todayDate; date = addDays(date, 1)) {
      const occurrence = occurrenceIndex.get(date) || null;
      if (occurrence?.status === "completed" || occurrence?.status === "definitely_missed") {
        continue;
      }

      const workoutProjection = buildProjectedWorkout(date, {
        todayDate,
        assignment,
        revisions,
        programsById,
        scheduleIndex,
        progressByExerciseId,
        firstStepsByExerciseId,
        occurrence,
        occurrenceExercises: occurrence?.id
          ? occurrenceExercisesByOccurrenceId.get(String(occurrence.id || "")) || []
          : []
      });

      if (!workoutProjection || workoutProjection.isRestDay === true) {
        continue;
      }

      overdue.push(
        mergeProgressStateIntoWorkoutProjection(workoutProjection, {
          progressRows,
          readyStepRows,
          currentStepRows: firstSteps
        })
      );
    }
  }

  return {
    date: todayDate,
    assignment: {
      ...assignment,
      workspace,
      program: currentProgram
        ? {
            id: currentProgram.id,
            slug: currentProgram.slug,
            name: currentProgram.name
          }
        : null
    },
    today: todayProjection,
    overdue,
    rules: {
      hasActiveAssignment: true,
      hasOverdue: overdue.length > 0,
      canStartToday: todayProjection?.status === "scheduled",
      canResumeToday: todayProjection?.status === "in_progress"
    }
  };
}

async function buildWorkoutProjectionByScheduledDate(
  todayRepository,
  {
    assignment,
    userId,
    todayDate,
    scheduledForDate,
    context = null
  } = {}
) {
  if (!assignment?.id) {
    return null;
  }

  const repositoryOptions = context ? { context } : {};
  const revisions = await todayRepository.listAssignmentRevisions(assignment.id, repositoryOptions);
  const programIds = [...new Set(revisions.map((revision) => revision.programId).filter(Boolean))];
  const [programs, scheduleEntries] = await Promise.all([
    todayRepository.listProgramsByIds(programIds, repositoryOptions),
    todayRepository.listScheduleEntriesForProgramIds(programIds, repositoryOptions)
  ]);

  const programsById = buildProgramIndex(programs);
  const scheduleIndex = buildScheduleIndex(scheduleEntries);
  const exerciseIds = [...new Set(scheduleEntries.map((entry) => entry.exerciseId).filter(Boolean))];
  const [progressRows, firstSteps, occurrence] = await Promise.all([
    exerciseIds.length > 0
      ? todayRepository.listExerciseProgressByUserAndExerciseIds(userId, exerciseIds, repositoryOptions)
      : Promise.resolve([]),
    exerciseIds.length > 0
      ? todayRepository.listFirstStepsByExerciseIds(exerciseIds, repositoryOptions)
      : Promise.resolve([]),
    todayRepository.findOccurrenceByAssignmentAndDate(assignment.id, scheduledForDate, repositoryOptions)
  ]);

  const occurrenceExercises = occurrence?.id
    ? await todayRepository.listOccurrenceExercisesByOccurrenceIds([occurrence.id], repositoryOptions)
    : [];

  return buildProjectedWorkout(scheduledForDate, {
    todayDate,
    revisions,
    programsById,
    scheduleIndex,
    progressByExerciseId: buildProgressIndex(progressRows),
    firstStepsByExerciseId: buildFirstStepIndex(firstSteps),
    occurrence,
    occurrenceExercises
  });
}

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

function findWorkoutByScheduledDate(state = {}, scheduledForDate = "") {
  if (String(state?.today?.scheduledForDate || "") === scheduledForDate) {
    return state.today;
  }

  return Array.isArray(state?.overdue)
    ? state.overdue.find((entry) => String(entry.scheduledForDate || "") === scheduledForDate) || null
    : null;
}

async function buildWorkoutDetailState(todayRepository, { userId, todayDate, scheduledForDate, workspace = null, context = null }) {
  const state = await buildTodayState(todayRepository, {
    userId,
    todayDate,
    workspace,
    context
  });

  if (!state.assignment?.id) {
    return {
      date: todayDate,
      assignment: null,
      workout: null,
      rules: {
        hasActiveAssignment: false,
        canStartWorkout: false,
        canLogWorkout: false
      }
    };
  }

  let workoutProjection = findWorkoutByScheduledDate(state, scheduledForDate);
  if (!workoutProjection) {
    workoutProjection = await buildWorkoutProjectionByScheduledDate(todayRepository, {
      assignment: state.assignment,
      userId,
      todayDate,
      scheduledForDate,
      context
    });
  }
  if (!workoutProjection) {
    return {
      date: todayDate,
      assignment: state.assignment,
      workout: null,
      rules: {
        hasActiveAssignment: true,
        canStartWorkout: false,
        canLogWorkout: false
      }
    };
  }

  const occurrenceExerciseIds = Array.isArray(workoutProjection.exercises)
    ? workoutProjection.exercises.map((exercise) => exercise.occurrenceExerciseId).filter(Boolean)
    : [];
  const repositoryOptions = context ? { context } : {};
  const setLogs = occurrenceExerciseIds.length > 0
    ? await todayRepository.listSetLogsByOccurrenceExerciseIds(occurrenceExerciseIds, repositoryOptions)
    : [];
  const workoutWithSetLogs = attachSetLogsToWorkoutProjection(workoutProjection, buildSetLogIndex(setLogs));
  const exerciseIds = Array.isArray(workoutWithSetLogs?.exercises)
    ? [...new Set(workoutWithSetLogs.exercises.map((exercise) => exercise.exerciseId).filter(Boolean))]
    : [];
  const progressRows = exerciseIds.length > 0
    ? await todayRepository.listExerciseProgressByUserAndExerciseIds(userId, exerciseIds, repositoryOptions)
    : [];
  const readyStepIds = [...new Set(progressRows.map((row) => row.readyToAdvanceStepId).filter(Boolean))];
  const currentStepIds = Array.isArray(workoutWithSetLogs?.exercises)
    ? [...new Set(workoutWithSetLogs.exercises.map((exercise) => exercise.currentStepId).filter(Boolean))]
    : [];
  const [readyStepRows, currentStepRows] = await Promise.all([
    readyStepIds.length > 0 ? todayRepository.listStepsByIds(readyStepIds, repositoryOptions) : Promise.resolve([]),
    currentStepIds.length > 0 ? todayRepository.listStepsByIds(currentStepIds, repositoryOptions) : Promise.resolve([])
  ]);
  const workout = mergeProgressStateIntoWorkoutProjection(workoutWithSetLogs, {
    progressRows,
    readyStepRows,
    currentStepRows
  });

  return {
    date: todayDate,
    assignment: state.assignment,
    workout,
    rules: {
      hasActiveAssignment: true,
      canStartWorkout: workout.canStart === true,
      canLogWorkout: workout.canLog === true
    }
  };
}

function normalizeSetSide(value = "") {
  const normalized = String(value || "both").trim().toLowerCase() || "both";
  if (normalized !== "both" && normalized !== "left" && normalized !== "right") {
    throw new AppError(400, `Invalid set side "${normalized}".`);
  }
  return normalized;
}

function normalizeLoggedSets(rawSets = []) {
  if (!Array.isArray(rawSets)) {
    throw new AppError(400, "sets must be an array.");
  }

  const normalizedRecords = [];
  const seenKeys = new Set();

  for (const rawSet of rawSets) {
    if (!rawSet || typeof rawSet !== "object" || Array.isArray(rawSet)) {
      throw new AppError(400, "Each set log must be an object.");
    }

    const setNumber = Number(rawSet.setNumber);
    if (!Number.isInteger(setNumber) || setNumber < 1) {
      throw new AppError(400, "Each set log must include a positive integer setNumber.");
    }

    const rawPerformedValue = rawSet.performedValue;
    if (rawPerformedValue == null || String(rawPerformedValue).trim() === "") {
      continue;
    }

    const performedValue = Number(rawPerformedValue);
    if (!Number.isFinite(performedValue) || performedValue <= 0) {
      throw new AppError(400, "Each set log must include a performedValue greater than zero.");
    }

    const side = normalizeSetSide(rawSet.side);
    const dedupeKey = `${setNumber}:${side}`;
    if (seenKeys.has(dedupeKey)) {
      throw new AppError(400, `Duplicate set log for set ${setNumber} (${side}).`);
    }
    seenKeys.add(dedupeKey);

    normalizedRecords.push({
      setNumber,
      side,
      performedValue
    });
  }

  normalizedRecords.sort((left, right) => {
    const setNumberDelta = left.setNumber - right.setNumber;
    if (setNumberDelta !== 0) {
      return setNumberDelta;
    }
    return left.side.localeCompare(right.side);
  });

  return normalizedRecords;
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

function deriveOccurrenceExerciseStatus(exercise = {}, normalizedSets = []) {
  if (!Array.isArray(normalizedSets) || normalizedSets.length < 1) {
    return "pending";
  }

  const plannedWorkSetsMin = Number(exercise.plannedWorkSetsMin || 0);
  if (plannedWorkSetsMin > 0 && normalizedSets.length < plannedWorkSetsMin) {
    return "in_progress";
  }

  return "logged";
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

function createService({ todayRepository } = {}) {
  if (!todayRepository) {
    throw new TypeError("createService requires feature.today.repository.");
  }

  return Object.freeze({
    async readToday(input = {}, options = {}) {
      void input;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const todayDate = localTodayDateString();
      const workspace = resolveCurrentWorkspace(context);
      return buildTodayState(todayRepository, {
        userId,
        todayDate,
        workspace,
        context
      });
    },
    async readWorkoutDetail(input = {}, options = {}) {
      void input?.workspaceSlug;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const workspace = resolveCurrentWorkspace(context);

      if (scheduledForDate > todayDate) {
        throw new ConflictError("Future workouts are not available yet.");
      }

      const detailState = await buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        workspace,
        context
      });

      if (!detailState.assignment?.id) {
        throw new ConflictError("Choose a program before opening workouts.");
      }

      if (!detailState.workout) {
        throw new NotFoundError(`No scheduled workout is available for ${scheduledForDate}.`);
      }

      return detailState;
    },
    async startWorkout(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const workspaceId = resolveCurrentWorkspaceId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const workspace = resolveCurrentWorkspace(context);

      if (scheduledForDate > todayDate) {
        throw new ConflictError("Future workouts cannot be started yet.");
      }

      const state = await buildTodayState(todayRepository, {
        userId,
        todayDate,
        workspace,
        context
      });

      if (!state.assignment?.id) {
        throw new ConflictError("Choose a program before starting workouts.");
      }

      const targetWorkout = scheduledForDate === todayDate
        ? state.today
        : state.overdue.find((entry) => String(entry.scheduledForDate || "") === scheduledForDate) || null;

      assertSchedulableWorkout(targetWorkout, {
        scheduledForDate
      });

      if (targetWorkout.status === "in_progress") {
        return buildTodayState(todayRepository, {
          userId,
          todayDate,
          workspace,
          context
        });
      }

      await todayRepository.withTransaction(async (trx) => {
        const existingOccurrence = await todayRepository.findOccurrenceByAssignmentAndDate(
          state.assignment.id,
          scheduledForDate,
          { trx, context }
        );

        if (existingOccurrence?.status === "completed") {
          throw new ConflictError("This workout is already completed.");
        }
        if (existingOccurrence?.status === "definitely_missed") {
          throw new ConflictError("This workout is already marked definitely missed.");
        }

        if (existingOccurrence?.id) {
          await todayRepository.updateOccurrence(
            existingOccurrence.id,
            {
              status: "in_progress",
              startedAt: existingOccurrence.startedAt || localNowDateTimeString(),
              performedOnDate: existingOccurrence.performedOnDate || todayDate
            },
            { trx, context }
          );
          return;
        }

        const occurrenceId = await todayRepository.createOccurrence(
          {
            userId,
            workspaceId,
            userProgramAssignmentId: state.assignment.id,
            userProgramAssignmentRevisionId: targetWorkout.revisionId,
            scheduledForDate,
            performedOnDate: todayDate,
            status: "in_progress",
            startedAt: localNowDateTimeString(),
            notes: null
          },
          { trx, context }
        );

        const snapshotRows = buildOccurrenceExerciseSnapshots(occurrenceId, targetWorkout);
        if (snapshotRows.length > 0) {
          await todayRepository.createOccurrenceExercises(
            snapshotRows.map((row) => ({
              ...row,
              workspaceId
            })),
            { trx, context }
          );
        }
      });

      return buildTodayState(todayRepository, {
        userId,
        todayDate,
        workspace,
        context
      });
    },
    async saveWorkoutSetLogs(input = {}, options = {}) {
      void input?.workspaceSlug;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const workspaceId = resolveCurrentWorkspaceId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const occurrenceExerciseId = input?.occurrenceExerciseId || null;
      const workspace = resolveCurrentWorkspace(context);
      if (!occurrenceExerciseId) {
        throw new AppError(400, "occurrenceExerciseId is required.");
      }

      const detailState = await buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        workspace,
        context
      });

      if (!detailState.assignment?.id) {
        throw new ConflictError("Choose a program before logging sets.");
      }

      assertLoggableWorkout(detailState.workout, {
        scheduledForDate
      });

      const exercise = detailState.workout.exercises.find(
        (entry) => String(entry.occurrenceExerciseId || "") === String(occurrenceExerciseId)
      ) || null;
      if (!exercise) {
        throw new NotFoundError("Workout exercise not found for this occurrence.");
      }

      const normalizedSets = normalizeLoggedSets(input?.sets);
      const loggedAt = localNowDateTimeString();
      const records = normalizedSets.map((setLog) => ({
        workspaceId,
        setNumber: setLog.setNumber,
        side: setLog.side,
        measurementUnitSnapshot: exercise.measurementUnit,
        performedValue: setLog.performedValue,
        qualifiesForProgression: qualifiesSetForProgression(exercise, setLog.performedValue),
        loggedAt
      }));
      const exerciseStatus = deriveOccurrenceExerciseStatus(exercise, normalizedSets);

      await todayRepository.withTransaction(async (trx) => {
        await todayRepository.replaceSetLogsForOccurrenceExercise(occurrenceExerciseId, records, { trx, context });
        await todayRepository.updateOccurrenceExercise(
          occurrenceExerciseId,
          {
            status: exerciseStatus
          },
          { trx, context }
        );
      });

      return buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        workspace,
        context
      });
    },
    async submitWorkout(input = {}, options = {}) {
      void input?.workspaceSlug;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const workspaceId = resolveCurrentWorkspaceId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const workspace = resolveCurrentWorkspace(context);

      const detailState = await buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        workspace,
        context
      });

      if (!detailState.assignment?.id) {
        throw new ConflictError("Choose a program before finishing workouts.");
      }

      assertSubmittableWorkout(detailState.workout, {
        scheduledForDate
      });
      const workoutOccurrenceId = detailState.workout?.occurrenceId || null;
      if (!workoutOccurrenceId) {
        throw new NotFoundError(`No open workout exists for ${scheduledForDate}.`);
      }

      const submittedAt = localNowDateTimeString();

      await todayRepository.withTransaction(async (trx) => {
        if (detailState.workout.status === "completed") {
          throw new ConflictError("This workout is already completed.");
        }
        if (detailState.workout.status === "definitely_missed") {
          throw new ConflictError("Definitely missed workouts cannot be completed.");
        }
        if (detailState.workout.status !== "in_progress") {
          throw new ConflictError("Open this workout before finishing it.");
        }

        const occurrenceExercises = await todayRepository.listOccurrenceExercisesByOccurrenceIds(
          [workoutOccurrenceId],
          { trx, context }
        );
        const occurrenceExerciseIds = occurrenceExercises.map((exercise) => exercise.id).filter(Boolean);
        const setLogsByOccurrenceExerciseId = buildSetLogIndex(
          occurrenceExerciseIds.length > 0
            ? await todayRepository.listSetLogsByOccurrenceExerciseIds(occurrenceExerciseIds, { trx, context })
            : []
        );

        const refreshedExercises = occurrenceExercises.map((exercise) => ({
          ...buildOccurrenceExerciseProjection(exercise),
          setLogs: setLogsByOccurrenceExerciseId.get(String(exercise.id || "")) || []
        }));

        const refreshedWorkout = {
          ...detailState.workout,
          occurrenceId: workoutOccurrenceId,
          status: detailState.workout.status,
          exercises: refreshedExercises
        };

        assertSubmittableWorkout(refreshedWorkout, {
          scheduledForDate
        });

        const exerciseIds = [...new Set(refreshedExercises.map((exercise) => exercise.exerciseId).filter(Boolean))];
        const [progressRows, stepRows] = await Promise.all([
          exerciseIds.length > 0
            ? todayRepository.listExerciseProgressByUserAndExerciseIds(userId, exerciseIds, { trx, context })
            : Promise.resolve([]),
          exerciseIds.length > 0
            ? todayRepository.listStepsByExerciseIds(exerciseIds, { trx, context })
            : Promise.resolve([])
        ]);

        const progressByExerciseId = buildProgressIndex(progressRows);
        const nextStepByCurrentStepId = buildNextStepIndex(stepRows);

        await todayRepository.updateOccurrence(
          workoutOccurrenceId,
          {
            status: "completed",
            submittedAt,
            performedOnDate: detailState.workout.performedOnDate || todayDate
          },
          { trx, context }
        );

        for (const exercise of occurrenceExercises) {
          await todayRepository.updateOccurrenceExercise(
            exercise.id,
            {
              status: "completed"
            },
            { trx, context }
          );
        }

        for (const exercise of refreshedExercises) {
          const progressRow = progressByExerciseId.get(String(exercise.exerciseId || "")) || null;
          const nextStep = nextStepByCurrentStepId.get(String(exercise.currentStepId || "")) || null;
          const earnedReadyStepId = deriveEarnedReadyStepId(exercise, nextStep);

          if (!progressRow?.id) {
            await todayRepository.createExerciseProgress(
              {
                userId,
                workspaceId,
                exerciseId: exercise.exerciseId,
                currentStepId: exercise.currentStepId,
                readyToAdvanceStepId: earnedReadyStepId,
                activeVariationId: exercise.activeVariationId,
                readyToAdvanceAt: earnedReadyStepId ? submittedAt : null,
                lastCompletedOccurrenceId: workoutOccurrenceId,
                lastCompletedAt: submittedAt,
                stallCount: 0
              },
              { trx, context }
            );
            continue;
          }

          const updateFields = {
            workspaceId,
            lastCompletedOccurrenceId: workoutOccurrenceId,
            lastCompletedAt: submittedAt
          };

          if (String(progressRow.currentStepId || "") === String(exercise.currentStepId || "")) {
            if (earnedReadyStepId) {
              updateFields.readyToAdvanceStepId = earnedReadyStepId;
              if (
                String(progressRow.readyToAdvanceStepId || "") !== String(earnedReadyStepId) ||
                !progressRow.readyToAdvanceAt
              ) {
                updateFields.readyToAdvanceAt = submittedAt;
              }
            }
          }

          await todayRepository.updateExerciseProgress(progressRow.id, updateFields, { trx, context });
        }
      });

      return buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        workspace,
        context
      });
    },
    async applyAdvancement(input = {}, options = {}) {
      void input?.workspaceSlug;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const exerciseId = input?.exerciseId || null;

      if (!exerciseId) {
        throw new AppError(400, "exerciseId is required.");
      }

      const progressRows = await todayRepository.listExerciseProgressByUserAndExerciseIds(userId, [exerciseId], { context });
      const progressRow = progressRows[0] || null;
      if (!progressRow?.id) {
        throw new NotFoundError("Progress state was not found for this exercise.");
      }
      if (!progressRow.readyToAdvanceStepId) {
        throw new ConflictError("This exercise is not ready to advance.");
      }

      const readyStepRows = await todayRepository.listStepsByIds([progressRow.readyToAdvanceStepId], { context });
      const readyStep = readyStepRows[0] || null;
      if (!readyStep?.id) {
        throw new ConflictError("The next canonical step is unavailable.");
      }
      if (String(readyStep.exerciseId || "") !== String(progressRow.exerciseId || "")) {
        throw new ConflictError("The next step does not belong to this exercise family.");
      }

      await todayRepository.updateExerciseProgress(
        progressRow.id,
        {
          currentStepId: readyStep.id,
          readyToAdvanceStepId: null,
          readyToAdvanceAt: null,
          activeVariationId: null
        },
        { context }
      );

      return {
        exerciseId: progressRow.exerciseId,
        currentStepId: readyStep.id,
        currentStepName: readyStep.stepName
      };
    },
    async markWorkoutDefinitelyMissed(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const workspaceId = resolveCurrentWorkspaceId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const workspace = resolveCurrentWorkspace(context);

      if (scheduledForDate >= todayDate) {
        throw new ConflictError("Only overdue workouts can be marked definitely missed.");
      }

      const state = await buildTodayState(todayRepository, {
        userId,
        todayDate,
        workspace,
        context
      });

      if (!state.assignment?.id) {
        throw new ConflictError("Choose a program before resolving overdue workouts.");
      }

      const targetWorkout = state.overdue.find((entry) => String(entry.scheduledForDate || "") === scheduledForDate) || null;
      assertSchedulableWorkout(targetWorkout, {
        scheduledForDate,
        allowOverdue: true
      });

      await todayRepository.withTransaction(async (trx) => {
        const existingOccurrence = await todayRepository.findOccurrenceByAssignmentAndDate(
          state.assignment.id,
          scheduledForDate,
          { trx, context }
        );

        if (existingOccurrence?.status === "completed") {
          throw new ConflictError("Completed workouts cannot be marked definitely missed.");
        }
        if (existingOccurrence?.status === "definitely_missed") {
          return;
        }

        if (existingOccurrence?.id) {
          await todayRepository.updateOccurrence(
            existingOccurrence.id,
            {
              status: "definitely_missed",
              definitelyMissedAt: localNowDateTimeString()
            },
            { trx, context }
          );
          return;
        }

        const occurrenceId = await todayRepository.createOccurrence(
          {
            userId,
            workspaceId,
            userProgramAssignmentId: state.assignment.id,
            userProgramAssignmentRevisionId: targetWorkout.revisionId,
            scheduledForDate,
            performedOnDate: null,
            status: "definitely_missed",
            definitelyMissedAt: localNowDateTimeString(),
            notes: null
          },
          { trx, context }
        );

        const snapshotRows = buildOccurrenceExerciseSnapshots(occurrenceId, targetWorkout);
        if (snapshotRows.length > 0) {
          await todayRepository.createOccurrenceExercises(
            snapshotRows.map((row) => ({
              ...row,
              workspaceId,
              status: "definitely_missed"
            })),
            { trx, context }
          );
        }
      });

      return buildTodayState(todayRepository, {
        userId,
        todayDate,
        workspace,
        context
      });
    }
  });
}

export { createService };
