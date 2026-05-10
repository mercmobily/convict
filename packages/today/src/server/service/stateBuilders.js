import { addDays } from "@local/main/shared";
import { dayLabelFromDate, dayOfWeekFromDate } from "./dateSupport.js";
import {
  attachSetLogsToWorkoutProjection,
  buildFirstStepIndex,
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
  findEffectiveRevision,
  mergeProgressStateIntoWorkoutProjection,
  occurrenceKey
} from "./projections.js";

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function buildIdIndex(rows = []) {
  const index = new Map();
  for (const row of rows) {
    index.set(String(row.id || ""), row);
  }
  return index;
}

function attachExerciseById(row = {}, exercisesById = new Map()) {
  const exerciseId = String(row.exerciseId || "");
  if (!exerciseId || row.exercise?.id) {
    return row;
  }

  const exercise = exercisesById.get(exerciseId) || null;
  return exercise ? { ...row, exercise } : row;
}

function attachCurrentStepById(progressRow = {}, stepsById = new Map()) {
  if (progressRow.currentProgressionTrackStep?.exercise?.id) {
    return progressRow;
  }

  const currentStepId = progressRow.currentProgressionTrackStepId || progressRow.currentProgressionTrackStep?.id || "";
  const currentStep = stepsById.get(String(currentStepId)) || null;
  return currentStep
    ? { ...progressRow, currentProgressionTrackStep: currentStep }
    : progressRow;
}

function minimumDate(values = []) {
  return values.filter(Boolean).sort()[0] || "";
}

async function loadAssignmentsProjectionContext(
  todayRepository,
  {
    assignments = [],
    userId,
    context = null
  } = {}
) {
  const activeAssignments = Array.isArray(assignments) ? assignments.filter((assignment) => assignment?.id) : [];
  if (activeAssignments.length < 1) {
    return {
      revisions: [],
      revisionsByAssignmentId: new Map(),
      programsById: new Map(),
      scheduleIndex: new Map(),
      programRoutineIndex: new Map(),
      routineEntriesByRoutineId: new Map(),
      progressRows: [],
      progressByTrackId: new Map(),
      firstSteps: [],
      firstStepsByTrackId: new Map()
    };
  }

  const repositoryOptions = context ? { context } : {};
  const assignmentIds = activeAssignments.map((assignment) => assignment.id);
  const revisions = await todayRepository.listAssignmentRevisionsByAssignmentIds(assignmentIds, repositoryOptions);
  const programIds = uniqueValues(revisions.map((revision) => revision.programId));
  const [programs, scheduleEntries, programRoutines] = await Promise.all([
    todayRepository.listProgramsByIds(programIds, repositoryOptions),
    todayRepository.listScheduleEntriesForProgramIds(programIds, repositoryOptions),
    todayRepository.listProgramRoutinesForProgramIds(programIds, repositoryOptions)
  ]);

  const programRoutineIds = programRoutines.map((routine) => routine.id).filter(Boolean);
  const programRoutineEntries = await todayRepository.listProgramRoutineEntriesForRoutineIds(
    programRoutineIds,
    repositoryOptions
  );

  const progressionTrackIds = uniqueValues(scheduleEntries.map((entry) => entry.progressionTrackId));
  const [progressRows, firstSteps] = await Promise.all([
    progressionTrackIds.length > 0
      ? todayRepository.listProgressionTrackProgressByUserAndTrackIds(userId, progressionTrackIds, repositoryOptions)
      : Promise.resolve([]),
    progressionTrackIds.length > 0
      ? todayRepository.listFirstStepsByTrackIds(progressionTrackIds, repositoryOptions)
      : Promise.resolve([])
  ]);
  const currentStepIds = uniqueValues(progressRows.map((row) => row.currentProgressionTrackStepId));
  const currentSteps = currentStepIds.length > 0
    ? await todayRepository.listStepsByIds(currentStepIds, repositoryOptions)
    : [];
  const exerciseIds = uniqueValues([
    ...scheduleEntries.map((entry) => entry.exerciseId),
    ...programRoutineEntries.map((entry) => entry.exerciseId),
    ...firstSteps.map((step) => step.exerciseId),
    ...currentSteps.map((step) => step.exerciseId)
  ]);
  const exercisesById = buildIdIndex(
    exerciseIds.length > 0
      ? await todayRepository.listExercisesByIds(exerciseIds, repositoryOptions)
      : []
  );
  const hydratedScheduleEntries = scheduleEntries.map((entry) => attachExerciseById(entry, exercisesById));
  const hydratedProgramRoutineEntries = programRoutineEntries.map((entry) => attachExerciseById(entry, exercisesById));
  const hydratedFirstSteps = firstSteps.map((step) => attachExerciseById(step, exercisesById));
  const hydratedCurrentSteps = currentSteps.map((step) => attachExerciseById(step, exercisesById));
  const currentStepsById = buildIdIndex(hydratedCurrentSteps);
  const hydratedProgressRows = progressRows.map((row) => attachCurrentStepById(row, currentStepsById));

  return {
    revisions,
    revisionsByAssignmentId: buildRevisionsByAssignmentId(revisions),
    programsById: buildProgramIndex(programs),
    scheduleIndex: buildScheduleIndex(hydratedScheduleEntries),
    programRoutineIndex: buildProgramRoutineIndex(programRoutines),
    routineEntriesByRoutineId: buildProgramRoutineEntriesIndex(hydratedProgramRoutineEntries),
    progressRows: hydratedProgressRows,
    progressByTrackId: buildProgressIndex(hydratedProgressRows),
    firstSteps: hydratedFirstSteps,
    firstStepsByTrackId: buildFirstStepIndex(hydratedFirstSteps)
  };
}

