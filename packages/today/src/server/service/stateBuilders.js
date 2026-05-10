import { addDays } from "@local/main/shared";
import { dayLabelFromDate, dayOfWeekFromDate } from "./dateSupport.js";
import {
  attachWorkoutSetsToWorkoutProjection,
  buildFirstProgressionEntryIndex,
  buildWorkoutExercisesIndex,
  buildWorkoutIndex,
  buildProgramIndex,
  buildProgramRoutineEntriesIndex,
  buildProgramRoutineIndex,
  buildUserProgressionIndex,
  buildProjectedWorkout,
  buildRevisionsByAssignmentId,
  buildScheduleIndex,
  buildWorkoutSetIndex,
  findEffectiveRevision,
  mergeProgressStateIntoWorkoutProjection,
  workoutKey
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
  if (progressRow.currentInstanceProgressionEntry?.exercise?.id) {
    return progressRow;
  }

  const currentStepId = progressRow.currentInstanceProgressionEntryId || progressRow.currentInstanceProgressionEntry?.id || "";
  const currentStep = stepsById.get(String(currentStepId)) || null;
  return currentStep
    ? { ...progressRow, currentInstanceProgressionEntry: currentStep }
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
      userProgressionsByInstanceProgressionId: new Map(),
      firstProgressionEntries: [],
      firstProgressionEntriesByInstanceProgressionId: new Map()
    };
  }

  const repositoryOptions = context ? { context } : {};
  const assignmentIds = activeAssignments.map((assignment) => assignment.id);
  const revisions = await todayRepository.listAssignmentRevisionsByAssignmentIds(assignmentIds, repositoryOptions);
  const programIds = uniqueValues(revisions.map((revision) => revision.instanceProgramId));
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

  const instanceProgressionIds = uniqueValues(scheduleEntries.map((entry) => entry.instanceProgressionId));
  const [progressRows, firstProgressionEntries] = await Promise.all([
    instanceProgressionIds.length > 0
      ? todayRepository.listUserProgressionsByInstanceProgressionIds(userId, instanceProgressionIds, repositoryOptions)
      : Promise.resolve([]),
    instanceProgressionIds.length > 0
      ? todayRepository.listFirstProgressionEntriesByInstanceProgressionIds(instanceProgressionIds, repositoryOptions)
      : Promise.resolve([])
  ]);
  const currentStepIds = uniqueValues(progressRows.map((row) => row.currentInstanceProgressionEntryId));
  const currentSteps = currentStepIds.length > 0
    ? await todayRepository.listStepsByIds(currentStepIds, repositoryOptions)
    : [];
  const exerciseIds = uniqueValues([
    ...scheduleEntries.map((entry) => entry.exerciseId),
    ...programRoutineEntries.map((entry) => entry.exerciseId),
    ...firstProgressionEntries.map((step) => step.exerciseId),
    ...currentSteps.map((step) => step.exerciseId)
  ]);
  const exercisesById = buildIdIndex(
    exerciseIds.length > 0
      ? await todayRepository.listExercisesByIds(exerciseIds, repositoryOptions)
      : []
  );
  const hydratedScheduleEntries = scheduleEntries.map((entry) => attachExerciseById(entry, exercisesById));
  const hydratedProgramRoutineEntries = programRoutineEntries.map((entry) => attachExerciseById(entry, exercisesById));
  const hydratedFirstProgressionEntries = firstProgressionEntries.map((step) => attachExerciseById(step, exercisesById));
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
    userProgressionsByInstanceProgressionId: buildUserProgressionIndex(hydratedProgressRows),
    firstProgressionEntries: hydratedFirstProgressionEntries,
    firstProgressionEntriesByInstanceProgressionId: buildFirstProgressionEntryIndex(hydratedFirstProgressionEntries)
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
  const program = effectiveRevision ? programsById.get(String(effectiveRevision.instanceProgramId || "")) || null : null;

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
    programAssignmentId: assignment.id || null,
    scheduledForDate: dateString,
    performedOnDate: null,
    status: "not_started_yet",
    workoutId: null,
    revisionId: null,
    instanceProgramId: assignmentProgram?.id || null,
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
    currentStepRows: projectionContext.firstProgressionEntries
  });
}

