import {
  buildProgressDisplayState,
  localTodayDateString,
  withoutConvictPrefix
} from "@local/main/shared";
import { resolveCurrentUserId } from "@local/main/shared/requestContext";

function progressStatus(progressRow = null) {
  if (progressRow?.readyToAdvanceProgressionTrackStepId) {
    return "ready_to_advance";
  }

  if (progressRow?.lastCompletedOccurrenceId || progressRow?.lastCompletedAt) {
    return "in_progress";
  }

  return "not_started";
}

function buildSummary(trackProgress = []) {
  const totalExercises = trackProgress.length;
  const startedExercises = trackProgress.filter((track) => track.status !== "not_started").length;
  const readyToAdvanceExercises = trackProgress.filter((track) => track.status === "ready_to_advance").length;

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
    const leftProgression = left?.progressionTrack || {};
    const rightProgression = right?.progressionTrack || {};
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
      const progressRows = await progressRepository.listProgressionTrackProgressByUserId(userId, { context });
      const stepIds = [
        ...new Set(
          progressRows
            .flatMap((row) => [
              row.currentProgressionTrackStepId,
              row.readyToAdvanceProgressionTrackStepId
            ])
            .filter(Boolean)
        )
      ];
      const stepsById = buildRowsById(await progressRepository.listStepsByIds(stepIds, { context }));

      const trackProgress = sortProgressRows(progressRows).map((progressRow) => {
        const track = progressRow.progressionTrack || {};
        const progressionTrackId = String(track.id || progressRow.progressionTrackId || "").trim();
        const currentStep =
          stepsById.get(String(progressRow.currentProgressionTrackStepId || "")) ||
          progressRow.currentProgressionTrackStep ||
          null;
        const readyStep =
          stepsById.get(String(progressRow.readyToAdvanceProgressionTrackStepId || "")) ||
          progressRow.readyToAdvanceProgressionTrackStep ||
          null;
        const lastCompletedOccurrence = progressRow.lastCompletedOccurrence || null;
        const status = progressStatus(progressRow);
        const progressDisplayState = buildProgressDisplayState({
          progressRow,
          currentStep,
          readyStep
        });

        return {
          progressionTrackId,
          progressionTrackSlug: String(track.slug || "").trim(),
          progressionTrackName: withoutConvictPrefix(track.name || ""),
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
          lastCompletedScheduledForDate: lastCompletedOccurrence?.scheduledForDate || null,
          lastPerformedOnDate: lastCompletedOccurrence?.performedOnDate || null,
          lastCompletedWorkoutStatus: String(lastCompletedOccurrence?.status || "").trim()
        };
      });

      return {
        date: localTodayDateString(),
        summary: buildSummary(trackProgress),
        progress: trackProgress
      };
    }
  });
}

export { createService };