async function loadAssignmentProjectionContext(todayRepository, { assignment, userId, context = null } = {}) {
  const contextState = await loadAssignmentsProjectionContext(todayRepository, {
    assignments: assignment ? [assignment] : [],
    userId,
    context
  });

  return {
    ...contextState,
    revisions: assignment?.id
      ? contextState.revisionsByAssignmentId.get(String(assignment.id || "")) || []
      : []
  };
}

function buildAssignmentProgramSummary(assignment, revisions = [], programsById = new Map(), dateString = "") {
  const effectiveRevision = findEffectiveRevision(revisions, dateString) || revisions[revisions.length - 1] || null;
  const program = effectiveRevision ? programsById.get(String(effectiveRevision.programId || "")) || null : null;

  return {
    ...assignment,
    program: program
      ? {
          id: program.id,
          slug: program.slug,
          name: program.name
        }
      : null
  };
}

function buildNotStartedYetProjection(dateString, assignment = {}, assignmentProgram = null) {
  return {
    userProgramAssignmentId: assignment.id || null,
    scheduledForDate: dateString,
    performedOnDate: null,
    status: "not_started_yet",
    occurrenceId: null,
    revisionId: null,
    programId: assignmentProgram?.id || null,
    programName: assignmentProgram?.name || "",
    dayOfWeek: dayOfWeekFromDate(dateString),
    dayLabel: dayLabelFromDate(dateString),
    isRestDay: false,
    exercises: [],
    assignmentStartsOn: assignment.startsOn || null
  };
}

function mergeWorkoutProgress(workoutProjection, projectionContext = {}) {
  return mergeProgressStateIntoWorkoutProjection(workoutProjection, {
    progressRows: projectionContext.progressRows,
    readyStepRows: [],
    currentStepRows: projectionContext.firstSteps
  });
}