function buildWorkoutForAssignmentDate({
  assignment,
  date,
  todayDate,
  projectionContext,
  workoutIndex,
  workoutExercisesByWorkoutId
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

  const workout = workoutIndex.get(workoutKey(assignment.id, date)) || null;
  return buildProjectedWorkout(date, {
    assignment,
    todayDate,
    revisions: assignmentRevisions,
    programsById: projectionContext.programsById,
    scheduleIndex: projectionContext.scheduleIndex,
    programRoutineIndex: projectionContext.programRoutineIndex,
    routineEntriesByRoutineId: projectionContext.routineEntriesByRoutineId,
    userProgressionsByInstanceProgressionId: projectionContext.userProgressionsByInstanceProgressionId,
    firstProgressionEntriesByInstanceProgressionId: projectionContext.firstProgressionEntriesByInstanceProgressionId,
    workout,
    workoutExercises: workout?.id
      ? workoutExercisesByWorkoutId.get(String(workout.id || "")) || []
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
  const workoutRangeStart = minimumDate(assignments.map((assignment) => assignment.startsOn)) || todayDate;
  const workouts = workoutRangeStart <= todayDate
    ? await todayRepository.listWorkoutsByAssignmentsBetweenDates(
        assignments.map((assignment) => assignment.id),
        workoutRangeStart,
        todayDate,
        repositoryOptions
      )
    : [];
  const workoutIndex = buildWorkoutIndex(workouts);
  const workoutExercises = workouts.length > 0
    ? await todayRepository.listWorkoutExercisesByWorkoutIds(
        workouts.map((workout) => workout.id),
        repositoryOptions
      )
    : [];
  const workoutExercisesByWorkoutId = buildWorkoutExercisesIndex(workoutExercises);

  const todayWorkouts = assignments
    .map((assignment) =>
      buildWorkoutForAssignmentDate({
        assignment,
        date: todayDate,
        todayDate,
        projectionContext,
        workoutIndex,
        workoutExercisesByWorkoutId
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
      const workout = workoutIndex.get(workoutKey(assignment.id, date)) || null;
      if (workout?.status === "completed" || workout?.status === "definitely_missed") {
        continue;
      }

      const workoutProjection = buildWorkoutForAssignmentDate({
        assignment,
        date,
        todayDate,
        projectionContext,
        workoutIndex,
        workoutExercisesByWorkoutId
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
  const [projectionContext, workout] = await Promise.all([
    loadAssignmentProjectionContext(todayRepository, {
      assignment,
      userId,
      context
    }),
    todayRepository.findWorkoutByAssignmentAndDate(assignment.id, scheduledForDate, repositoryOptions)
  ]);

  const workoutExercises = workout?.id
    ? await todayRepository.listWorkoutExercisesByWorkoutIds([workout.id], repositoryOptions)
    : [];

  return buildProjectedWorkout(scheduledForDate, {
    assignment,
    todayDate,
    revisions: projectionContext.revisions,
    programsById: projectionContext.programsById,
    scheduleIndex: projectionContext.scheduleIndex,
    programRoutineIndex: projectionContext.programRoutineIndex,
    routineEntriesByRoutineId: projectionContext.routineEntriesByRoutineId,
    userProgressionsByInstanceProgressionId: projectionContext.userProgressionsByInstanceProgressionId,
    firstProgressionEntriesByInstanceProgressionId: projectionContext.firstProgressionEntriesByInstanceProgressionId,
    workout,
    workoutExercises
  });
}

function findWorkoutByScheduledDate(state = {}, scheduledForDate = "", programAssignmentId = "") {
  const workouts = [
    ...(Array.isArray(state?.todayWorkouts) ? state.todayWorkouts : []),
    ...(Array.isArray(state?.overdue) ? state.overdue : [])
  ];
  return workouts.find((entry) => {
    const dateMatches = String(entry.scheduledForDate || "") === scheduledForDate;
    const assignmentMatches = !programAssignmentId ||
      String(entry.programAssignmentId || "") === String(programAssignmentId || "");
    return dateMatches && assignmentMatches;
  }) || null;
}

async function buildWorkoutDetailState(
  todayRepository,
  {
    userId,
    todayDate,
    scheduledForDate,
    programAssignmentId = "",
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

  const assignment = programAssignmentId
    ? state.assignments.find((candidate) => String(candidate.id || "") === String(programAssignmentId || "")) || null
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

  const workoutExerciseIds = Array.isArray(workoutProjection.exercises)
    ? workoutProjection.exercises.map((exercise) => exercise.workoutExerciseId).filter(Boolean)
    : [];
  const repositoryOptions = context ? { context } : {};
  const workoutSets = workoutExerciseIds.length > 0
    ? await todayRepository.listWorkoutSetsByWorkoutExerciseIds(workoutExerciseIds, repositoryOptions)
    : [];
  const workoutWithSets = attachWorkoutSetsToWorkoutProjection(workoutProjection, buildWorkoutSetIndex(workoutSets));
  const instanceProgressionIds = Array.isArray(workoutWithSets?.exercises)
    ? uniqueValues(workoutWithSets.exercises.map((exercise) => exercise.instanceProgressionId))
    : [];
  const progressRows = instanceProgressionIds.length > 0
    ? await todayRepository.listUserProgressionsByInstanceProgressionIds(userId, instanceProgressionIds, repositoryOptions)
    : [];
  const readyStepIds = uniqueValues(progressRows.map((row) => row.readyToAdvanceInstanceProgressionEntryId));
  const currentStepIds = Array.isArray(workoutWithSets?.exercises)
    ? uniqueValues(workoutWithSets.exercises.map((exercise) => exercise.currentStepId))
    : [];
  const [readyStepRows, currentStepRows] = await Promise.all([
    readyStepIds.length > 0 ? todayRepository.listStepsByIds(readyStepIds, repositoryOptions) : Promise.resolve([]),
    currentStepIds.length > 0 ? todayRepository.listStepsByIds(currentStepIds, repositoryOptions) : Promise.resolve([])
  ]);
  const workout = mergeProgressStateIntoWorkoutProjection(workoutWithSets, {
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
