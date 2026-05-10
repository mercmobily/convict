import { ref } from "vue";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";

function useApplyAdvancementCommand({ onSuccess } = {}) {
  const activeAdvancingProgressionTrackId = ref("");

  const applyAdvancementCommand = useCommand({
    apiSuffix: "/today/progress/apply-advancement",
    writeMethod: "POST",
    fallbackRunError: "Unable to apply this advancement.",
    buildRawPayload: () => ({
      progressionTrackId: String(activeAdvancingProgressionTrackId.value || "").trim()
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
      activeAdvancingProgressionTrackId.value === String(exercise.progressionTrackId || "").trim()
    );
  }

  async function applyAdvancement(exercise = {}) {
    const progressionTrackId = String(exercise.progressionTrackId || "").trim();
    if (!progressionTrackId) {
      return;
    }

    activeAdvancingProgressionTrackId.value = progressionTrackId;
    try {
      await applyAdvancementCommand.run();
    } finally {
      activeAdvancingProgressionTrackId.value = "";
    }
  }

  return Object.freeze({
    applyAdvancement,
    isApplyingAdvancement
  });
}

export { useApplyAdvancementCommand };