function buildWorkoutForAssignmentDate({
  assignment,
  date,
  todayDate,
  projectionContext,
  occurrenceIndex,
  occurrenceExercisesByOccurrenceId
}) {
  const assignmentRevisions = projectionContext.revisionsByAssignmentId.get(String(assignment.id || "")) || [];
  const assignmentSummary = buildAssignmentProgramSummary(
    assignment,
    assignmentRevisions,
    projectionContext.programsById,
    date
  );

  if (date < assignment.startsOn) {
    return buildNotStartedYetProjection(date, assignmentSummary, assignmentSummary.program);
  }

  const occurrence = occurrenceIndex.get(occurrenceKey(assignment.id, date)) || null;
  return buildProjectedWorkout(date, {
    assignment,
    todayDate,
    revisions: assignmentRevisions,
    programsById: projectionContext.programsById,
    scheduleIndex: projectionContext.scheduleIndex,
    programRoutineIndex: projectionContext.programRoutineIndex,
    routineEntriesByRoutineId: projectionContext.routineEntriesByRoutineId,
    progressByTrackId: projectionContext.progressByTrackId,
    firstStepsByTrackId: projectionContext.firstStepsByTrackId,
    occurrence,
    occurrenceExercises: occurrence?.id
      ? occurrenceExercisesByOccurrenceId.get(String(occurrence.id || "")) || []
      : []
  });
}

