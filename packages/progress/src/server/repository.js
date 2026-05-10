import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";
import { normalizeSimplifiedRow } from "@local/main/shared";

function jsonRestContext(options = {}) {
  return createJsonRestContext(options?.context || null);
}

function transaction(options = {}) {
  return options?.trx || null;
}

function normalizeStepRow(row = null) {
  return normalizeSimplifiedRow(row, {
    relationIds: {
      progressionTrackId: "progressionTrack",
      exerciseId: "exercise"
    }
  });
}

function normalizeProgressRow(row = null) {
  const normalizedRow = normalizeSimplifiedRow(row, {
    relationIds: {
      progressionTrackId: "progressionTrack",
      currentProgressionTrackStepId: "currentProgressionTrackStep",
      readyToAdvanceProgressionTrackStepId: "readyToAdvanceProgressionTrackStep",
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
    async listProgressionTracks(options = {}) {
      return extractJsonRestCollectionRows(
        await api.resources.progressionTracks.query(
          {
            queryParams: {
              include: ["defaultExerciseCategory"],
              sort: ["sortOrder", "slug"],
              page: {
                size: 128
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      );
    },

    async listProgressionTrackProgressByUserId(userId, options = {}) {
      if (!userId) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.userProgressionTrackProgress.query(
          {
            queryParams: {
              filters: {
                userId
              },
              include: [
                "progressionTrack",
                "currentProgressionTrackStep",
                "readyToAdvanceProgressionTrackStep",
                "lastCompletedOccurrence"
              ],
              sort: ["createdAt"],
              page: {
                size: 128
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeProgressRow(row)).filter(Boolean);
    },

    async listFirstStepsByTrackIds(progressionTrackIds = [], options = {}) {
      const ids = Array.isArray(progressionTrackIds) ? progressionTrackIds.filter(Boolean) : [];
      if (ids.length < 1) {
        return [];
      }

      return extractJsonRestCollectionRows(
        await api.resources.progressionTrackSteps.query(
          {
            queryParams: {
              filters: {
                progressionTrackIds: ids,
                stepNumber: 1
              },
              include: ["progressionTrack", "exercise"],
              sort: ["progressionTrackId", "stepNumber"],
              page: {
                size: 128
              }
            },
            transaction: transaction(options),
            simplified: true
          },
          jsonRestContext(options)
        )
      ).map((row) => normalizeStepRow(row)).filter(Boolean);
    }
  });
}

export { createRepository };
