import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  addDays,
  firstDateOfCalendarGrid,
  firstDateOfMonth,
  lastDateOfCalendarGrid,
  lastDateOfMonth
} from "@local/main/shared";
import { dayLabelFromDate, dayOfWeekFromDate } from "./dateSupport.js";
import {
  buildOccurrenceExercisesIndex,
  buildOccurrenceIndex,
  buildProjectedWorkout,
  findEffectiveRevision
} from "./projections.js";
import { loadAssignmentProjectionContext } from "./stateBuilders.js";

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

function buildAssignmentProgramSummary(
  assignment,
  revisions = [],
  programsById = new Map(),
  dateString = ""
) {
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

async function buildHistoryState(
  todayRepository,
  {
    userId,
    todayDate,
    historyMonth,
    workspace = null,
    context = null
  } = {}
) {
  const repositoryOptions = context ? { context } : {};
  const monthStart = firstDateOfMonth(historyMonth);
  const monthEnd = lastDateOfMonth(historyMonth);
  const gridStart = firstDateOfCalendarGrid(historyMonth);
  const gridEnd = lastDateOfCalendarGrid(historyMonth);
  const assignment = await todayRepository.findActiveAssignmentByUserId(userId, repositoryOptions);

  if (!assignment?.id) {
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
      summary: buildEmptyHistorySummary(),
      days: [],
      rules: {
        hasActiveAssignment: false
      }
    };
  }

  const projectionContext = await loadAssignmentProjectionContext(todayRepository, {
    assignment,
    userId,
    context
  });
  const occurrenceQueryStart = assignment.startsOn > gridStart ? assignment.startsOn : gridStart;
  const occurrences = occurrenceQueryStart <= gridEnd
    ? await todayRepository.listOccurrencesByAssignmentBetweenDates(
        assignment.id,
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
  const assignmentSummary = buildAssignmentProgramSummary(
    assignment,
    projectionContext.revisions,
    projectionContext.programsById,
    todayDate
  );
  const assignmentProgram = assignmentSummary.program || null;
  const days = [];

  for (let date = gridStart; date <= gridEnd; date = addDays(date, 1)) {
    const occurrence = occurrenceIndex.get(date) || null;
    let dayProjection = null;

    if (date < assignment.startsOn) {
      dayProjection = buildNotStartedYetProjection(date, assignmentSummary, assignmentProgram);
    } else {
      dayProjection = buildProjectedWorkout(date, {
        todayDate,
        revisions: projectionContext.revisions,
        programsById: projectionContext.programsById,
        scheduleIndex: projectionContext.scheduleIndex,
        progressByExerciseId: projectionContext.progressByExerciseId,
        firstStepsByExerciseId: projectionContext.firstStepsByExerciseId,
        occurrence,
        occurrenceExercises: occurrence?.id
          ? occurrenceExercisesByOccurrenceId.get(String(occurrence.id || "")) || []
          : []
      });
    }

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
    assignment: {
      ...assignmentSummary,
      workspace
    },
    summary: summarizeHistoryDays(days.filter((day) => day.isCurrentMonth)),
    days,
    rules: {
      hasActiveAssignment: true
    }
  };
}

export { buildHistoryState };
