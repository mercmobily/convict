import { ref } from "vue";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";

function useApplyAdvancementCommand({ onSuccess } = {}) {
  const activeAdvancingExerciseId = ref("");

  const applyAdvancementCommand = useCommand({
    apiSuffix: "/today/progress/apply-advancement",
    writeMethod: "POST",
    fallbackRunError: "Unable to apply this advancement.",
    buildRawPayload: () => ({
      exerciseId: String(activeAdvancingExerciseId.value || "").trim()
    }),
    messages: {
      success: "Advancement applied.",
      error: "Unable to apply this advancement."
    },
    async onRunSuccess() {
      if (typeof onSuccess === "function") {
        await onSuccess();
      }
    }
  });

  function isApplyingAdvancement(exercise = {}) {
    return Boolean(
      applyAdvancementCommand.isRunning &&
      activeAdvancingExerciseId.value === String(exercise.exerciseId || "").trim()
    );
  }

  async function applyAdvancement(exercise = {}) {
    const exerciseId = String(exercise.exerciseId || "").trim();
    if (!exerciseId) {
      return;
    }

    activeAdvancingExerciseId.value = exerciseId;
    try {
      await applyAdvancementCommand.run();
    } finally {
      activeAdvancingExerciseId.value = "";
    }
  }

  return Object.freeze({
    applyAdvancement,
    isApplyingAdvancement
  });
}

export { useApplyAdvancementCommand };
