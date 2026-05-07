import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { normalizeSimplifiedRow } from "@local/main/shared";

function normalizeStepRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      exerciseId: "exercise"
    }
  });
}

function normalizeProgressRow(row = null) {
  const normalizedRow = normalizeSimplifiedRow(row, {
    relationIds: {
      exerciseId: "exercise",
      currentStepId: "currentStep",
      readyToAdvanceStepId: "readyToAdvanceStep",
      activeVariationId: "activeVariation",
      lastCompletedOccurrenceId: "lastCompletedOccurrence"
    }
  });

  if (!normalizedRow) {
    return null;
  }

  return {
    ...normalizedRow,
    lastCompletedOccurrence: normalizeSimplifiedRow(row.lastCompletedOccurrence, {
      dateOnlyFields: ["scheduledForDate", "performedOnDate"]
    })
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
              sort: ["slug"],
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
