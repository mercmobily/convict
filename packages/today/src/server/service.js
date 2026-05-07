import { AppError, ConflictError, NotFoundError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  localNowDateTimeString,
  localTodayDateString
} from "@local/main/shared";
import {
  resolveCurrentUserId,
  resolveCurrentWorkspace,
  resolveCurrentWorkspaceId
} from "@local/main/shared/requestContext";
import { normalizeScheduledForDate } from "./service/dateSupport.js";
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
