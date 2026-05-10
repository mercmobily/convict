import { ref } from "vue";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";

function useApplyAdvancementCommand({ onSuccess } = {}) {
  const activeAdvancingInstanceProgressionId = ref("");

  const applyAdvancementCommand = useCommand({
    apiSuffix: "/today/progress/apply-advancement",
    writeMethod: "POST",
    fallbackRunError: "Unable to apply this advancement.",
    buildRawPayload: () => ({
      instanceProgressionId: String(activeAdvancingInstanceProgressionId.value || "").trim()
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
      activeAdvancingInstanceProgressionId.value === String(exercise.instanceProgressionId || "").trim()
    );
  }

  async function applyAdvancement(exercise = {}) {
    const instanceProgressionId = String(exercise.instanceProgressionId || "").trim();
    if (!instanceProgressionId) {
      return;
    }

    activeAdvancingInstanceProgressionId.value = instanceProgressionId;
    try {
      await applyAdvancementCommand.run();
    } finally {
      activeAdvancingInstanceProgressionId.value = "";
    }
  }

  return Object.freeze({
    applyAdvancement,
    isApplyingAdvancement
  });
}

export { useApplyAdvancementCommand };
