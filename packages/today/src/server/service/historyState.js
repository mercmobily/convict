import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  addDays,
  firstDateOfCalendarGrid,
  firstDateOfMonth,
  lastDateOfCalendarGrid,
  lastDateOfMonth
} from "@local/main/shared";
import {
  buildOccurrenceExercisesIndex,
  buildOccurrenceIndex,
  buildProjectedWorkout,
  occurrenceKey
} from "./projections.js";
import {
  buildAssignmentProgramSummary,
  buildNotStartedYetProjection,
  loadAssignmentsProjectionContext
} from "./stateBuilders.js";

function buildEmptyHistorySummary() {
  return {
    totalDays: 0,
    completedDays: 0,
    definitelyMissedDays: 0,
    inProgressDays: 0,
    overdueDays: 0,
    scheduledDays: 0,
    restDays: 0,
    notStartedYetDays: 0
  };
}

function decorateHistoryDay(day = {}, { todayDate = "", monthStart = "", monthEnd = "" } = {}) {
  const scheduledForDate = String(day.scheduledForDate || "").trim();
  return {
    ...day,
    isCurrentMonth: scheduledForDate >= monthStart && scheduledForDate <= monthEnd,
    isToday: scheduledForDate === todayDate,
    isFuture: scheduledForDate > todayDate,
    canOpenWorkoutDetail: Boolean(!day.isRestDay && scheduledForDate && scheduledForDate <= todayDate && day.status !== "not_started_yet")
  };
}

function summarizeHistoryDays(days = []) {
  return days.reduce((summary, day) => {
    summary.totalDays += 1;

    switch (String(day.status || "").trim().toLowerCase()) {
      case "completed":
        summary.completedDays += 1;
        break;
      case "definitely_missed":
        summary.definitelyMissedDays += 1;
        break;
      case "in_progress":
        summary.inProgressDays += 1;
        break;
      case "overdue":
        summary.overdueDays += 1;
        break;
      case "scheduled":
        summary.scheduledDays += 1;
        break;
      case "rest_day":
        summary.restDays += 1;
        break;
      case "not_started_yet":
        summary.notStartedYetDays += 1;
        break;
      default:
        break;
    }

    return summary;
  }, buildEmptyHistorySummary());
}

function statusRank(status = "") {
  switch (String(status || "").trim().toLowerCase()) {
    case "in_progress":
      return 1;
    case "overdue":
      return 2;
    case "scheduled":
      return 3;
    case "completed":
      return 4;
    case "definitely_missed":
      return 5;
    case "not_started_yet":
      return 6;
    case "rest_day":
      return 7;
    default:
      return 99;
  }
}

function aggregateDayProjection(date, workouts = []) {
  const realWorkouts = workouts.filter(Boolean);
  if (realWorkouts.length < 1) {
    return null;
  }

  const sortedWorkouts = [...realWorkouts].sort((left, right) => statusRank(left.status) - statusRank(right.status));
  const statusSource = sortedWorkouts[0];
  const nonRestWorkouts = realWorkouts.filter((workout) => workout.isRestDay !== true && workout.status !== "not_started_yet");

  return {
    scheduledForDate: date,
    userProgramAssignmentId: statusSource.userProgramAssignmentId || null,
    performedOnDate: statusSource.performedOnDate || null,
    status: statusSource.status,
    occurrenceId: statusSource.occurrenceId || null,
    revisionId: statusSource.revisionId || null,
    programId: statusSource.programId || null,
    programName: statusSource.programName || "",
    dayOfWeek: statusSource.dayOfWeek,
    dayLabel: statusSource.dayLabel,
    isRestDay: nonRestWorkouts.length < 1,
    exercises: realWorkouts.flatMap((workout) => Array.isArray(workout.exercises) ? workout.exercises : []),
    workouts: realWorkouts
  };
}

async function buildHistoryState(
  todayRepository,
  {
    userId,
    todayDate,
    historyMonth,
    context = null
  } = {}
) {
  const repositoryOptions = context ? { context } : {};
  const monthStart = firstDateOfMonth(historyMonth);
  const monthEnd = lastDateOfMonth(historyMonth);
  const gridStart = firstDateOfCalendarGrid(historyMonth);
  const gridEnd = lastDateOfCalendarGrid(historyMonth);
  const assignments = await todayRepository.listActiveAssignmentsByUserId(userId, repositoryOptions);

  if (assignments.length < 1) {
    return {
      date: todayDate,
      month: historyMonth,
      range: {
        monthStart,
        monthEnd,
        gridStart,
        gridEnd
      },
      assignment: null,
      assignments: [],
      summary: buildEmptyHistorySummary(),
      days: [],
      rules: {
        hasActiveAssignment: false
      }
    };
  }

  const projectionContext = await loadAssignmentsProjectionContext(todayRepository, {
    assignments,
    userId,
    context
  });
  const occurrenceQueryStart = assignments
    .map((assignment) => assignment.startsOn)
    .filter(Boolean)
    .sort()[0] || gridStart;
  const occurrences = occurrenceQueryStart <= gridEnd
    ? await todayRepository.listOccurrencesByAssignmentsBetweenDates(
        assignments.map((assignment) => assignment.id),
        occurrenceQueryStart,
        gridEnd,
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
  const assignmentSummaries = assignments.map((assignment) => {
    const revisions = projectionContext.revisionsByAssignmentId.get(String(assignment.id || "")) || [];
    return buildAssignmentProgramSummary(assignment, revisions, projectionContext.programsById, todayDate);
  });
  const days = [];

  for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) {
    const workouts = assignments.map((assignment) => {
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
    });

    const dayProjection = aggregateDayProjection(date, workouts);
    if (!dayProjection) {
      throw new AppError(500, `Unable to build a history projection for ${date}.`);
    }

    days.push(
      decorateHistoryDay(dayProjection, {
        todayDate,
        monthStart,
        monthEnd
      })
    );
  }

  return {
    date: todayDate,
    month: historyMonth,
    range: {
      monthStart,
      monthEnd,
      gridStart,
      gridEnd
    },
    assignment: assignmentSummaries[0] || null,
    assignments: assignmentSummaries,
    summary: summarizeHistoryDays(days.filter((day) => day.isCurrentMonth)),
    days,
    rules: {
      hasActiveAssignment: true,
      multipleActivePrograms: assignments.length > 1
    }
  };
}

export { buildHistoryState };