async function buildTodayState(
  todayRepository,
  {
    userId,
    todayDate,
    context = null
  } = {}
) {
  const repositoryOptions = context ? { context } : {};
  const assignments = await todayRepository.listActiveAssignmentsByUserId(userId, repositoryOptions);
  if (assignments.length < 1) {
    return {
      date: todayDate,
      assignment: null,
      assignments: [],
      today: null,
      todayWorkouts: [],
      overdue: [],
      rules: {
        hasActiveAssignment: false,
        hasOverdue: false,
        canStartToday: false,
        canResumeToday: false
      }
    };
  }

  const projectionContext = await loadAssignmentsProjectionContext(todayRepository, {
    assignments,
    userId,
    context
  });
  const occurrenceRangeStart = minimumDate(assignments.map((assignment) => assignment.startsOn)) || todayDate;
  const occurrences = occurrenceRangeStart <= todayDate
    ? await todayRepository.listOccurrencesByAssignmentsBetweenDates(
        assignments.map((assignment) => assignment.id),
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

  const todayWorkouts = assignments
    .map((assignment) =>
      buildWorkoutForAssignmentDate({
        assignment,
        date: todayDate,
        todayDate,
        projectionContext,
        occurrenceIndex,
        occurrenceExercisesByOccurrenceId
      })
    )
    .filter(Boolean)
    .map((workout) => mergeWorkoutProgress(workout, projectionContext));

  const overdue = [];
  for (const assignment of assignments) {
    if (assignment.startsOn >= todayDate) {
      continue;
    }

    for (let date = assignment.startsOn; date < todayDate; date = addDays(date, 1)) {
      const occurrence = occurrenceIndex.get(occurrenceKey(assignment.id, date)) || null;
      if (occurrence?.status === "completed" || occurrence?.status === "definitely_missed") {
        continue;
      }

      const workoutProjection = buildWorkoutForAssignmentDate({
        assignment,
        date,
        todayDate,
        projectionContext,
        occurrenceIndex,
        occurrenceExercisesByOccurrenceId
      });

      if (!workoutProjection || workoutProjection.isRestDay === true) {
        continue;
      }

      overdue.push(mergeWorkoutProgress(workoutProjection, projectionContext));
    }
  }

  overdue.sort((left, right) => {
    const dateDelta = String(left.scheduledForDate || "").localeCompare(String(right.scheduledForDate || ""));
    if (dateDelta !== 0) {
      return dateDelta;
    }
    return String(left.programName || "").localeCompare(String(right.programName || ""));
  });

  const assignmentSummaries = assignments.map((assignment) => {
    const revisions = projectionContext.revisionsByAssignmentId.get(String(assignment.id || "")) || [];
    return buildAssignmentProgramSummary(assignment, revisions, projectionContext.programsById, todayDate);
  });
  const primaryToday = todayWorkouts.find((workout) => !workout.isRestDay) || todayWorkouts[0] || null;

  return {
    date: todayDate,
    assignment: assignmentSummaries[0] || null,
    assignments: assignmentSummaries,
    today: primaryToday,
    todayWorkouts,
    overdue,
    rules: {
      hasActiveAssignment: true,
      hasOverdue: overdue.length > 0,
      canStartToday: todayWorkouts.some((workout) => workout?.status === "scheduled"),
      canResumeToday: todayWorkouts.some((workout) => workout?.status === "in_progress"),
      multipleActivePrograms: assignments.length > 1
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
  const [projectionContext, occurrence] = await Promise.all([
    loadAssignmentProjectionContext(todayRepository, {
      assignment,
      userId,
      context
    }),
    todayRepository.findOccurrenceByAssignmentAndDate(assignment.id, scheduledForDate, repositoryOptions)
  ]);

  const occurrenceExercises = occurrence?.id
    ? await todayRepository.listOccurrenceExercisesByOccurrenceIds([occurrence.id], repositoryOptions)
    : [];

  return buildProjectedWorkout(scheduledForDate, {
    assignment,
    todayDate,
    revisions: projectionContext.revisions,
    programsById: projectionContext.programsById,
    scheduleIndex: projectionContext.scheduleIndex,
    programRoutineIndex: projectionContext.programRoutineIndex,
    routineEntriesByRoutineId: projectionContext.routineEntriesByRoutineId,
    progressByTrackId: projectionContext.progressByTrackId,
    firstStepsByTrackId: projectionContext.firstStepsByTrackId,
    occurrence,
    occurrenceExercises
  });
}

function findWorkoutByScheduledDate(state = {}, scheduledForDate = "", userProgramAssignmentId = "") {
  const workouts = [
    ...(Array.isArray(state?.todayWorkouts) ? state.todayWorkouts : []),
    ...(Array.isArray(state?.overdue) ? state.overdue : [])
  ];
  return workouts.find((entry) => {
    const dateMatches = String(entry.scheduledForDate || "") === scheduledForDate;
    const assignmentMatches = !userProgramAssignmentId ||
      String(entry.userProgramAssignmentId || "") === String(userProgramAssignmentId || "");
    return dateMatches && assignmentMatches;
  }) || null;
}

async function buildWorkoutDetailState(
  todayRepository,
  {
    userId,
    todayDate,
    scheduledForDate,
    userProgramAssignmentId = "",
    context = null
  } = {}
) {
  const state = await buildTodayState(todayRepository, {
    userId,
    todayDate,
    context
  });

  if (!state.assignments?.length) {
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

  const assignment = userProgramAssignmentId
    ? state.assignments.find((candidate) => String(candidate.id || "") === String(userProgramAssignmentId || "")) || null
    : state.assignments[0] || null;
  if (!assignment?.id) {
    return {
      date: todayDate,
      assignment: null,
      workout: null,
      rules: {
        hasActiveAssignment: true,
        canStartWorkout: false,
        canLogWorkout: false
      }
    };
  }

  let workoutProjection = findWorkoutByScheduledDate(state, scheduledForDate, assignment.id);
  if (!workoutProjection) {
    workoutProjection = await buildWorkoutProjectionByScheduledDate(todayRepository, {
      assignment,
      userId,
      todayDate,
      scheduledForDate,
      context
    });
  }

  if (!workoutProjection) {
    return {
      date: todayDate,
      assignment,
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
  const progressionTrackIds = Array.isArray(workoutWithSetLogs?.exercises)
    ? uniqueValues(workoutWithSetLogs.exercises.map((exercise) => exercise.progressionTrackId))
    : [];
  const progressRows = progressionTrackIds.length > 0
    ? await todayRepository.listProgressionTrackProgressByUserAndTrackIds(userId, progressionTrackIds, repositoryOptions)
    : [];
  const readyStepIds = uniqueValues(progressRows.map((row) => row.readyToAdvanceProgressionTrackStepId));
  const currentStepIds = Array.isArray(workoutWithSetLogs?.exercises)
    ? uniqueValues(workoutWithSetLogs.exercises.map((exercise) => exercise.currentStepId))
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
    assignment,
    workout,
    rules: {
      hasActiveAssignment: true,
      canStartWorkout: workout.canStart === true,
      canLogWorkout: workout.canLog === true
    }
  };
}

export {
  buildAssignmentProgramSummary,
  buildNotStartedYetProjection,
  buildTodayState,
  buildWorkoutDetailState,
  buildWorkoutProjectionByScheduledDate,
  loadAssignmentProjectionContext,
  loadAssignmentsProjectionContext
};
