import {
  compactIds,
  jsonRestContext,
  simplifiedRows,
  transaction
} from "@local/workflow-support/server/jsonRestWorkflow";
import { normalizeSimplifiedRow } from "@local/main/shared";

async function queryRows(api, resourceName, queryParams = {}, options = {}, normalize = (row) => row) {
  const resource = api?.resources?.[resourceName];
  if (!resource || typeof resource.query !== "function") {
    throw new TypeError(`Missing JSON REST resource ${resourceName}.`);
  }

  return simplifiedRows(
    await resource.query(
      {
        queryParams,
        transaction: transaction(options),
        simplified: true
      },
      jsonRestContext(options)
    ),
    normalize
  );
}

function normalizeStepRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      instanceProgressionId: "instanceProgression",
      sourceProgressionEntryId: "sourceProgressionEntry",
      exerciseId: "exercise"
    }
  });
  if (!normalized) {
    return null;
  }

  return normalized;
}

function normalizeProgressRow(row = null) {
  const normalized = normalizeSimplifiedRow(row, {
    relationIds: {
      programAssignmentId: "programAssignment",
      instanceProgressionId: "instanceProgression",
      currentInstanceProgressionEntryId: "currentInstanceProgressionEntry",
      readyToAdvanceInstanceProgressionEntryId: "readyToAdvanceInstanceProgressionEntry",
      lastCompletedWorkoutId: "lastCompletedWorkout"
    }
  });

  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    lastCompletedWorkout: normalizeSimplifiedRow(row.lastCompletedWorkout, {
      relationIds: {
        programAssignmentId: "programAssignment",
        programAssignmentRevisionId: "programAssignmentRevision"
      },
      dateOnlyFields: ["scheduledForDate", "performedOnDate"]
    })
  };
}

function createRepository({ api } = {}) {
  if (!api) {
    throw new TypeError("createRepository requires api.");
  }

  return Object.freeze({
    async listUserProgressionsByUserId(userId, options = {}) {
      if (!userId) {
        return [];
      }

      return queryRows(
        api,
        "userProgressions",
        {
          include: [
            "programAssignment",
            "instanceProgression",
            "currentInstanceProgressionEntry",
            "readyToAdvanceInstanceProgressionEntry",
            "lastCompletedWorkout"
          ],
          sort: ["createdAt"],
          page: {
            size: 512
          }
        },
        options,
        normalizeProgressRow
      );
    },

    async listStepsByIds(stepIds = [], options = {}) {
      const ids = compactIds(stepIds);
      if (ids.length < 1) {
        return [];
      }

      return queryRows(
        api,
        "instanceProgressionEntries",
        {
          filters: {
            ids
          },
          include: ["instanceProgression", "exercise"],
          sort: ["instanceProgressionId", "stepNumber"],
          page: {
            size: 512
          }
        },
        options,
        normalizeStepRow
      );
    }
  });
}

export { createRepository };
