import {
  buildProgressDisplayState,
  localTodayDateString,
  sortCanonicalProgressionTracks,
  withoutConvictPrefix
} from "@local/main/shared";
import { resolveCurrentUserId } from "@local/main/shared/requestContext";

function progressStatus(progressRow = null) {
  if (progressRow?.readyToAdvanceProgressionTrackStepId) {
    return "ready_to_advance";
  }

  if (progressRow?.id || progressRow?.lastCompletedOccurrenceId || progressRow?.lastCompletedAt) {
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

function createService({ progressRepository } = {}) {
  if (!progressRepository) {
    throw new TypeError("createService requires feature.progress.repository.");
  }

  return Object.freeze({
    async getProgressState(input = {}, options = {}) {
      void input;
      const context = options?.context || null;
      const userId = resolveCurrentUserId(context);

      const [trackRows, progressRows] = await Promise.all([
        progressRepository.listProgressionTracks({ context }),
        progressRepository.listProgressionTrackProgressByUserId(userId, { context })
      ]);

      const progressByTrackId = new Map(
        progressRows
          .filter((row) => row?.progressionTrackId)
          .map((row) => [String(row.progressionTrackId), row])
      );

      const missingTrackIds = trackRows
        .map((track) => String(track.id || "").trim())
        .filter(Boolean)
        .filter((trackId) => !progressByTrackId.has(trackId));

      const firstStepRows = await progressRepository.listFirstStepsByTrackIds(missingTrackIds, { context });
      const firstStepByTrackId = new Map(
        firstStepRows
          .filter((row) => row?.progressionTrackId)
          .map((row) => [String(row.progressionTrackId), row])
      );

      const trackProgress = sortCanonicalProgressionTracks(trackRows).map((track) => {
        const progressionTrackId = String(track.id || "").trim();
        const progressRow = progressByTrackId.get(progressionTrackId) || null;
        const currentStep = progressRow?.currentProgressionTrackStep || firstStepByTrackId.get(progressionTrackId) || null;
        const readyStep = progressRow?.readyToAdvanceProgressionTrackStep || null;
        const lastCompletedOccurrence = progressRow?.lastCompletedOccurrence || null;
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
