import { addDays } from "@local/main/shared";
import { dayLabelFromDate, dayOfWeekFromDate } from "./dateSupport.js";
import {
  attachSetLogsToWorkoutProjection,
  buildFirstStepIndex,
  buildOccurrenceExercisesIndex,
  buildOccurrenceIndex,
  buildProgramIndex,
  buildProgressIndex,
  buildProjectedWorkout,
  buildScheduleIndex,
  buildSetLogIndex,
  findEffectiveRevision,
  mergeProgressStateIntoWorkoutProjection
} from "./projections.js";

async function loadAssignmentProjectionContext(
  todayRepository,
  {
    assignment,
    userId,
    context = null
  } = {}
) {
  if (!assignment?.id) {
    throw new TypeError("loadAssignmentProjectionContext requires an active assignment.");
  }

  const repositoryOptions = context ? { context } : {};
  const revisions = await todayRepository.listAssignmentRevisions(assignment.id, repositoryOptions);
  const programIds = [...new Set(revisions.map((revision) => revision.programId).filter(Boolean))];
  const [programs, scheduleEntries] = await Promise.all([
    todayRepository.listProgramsByIds(programIds, repositoryOptions),
    todayRepository.listScheduleEntriesForProgramIds(programIds, repositoryOptions)
  ]);

  const exerciseIds = [...new Set(scheduleEntries.map((entry) => entry.exerciseId).filter(Boolean))];
  const [progressRows, firstSteps] = await Promise.all([
    exerciseIds.length > 0
      ? todayRepository.listExerciseProgressByUserAndExerciseIds(userId, exerciseIds, repositoryOptions)
      : Promise.resolve([]),
    exerciseIds.length > 0
      ? todayRepository.listFirstStepsByExerciseIds(exerciseIds, repositoryOptions)
      : Promise.resolve([])
  ]);

  return {
    revisions,
    programsById: buildProgramIndex(programs),
    scheduleIndex: buildScheduleIndex(scheduleEntries),
    progressRows,
    progressByExerciseId: buildProgressIndex(progressRows),
    firstSteps,
    firstStepsByExerciseId: buildFirstStepIndex(firstSteps)
  };
}

async function buildTodayState(
  todayRepository,
  {
    userId,
    todayDate,
    workspace = null,
    context = null
  } = {}
) {
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

  const {
    revisions,
    programsById,
    scheduleIndex,
    progressRows,
    progressByExerciseId,
    firstSteps,
    firstStepsByExerciseId
  } = await loadAssignmentProjectionContext(todayRepository, {
    assignment,
    userId,
    context
  });

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
    todayDate,
    revisions: projectionContext.revisions,
    programsById: projectionContext.programsById,
    scheduleIndex: projectionContext.scheduleIndex,
    progressByExerciseId: projectionContext.progressByExerciseId,
    firstStepsByExerciseId: projectionContext.firstStepsByExerciseId,
    occurrence,
    occurrenceExercises
  });
}

function findWorkoutByScheduledDate(state = {}, scheduledForDate = "") {
  if (String(state?.today?.scheduledForDate || "") === scheduledForDate) {
    return state.today;
  }

  return Array.isArray(state?.overdue)
    ? state.overdue.find((entry) => String(entry.scheduledForDate || "") === scheduledForDate) || null
    : null;
}

async function buildWorkoutDetailState(
  todayRepository,
  {
    userId,
    todayDate,
    scheduledForDate,
    workspace = null,
    context = null
  } = {}
) {
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

export {
  buildTodayState,
  buildWorkoutDetailState,
  buildWorkoutProjectionByScheduledDate,
  loadAssignmentProjectionContext
};
