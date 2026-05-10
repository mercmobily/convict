import { AppError, ConflictError, NotFoundError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  localNowDateTimeString,
  localTodayDateString
} from "@local/main/shared";
import {
  resolveCurrentUserId
} from "@local/main/shared/requestContext";
import {
  normalizeHistoryMonth,
  normalizeScheduledForDate
} from "./service/dateSupport.js";
import { buildHistoryState } from "./service/historyState.js";
import {
  attachSetLogsToWorkoutProjection,
  buildNextStepIndex,
  buildOccurrenceExerciseProjection,
  buildOccurrenceExerciseSnapshots,
  buildProgressIndex,
  buildSetLogIndex
} from "./service/projections.js";
import {
  buildTodayState,
  buildWorkoutDetailState
} from "./service/stateBuilders.js";
import {
  assertSchedulableWorkout,
  assertSubmittableWorkout,
  deriveEarnedReadyStepId
} from "./service/workflowRules.js";

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

      return buildTodayState(todayRepository, {
        userId,
        todayDate,
        context
      });
    },

    async readHistory(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const todayDate = localTodayDateString();
      const historyMonth = normalizeHistoryMonth(input?.month, todayDate);

      return buildHistoryState(todayRepository, {
        userId,
        todayDate,
        historyMonth,
        context
      });
    },

    async readWorkoutDetail(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const programAssignmentId = input?.programAssignmentId || input?.assignmentId || "";

      if (scheduledForDate > todayDate) {
        throw new ConflictError("Future workouts are not available yet.");
      }

      const detailState = await buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        programAssignmentId,
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
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const programAssignmentId = input?.programAssignmentId || input?.assignmentId || "";

      if (scheduledForDate > todayDate) {
        throw new ConflictError("Future workouts cannot be started yet.");
      }

      const state = await buildTodayState(todayRepository, {
        userId,
        todayDate,
        context
      });

      if (!state.assignments?.length) {
        throw new ConflictError("Choose a program before starting workouts.");
      }

      const candidateWorkouts = [
        ...(Array.isArray(state.todayWorkouts) ? state.todayWorkouts : []),
        ...(Array.isArray(state.overdue) ? state.overdue : [])
      ].filter((entry) => String(entry.scheduledForDate || "") === scheduledForDate);
      const targetWorkout = (
        programAssignmentId
          ? candidateWorkouts.find((entry) => String(entry.programAssignmentId || "") === String(programAssignmentId)) || null
          : candidateWorkouts.length === 1 ? candidateWorkouts[0] : null
      );

      assertSchedulableWorkout(targetWorkout, {
        scheduledForDate
      });

      if (targetWorkout.status === "in_progress") {
        return buildTodayState(todayRepository, {
          userId,
          todayDate,
          context
        });
      }

      await todayRepository.withTransaction(async (trx) => {
        const existingOccurrence = await todayRepository.findOccurrenceByAssignmentAndDate(
          targetWorkout.programAssignmentId,
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
            programAssignmentId: targetWorkout.programAssignmentId,
            programAssignmentRevisionId: targetWorkout.revisionId,
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
            snapshotRows,
            { trx, context }
          );
        }
      });

      return buildTodayState(todayRepository, {
        userId,
        todayDate,
        context
      });
    },

    async submitWorkout(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const programAssignmentId = input?.programAssignmentId || input?.assignmentId || "";

      const detailState = await buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        programAssignmentId,
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

        const refreshedWorkout = attachSetLogsToWorkoutProjection({
          ...detailState.workout,
          occurrenceId: workoutOccurrenceId,
          status: detailState.workout.status,
          exercises: occurrenceExercises.map(buildOccurrenceExerciseProjection)
        }, setLogsByOccurrenceExerciseId);
        const refreshedExercises = Array.isArray(refreshedWorkout?.exercises) ? refreshedWorkout.exercises : [];

        assertSubmittableWorkout(refreshedWorkout, {
          scheduledForDate
        });

        const progressionTrackIds = [
          ...new Set(refreshedExercises.map((exercise) => exercise.progressionTrackId).filter(Boolean))
        ];
        const [progressRows, stepRows] = await Promise.all([
          progressionTrackIds.length > 0
            ? todayRepository.listProgressionTrackProgressByUserAndTrackIds(userId, progressionTrackIds, { trx, context })
            : Promise.resolve([]),
          progressionTrackIds.length > 0
            ? todayRepository.listStepsByTrackIds(progressionTrackIds, { trx, context })
            : Promise.resolve([])
        ]);

        const progressByTrackId = buildProgressIndex(progressRows);
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

        for (const exercise of refreshedExercises.filter((row) => row.isProgression)) {
          const progressRow = progressByTrackId.get(String(exercise.progressionTrackId || "")) || null;
          const nextStep = nextStepByCurrentStepId.get(String(exercise.currentStepId || "")) || null;
          const earnedReadyStepId = deriveEarnedReadyStepId(exercise, nextStep);

          if (!progressRow?.id) {
            await todayRepository.createProgressionTrackProgress(
              {
                progressionTrackId: exercise.progressionTrackId,
                currentProgressionTrackStepId: exercise.currentStepId,
                readyToAdvanceProgressionTrackStepId: earnedReadyStepId,
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
            lastCompletedOccurrenceId: workoutOccurrenceId,
            lastCompletedAt: submittedAt
          };

          if (String(progressRow.currentProgressionTrackStepId || "") === String(exercise.currentStepId || "")) {
            if (earnedReadyStepId) {
              updateFields.readyToAdvanceProgressionTrackStepId = earnedReadyStepId;
              if (
                String(progressRow.readyToAdvanceProgressionTrackStepId || "") !== String(earnedReadyStepId) ||
                !progressRow.readyToAdvanceAt
              ) {
                updateFields.readyToAdvanceAt = submittedAt;
              }
            }
          }

          await todayRepository.updateProgressionTrackProgress(progressRow.id, updateFields, { trx, context });
        }
      });

      return buildWorkoutDetailState(todayRepository, {
        userId,
        todayDate,
        scheduledForDate,
        programAssignmentId,
        context
      });
    },

    async applyAdvancement(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const progressionTrackId = input?.progressionTrackId || null;

      if (!progressionTrackId) {
        throw new AppError(400, "progressionTrackId is required.");
      }

      const progressRows = await todayRepository.listProgressionTrackProgressByUserAndTrackIds(
        userId,
        [progressionTrackId],
        { context }
      );
      const progressRow = progressRows[0] || null;
      if (!progressRow?.id) {
        throw new NotFoundError("Progress state was not found for this track.");
      }
      if (!progressRow.readyToAdvanceProgressionTrackStepId) {
        throw new ConflictError("This track is not ready to advance.");
      }

      const readyStepRows = await todayRepository.listStepsByIds(
        [progressRow.readyToAdvanceProgressionTrackStepId],
        { context }
      );
      const readyStep = readyStepRows[0] || null;
      if (!readyStep?.id) {
        throw new ConflictError("The next progression step is unavailable.");
      }
      if (String(readyStep.progressionTrackId || "") !== String(progressRow.progressionTrackId || "")) {
        throw new ConflictError("The next step does not belong to this progression track.");
      }

      await todayRepository.updateProgressionTrackProgress(
        progressRow.id,
        {
          currentProgressionTrackStepId: readyStep.id,
          readyToAdvanceProgressionTrackStepId: null,
          readyToAdvanceAt: null
        },
        { context }
      );

      return {
        progressionTrackId: progressRow.progressionTrackId,
        currentStepId: readyStep.id,
        currentStepName: readyStep.stepLabel
      };
    },

    async markWorkoutDefinitelyMissed(input = {}, options = {}) {
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const todayDate = localTodayDateString();
      const scheduledForDate = normalizeScheduledForDate(input?.scheduledForDate);
      const programAssignmentId = input?.programAssignmentId || input?.assignmentId || "";

      if (scheduledForDate >= todayDate) {
        throw new ConflictError("Only overdue workouts can be marked definitely missed.");
      }

      const state = await buildTodayState(todayRepository, {
        userId,
        todayDate,
        context
      });

      if (!state.assignments?.length) {
        throw new ConflictError("Choose a program before resolving overdue workouts.");
      }

      const overdueCandidates = state.overdue.filter((entry) => String(entry.scheduledForDate || "") === scheduledForDate);
      const targetWorkout = programAssignmentId
        ? overdueCandidates.find((entry) => String(entry.programAssignmentId || "") === String(programAssignmentId)) || null
        : overdueCandidates.length === 1 ? overdueCandidates[0] : null;
      assertSchedulableWorkout(targetWorkout, {
        scheduledForDate,
        allowOverdue: true
      });

      await todayRepository.withTransaction(async (trx) => {
        const existingOccurrence = await todayRepository.findOccurrenceByAssignmentAndDate(
          targetWorkout.programAssignmentId,
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
            programAssignmentId: targetWorkout.programAssignmentId,
            programAssignmentRevisionId: targetWorkout.revisionId,
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
              status: "definitely_missed"
            })),
            { trx, context }
          );
        }
      });

      return buildTodayState(todayRepository, {
        userId,
        todayDate,
        context
      });
    }
  });
}

export { createService };
