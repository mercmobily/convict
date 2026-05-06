import {
  localTodayDateString,
  resolveCurrentUserId,
  resolveCurrentWorkspace
} from "@local/main/shared";

function progressStatus(progressRow = null) {
  if (progressRow?.readyToAdvanceStepId) {
    return "ready_to_advance";
  }

  if (progressRow?.id || progressRow?.lastCompletedOccurrenceId || progressRow?.lastCompletedAt) {
    return "in_progress";
  }

  return "not_started";
}

function buildSummary(exerciseProgress = []) {
  const totalExercises = exerciseProgress.length;
  const startedExercises = exerciseProgress.filter((exercise) => exercise.status !== "not_started").length;
  const readyToAdvanceExercises = exerciseProgress.filter((exercise) => exercise.status === "ready_to_advance").length;

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
      const workspace = resolveCurrentWorkspace(context);

      const [exerciseRows, progressRows] = await Promise.all([
        progressRepository.listExercises({ context }),
        progressRepository.listExerciseProgressByUserId(userId, { context })
      ]);

      const progressByExerciseId = new Map(
        progressRows
          .filter((row) => row?.exerciseId)
          .map((row) => [String(row.exerciseId), row])
      );

      const missingExerciseIds = exerciseRows
        .map((exercise) => String(exercise.id || "").trim())
        .filter(Boolean)
        .filter((exerciseId) => !progressByExerciseId.has(exerciseId));

      const firstStepRows = await progressRepository.listFirstStepsByExerciseIds(missingExerciseIds, { context });
      const firstStepByExerciseId = new Map(
        firstStepRows
          .filter((row) => row?.exerciseId)
          .map((row) => [String(row.exerciseId), row])
      );

      const exerciseProgress = exerciseRows.map((exercise) => {
        const exerciseId = String(exercise.id || "").trim();
        const progressRow = progressByExerciseId.get(exerciseId) || null;
        const currentStep = progressRow?.currentStep || firstStepByExerciseId.get(exerciseId) || null;
        const readyStep = progressRow?.readyToAdvanceStep || null;
        const lastCompletedOccurrence = progressRow?.lastCompletedOccurrence || null;
        const status = progressStatus(progressRow);

        return {
          exerciseId,
          exerciseSlug: String(exercise.slug || "").trim(),
          exerciseName: String(exercise.name || "").trim(),
          status,
          currentProgressStepId: progressRow?.currentStepId || currentStep?.id || null,
          currentProgressStepNumber: Number(currentStep?.stepNumber || 0) || null,
          currentProgressStepName: String(currentStep?.stepName || "").trim(),
          currentProgressStepInstruction: String(currentStep?.instructionText || "").trim(),
          measurementUnit: String(currentStep?.measurementUnit || "").trim(),
          beginnerSets: currentStep?.beginnerSets ?? null,
          beginnerReps: currentStep?.beginnerReps ?? null,
          beginnerSeconds: currentStep?.beginnerSeconds ?? null,
          intermediateSets: currentStep?.intermediateSets ?? null,
          intermediateReps: currentStep?.intermediateReps ?? null,
          intermediateSeconds: currentStep?.intermediateSeconds ?? null,
          progressionSets: currentStep?.progressionSets ?? null,
          progressionRepsMin: currentStep?.progressionRepsMin ?? null,
          progressionRepsMax: currentStep?.progressionRepsMax ?? null,
          progressionSeconds: currentStep?.progressionSeconds ?? null,
          activeVariationId: progressRow?.activeVariationId || null,
          activeVariationName: String(progressRow?.activeVariation?.name || "").trim(),
          readyToAdvanceStepId: progressRow?.readyToAdvanceStepId || null,
          readyToAdvanceStepNumber: Number(readyStep?.stepNumber || 0) || null,
          readyToAdvanceStepName: String(readyStep?.stepName || "").trim(),
          readyToAdvanceAt: progressRow?.readyToAdvanceAt || null,
          lastCompletedAt: progressRow?.lastCompletedAt || null,
          lastCompletedScheduledForDate: lastCompletedOccurrence?.scheduledForDate || null,
          lastPerformedOnDate: lastCompletedOccurrence?.performedOnDate || null,
          lastCompletedWorkoutStatus: String(lastCompletedOccurrence?.status || "").trim()
        };
      });

      return {
        date: localTodayDateString(),
        workspace: workspace
          ? {
              id: workspace.id,
              slug: String(workspace.slug || "").trim(),
              name: String(workspace.name || "").trim()
            }
          : null,
        summary: buildSummary(exerciseProgress),
        progress: exerciseProgress
      };
    }
  });
}

export { createService };
