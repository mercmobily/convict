import { AppError, ConflictError, NotFoundError } from "@jskit-ai/kernel/server/runtime/errors";
import {
  localNowDateTimeString,
  localTodayDateString
} from "@local/main/shared";
import {
  resolveCurrentUserId
} from "@local/workflow-support/server/requestContext";
import {
  normalizeHistoryMonth,
  normalizeScheduledForDate
} from "./service/dateSupport.js";
import { buildHistoryState } from "./service/historyState.js";
import {
  attachWorkoutSetsToWorkoutProjection,
  buildNextProgressionEntryIndex,
  buildWorkoutExerciseProjection,
  buildWorkoutExerciseSnapshots,
  buildUserProgressionIndex,
  buildWorkoutSetIndex
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
        const existingWorkout = await todayRepository.findWorkoutByAssignmentAndDate(
          targetWorkout.programAssignmentId,
          scheduledForDate,
          { trx, context }
        );

        if (existingWorkout?.status === "completed") {
          throw new ConflictError("This workout is already completed.");
        }
        if (existingWorkout?.status === "definitely_missed") {
          throw new ConflictError("This workout is already marked definitely missed.");
        }

        if (existingWorkout?.id) {
          await todayRepository.updateWorkout(
            existingWorkout.id,
            {
              status: "in_progress",
              startedAt: existingWorkout.startedAt || localNowDateTimeString(),
              performedOnDate: existingWorkout.performedOnDate || todayDate
            },
            { trx, context }
          );
          return;
        }

        const workoutId = await todayRepository.createWorkout(
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

        const snapshotRows = buildWorkoutExerciseSnapshots(workoutId, targetWorkout);
        if (snapshotRows.length > 0) {
          await todayRepository.createWorkoutExercises(
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
      const workoutId = detailState.workout?.workoutId || null;
      if (!workoutId) {
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

        const workoutExercises = await todayRepository.listWorkoutExercisesByWorkoutIds(
          [workoutId],
          { trx, context }
        );
        const workoutExerciseIds = workoutExercises.map((exercise) => exercise.id).filter(Boolean);
        const workoutSetsByWorkoutExerciseId = buildWorkoutSetIndex(
          workoutExerciseIds.length > 0
            ? await todayRepository.listWorkoutSetsByWorkoutExerciseIds(workoutExerciseIds, { trx, context })
            : []
        );

        const refreshedWorkout = attachWorkoutSetsToWorkoutProjection({
          ...detailState.workout,
          workoutId,
          status: detailState.workout.status,
          exercises: workoutExercises.map(buildWorkoutExerciseProjection)
        }, workoutSetsByWorkoutExerciseId);
        const refreshedExercises = Array.isArray(refreshedWorkout?.exercises) ? refreshedWorkout.exercises : [];

        assertSubmittableWorkout(refreshedWorkout, {
          scheduledForDate
        });

        const instanceProgressionIds = [
          ...new Set(refreshedExercises.map((exercise) => exercise.instanceProgressionId).filter(Boolean))
        ];
        const [progressRows, stepRows] = await Promise.all([
          instanceProgressionIds.length > 0
            ? todayRepository.listUserProgressionsByInstanceProgressionIds(userId, instanceProgressionIds, { trx, context })
            : Promise.resolve([]),
          instanceProgressionIds.length > 0
            ? todayRepository.listProgressionEntriesByInstanceProgressionIds(instanceProgressionIds, { trx, context })
            : Promise.resolve([])
        ]);

        const progressByInstanceProgressionId = buildUserProgressionIndex(progressRows);
        const nextEntryByCurrentEntryId = buildNextProgressionEntryIndex(stepRows);

        await todayRepository.updateWorkout(
          workoutId,
          {
            status: "completed",
            submittedAt,
            performedOnDate: detailState.workout.performedOnDate || todayDate
          },
          { trx, context }
        );

        for (const exercise of workoutExercises) {
          await todayRepository.updateWorkoutExercise(
            exercise.id,
            {
              status: "completed"
            },
            { trx, context }
          );
        }

        for (const exercise of refreshedExercises.filter((row) => row.isProgression)) {
          const progressRow = progressByInstanceProgressionId.get(String(exercise.instanceProgressionId || "")) || null;
          const nextStep = nextEntryByCurrentEntryId.get(String(exercise.currentStepId || "")) || null;
          const earnedReadyStepId = deriveEarnedReadyStepId(exercise, nextStep);

          if (!progressRow?.id) {
            await todayRepository.createUserProgression(
              {
                instanceProgressionId: exercise.instanceProgressionId,
                currentInstanceProgressionEntryId: exercise.currentStepId,
                readyToAdvanceInstanceProgressionEntryId: earnedReadyStepId,
                readyToAdvanceAt: earnedReadyStepId ? submittedAt : null,
                lastCompletedWorkoutId: workoutId,
                lastCompletedAt: submittedAt,
                stallCount: 0
              },
              { trx, context }
            );
            continue;
          }

          const updateFields = {
            lastCompletedWorkoutId: workoutId,
            lastCompletedAt: submittedAt
          };

          if (String(progressRow.currentInstanceProgressionEntryId || "") === String(exercise.currentStepId || "")) {
            if (earnedReadyStepId) {
              updateFields.readyToAdvanceInstanceProgressionEntryId = earnedReadyStepId;
              if (
                String(progressRow.readyToAdvanceInstanceProgressionEntryId || "") !== String(earnedReadyStepId) ||
                !progressRow.readyToAdvanceAt
              ) {
                updateFields.readyToAdvanceAt = submittedAt;
              }
            }
          }

          await todayRepository.updateUserProgression(progressRow.id, updateFields, { trx, context });
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
      const instanceProgressionId = input?.instanceProgressionId || null;

      if (!instanceProgressionId) {
        throw new AppError(400, "instanceProgressionId is required.");
      }

      const progressRows = await todayRepository.listUserProgressionsByInstanceProgressionIds(
        userId,
        [instanceProgressionId],
        { context }
      );
      const progressRow = progressRows[0] || null;
      if (!progressRow?.id) {
        throw new NotFoundError("Progress state was not found for this track.");
      }
      if (!progressRow.readyToAdvanceInstanceProgressionEntryId) {
        throw new ConflictError("This progression is not ready to advance.");
      }

      const readyStepRows = await todayRepository.listStepsByIds(
        [progressRow.readyToAdvanceInstanceProgressionEntryId],
        { context }
      );
      const readyStep = readyStepRows[0] || null;
      if (!readyStep?.id) {
        throw new ConflictError("The next progression step is unavailable.");
      }
      if (String(readyStep.instanceProgressionId || "") !== String(progressRow.instanceProgressionId || "")) {
        throw new ConflictError("The next step does not belong to this instance progression.");
      }

      await todayRepository.updateUserProgression(
        progressRow.id,
        {
          currentInstanceProgressionEntryId: readyStep.id,
          readyToAdvanceInstanceProgressionEntryId: null,
          readyToAdvanceAt: null
        },
        { context }
      );

      return {
        instanceProgressionId: progressRow.instanceProgressionId,
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
        const existingWorkout = await todayRepository.findWorkoutByAssignmentAndDate(
          targetWorkout.programAssignmentId,
          scheduledForDate,
          { trx, context }
        );

        if (existingWorkout?.status === "completed") {
          throw new ConflictError("Completed workouts cannot be marked definitely missed.");
        }
        if (existingWorkout?.status === "definitely_missed") {
          return;
        }

        if (existingWorkout?.id) {
          await todayRepository.updateWorkout(
            existingWorkout.id,
            {
              status: "definitely_missed",
              definitelyMissedAt: localNowDateTimeString()
            },
            { trx, context }
          );
          return;
        }

        const workoutId = await todayRepository.createWorkout(
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

        const snapshotRows = buildWorkoutExerciseSnapshots(workoutId, targetWorkout);
        if (snapshotRows.length > 0) {
          await todayRepository.createWorkoutExercises(
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
