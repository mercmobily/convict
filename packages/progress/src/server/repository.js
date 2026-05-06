import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { normalizeDateOnly } from "@local/main/shared";

function normalizeStepRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    exerciseId: row.exerciseId ?? row.exercise?.id ?? null
  };
}

function normalizeProgressRow(row = null) {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    exerciseId: row.exerciseId ?? row.exercise?.id ?? null,
    currentStepId: row.currentStepId ?? row.currentStep?.id ?? null,
    readyToAdvanceStepId: row.readyToAdvanceStepId ?? row.readyToAdvanceStep?.id ?? null,
    activeVariationId: row.activeVariationId ?? row.activeVariation?.id ?? null,
    lastCompletedOccurrenceId: row.lastCompletedOccurrenceId ?? row.lastCompletedOccurrence?.id ?? null,
    lastCompletedOccurrence: row.lastCompletedOccurrence
      ? {
          ...row.lastCompletedOccurrence,
          scheduledForDate: normalizeDateOnly(row.lastCompletedOccurrence.scheduledForDate),
          performedOnDate: normalizeDateOnly(row.lastCompletedOccurrence.performedOnDate)
        }
      : null
  };
}

function createRepository({ api } = {}) {
  if (!api) {
    throw new TypeError("createRepository requires api.");
  }

  return Object.freeze({
    async listExercises(options = {}) {
      return extractJsonRestCollectionRows(
        await api.resources.exercises.query(
          {
            queryParams: {
              sort: ["createdAt"],
              page: {
                size: 64
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      );
    },
    async listExerciseProgressByUserId(userId, options = {}) {
      if (!userId) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userExerciseProgress.query(
          {
            queryParams: {
              filters: {
                userId
              },
              include: ["exercise", "currentStep", "readyToAdvanceStep", "activeVariation", "lastCompletedOccurrence"],
              sort: ["createdAt"],
              page: {
                size: 64
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeProgressRow(row)).filter(Boolean);
    },
    async listFirstStepsByExerciseIds(exerciseIds = [], options = {}) {
      const ids = Array.isArray(exerciseIds) ? exerciseIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.exerciseSteps.query(
          {
            queryParams: {
              filters: {
                exerciseIds: ids,
                stepNumber: 1
              },
              include: ["exercise"],
              sort: ["exerciseId", "stepNumber"],
              page: {
                size: 64
              }
            },
            transaction: options?.trx || null,
            simplified: true
          },
          createJsonRestContext(options?.context || null)
        )
      ).map((row) => normalizeStepRow(row)).filter(Boolean);
    }
  });
}

export { createRepository };
