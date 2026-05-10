import {
  buildProgressDisplayState,
  localTodayDateString,
  withoutConvictPrefix
} from "@local/main/shared";
import { resolveCurrentUserId } from "@local/workflow-support/server/requestContext";

function progressStatus(progressRow = null) {
  if (progressRow?.readyToAdvanceInstanceProgressionEntryId) {
    return "ready_to_advance";
  }

  if (progressRow?.lastCompletedWorkoutId || progressRow?.lastCompletedAt) {
    return "in_progress";
  }

  return "not_started";
}

function buildSummary(progressItems = []) {
  const totalExercises = progressItems.length;
  const startedExercises = progressItems.filter((item) => item.status !== "not_started").length;
  const readyToAdvanceExercises = progressItems.filter((item) => item.status === "ready_to_advance").length;

  return {
    totalExercises,
    startedExercises,
    readyToAdvanceExercises
  };
}

function buildRowsById(rows = []) {
  const index = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.id || "").trim();
    if (id) {
      index.set(id, row);
    }
  }
  return index;
}

function sortProgressRows(rows = []) {
  return [...(Array.isArray(rows) ? rows : [])].sort((left, right) => {
    const leftProgression = left?.instanceProgression || {};
    const rightProgression = right?.instanceProgression || {};
    const sortDelta = Number(leftProgression.sortOrder || 0) - Number(rightProgression.sortOrder || 0);
    if (sortDelta !== 0) {
      return sortDelta;
    }
    return String(leftProgression.name || "").localeCompare(String(rightProgression.name || ""));
  });
}

function createService({ progressRepository } = {}) {
  if (!progressRepository) {
    throw new TypeError("createService requires feature.progress.repository.");
  }

  return Object.freeze({
    async getProgressState(input = {}, options = {}) {
      void input;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);
      const progressRows = await progressRepository.listUserProgressionsByUserId(userId, { context });
      const stepIds = [
        ...new Set(
          progressRows
            .flatMap((row) => [
              row.currentInstanceProgressionEntryId,
              row.readyToAdvanceInstanceProgressionEntryId
            ])
            .filter(Boolean)
        )
      ];
      const stepsById = buildRowsById(await progressRepository.listStepsByIds(stepIds, { context }));

      const progressItems = sortProgressRows(progressRows).map((progressRow) => {
        const progression = progressRow.instanceProgression || {};
        const instanceProgressionId = String(progression.id || progressRow.instanceProgressionId || "").trim();
        const currentStep =
          stepsById.get(String(progressRow.currentInstanceProgressionEntryId || "")) ||
          progressRow.currentInstanceProgressionEntry ||
          null;
        const readyStep =
          stepsById.get(String(progressRow.readyToAdvanceInstanceProgressionEntryId || "")) ||
          progressRow.readyToAdvanceInstanceProgressionEntry ||
          null;
        const lastCompletedWorkout = progressRow.lastCompletedWorkout || null;
        const status = progressStatus(progressRow);
        const progressDisplayState = buildProgressDisplayState({
          progressRow,
          currentStep,
          readyStep
        });

        return {
          instanceProgressionId,
          progressionSlug: String(progression.slug || "").trim(),
          progressionName: withoutConvictPrefix(progression.name || ""),
          exerciseId: currentStep?.exerciseId || null,
          exerciseSlug: String(currentStep?.exercise?.slug || "").trim(),
          exerciseName: String(currentStep?.exercise?.name || "").trim(),
          status,
          ...progressDisplayState,
          measurementUnit: String(currentStep?.measurementUnit || "").trim(),
          beginnerSets: currentStep?.beginnerSets ?? null,
          beginnerRepsMin: currentStep?.beginnerRepsMin ?? null,
          beginnerRepsMax: currentStep?.beginnerRepsMax ?? null,
          beginnerSeconds: currentStep?.beginnerSeconds ?? null,
          intermediateSets: currentStep?.intermediateSets ?? null,
          intermediateRepsMin: currentStep?.intermediateRepsMin ?? null,
          intermediateRepsMax: currentStep?.intermediateRepsMax ?? null,
          intermediateSeconds: currentStep?.intermediateSeconds ?? null,
          progressionSets: currentStep?.progressionSets ?? null,
          progressionRepsMin: currentStep?.progressionRepsMin ?? null,
          progressionRepsMax: currentStep?.progressionRepsMax ?? null,
          progressionSeconds: currentStep?.progressionSeconds ?? null,
          lastCompletedAt: progressRow?.lastCompletedAt || null,
          lastCompletedScheduledForDate: lastCompletedWorkout?.scheduledForDate || null,
          lastPerformedOnDate: lastCompletedWorkout?.performedOnDate || null,
          lastCompletedWorkoutStatus: String(lastCompletedWorkout?.status || "").trim()
        };
      });

      return {
        date: localTodayDateString(),
        summary: buildSummary(progressItems),
        progress: progressItems
      };
    }
  });
}

export { createService };
