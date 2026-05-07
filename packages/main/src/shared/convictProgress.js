const CANONICAL_EXERCISE_SLUG_ORDER = Object.freeze([
  "push-ups",
  "squats",
  "pull-ups",
  "leg-raises",
  "bridges",
  "handstand-push-ups"
]);

function canonicalExerciseRank(exercise = {}) {
  const slug = String(exercise?.slug || exercise?.exerciseSlug || "").trim();
  const index = CANONICAL_EXERCISE_SLUG_ORDER.indexOf(slug);
  return index >= 0 ? index : CANONICAL_EXERCISE_SLUG_ORDER.length;
}

function sortCanonicalExercises(exercises = []) {
  return [...(Array.isArray(exercises) ? exercises : [])].sort((left, right) => {
    const rankDelta = canonicalExerciseRank(left) - canonicalExerciseRank(right);
    if (rankDelta !== 0) {
      return rankDelta;
    }

    return String(left?.name || left?.exerciseName || "").localeCompare(
      String(right?.name || right?.exerciseName || "")
    );
  });
}

function buildProgressDisplayState(
  {
    progressRow = null,
    currentStep = null,
    fallbackStep = null,
    readyStep = null,
    base = {}
  } = {},
  {
    emptyReadyStepName = "",
    emptyCurrentStepName = "",
    emptyCurrentStepInstruction = ""
  } = {}
) {
  const resolvedCurrentStep = currentStep || fallbackStep || null;
  const currentProgressStepId =
    progressRow?.currentStepId ||
    resolvedCurrentStep?.id ||
    base?.currentProgressStepId ||
    base?.currentStepId ||
    null;

  return {
    currentProgressStepId,
    currentProgressStepNumber:
      resolvedCurrentStep?.stepNumber ??
      base?.currentProgressStepNumber ??
      base?.currentStepNumber ??
      null,
    currentProgressStepName:
      resolvedCurrentStep?.stepName ||
      base?.currentProgressStepName ||
      base?.currentStepName ||
      emptyCurrentStepName,
    currentProgressStepInstruction:
      resolvedCurrentStep?.instructionText ||
      base?.currentProgressStepInstruction ||
      base?.currentStepInstruction ||
      emptyCurrentStepInstruction,
    readyToAdvanceStepId: progressRow?.readyToAdvanceStepId || base?.readyToAdvanceStepId || null,
    readyToAdvanceStepNumber: readyStep?.stepNumber ?? base?.readyToAdvanceStepNumber ?? null,
    readyToAdvanceStepName:
      readyStep?.stepName ||
      base?.readyToAdvanceStepName ||
      emptyReadyStepName,
    readyToAdvanceAt: progressRow?.readyToAdvanceAt || base?.readyToAdvanceAt || null
  };
}

export {
  buildProgressDisplayState,
  CANONICAL_EXERCISE_SLUG_ORDER,
  sortCanonicalExercises
};
