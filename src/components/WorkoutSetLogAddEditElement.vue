<script setup>
import { computed, reactive, watch } from "vue";
import { useCrudAddEdit } from "@jskit-ai/users-web/client/composables/useCrudAddEdit";
import { resource as workoutSetLogResource } from "@local/workout-set-logs/shared";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";

const props = defineProps({
  exercise: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    required: true
  },
  recordId: {
    type: [String, Number],
    default: ""
  },
  displaySetNumber: {
    type: Number,
    default: 1
  },
  sequenceValue: {
    type: Number,
    default: 1
  },
  initialPerformedValue: {
    type: [String, Number],
    default: ""
  }
});

const emit = defineEmits([
  "saved",
  "cancel",
  "dirty-state-changed"
]);

const { measurementLabel } = useConvictWorkoutPresentation();

const isCreateMode = computed(() => props.mode === "create");
const normalizedRecordId = computed(() => String(props.recordId || "").trim());
const normalizedInitialPerformedValue = computed(() => String(props.initialPerformedValue ?? "").trim());

const formState = reactive({
  performedValue: normalizedInitialPerformedValue.value
});

watch(
  normalizedInitialPerformedValue,
  (nextValue) => {
    formState.performedValue = nextValue;
  },
  {
    immediate: true
  }
);

const formRuntime = useCrudAddEdit({
  resource: workoutSetLogResource,
  operationName: isCreateMode.value ? "create" : "patch",
  formFields: [
    {
      key: "performedValue",
      label: computed(() => measurementUnitLabel.value),
      component: "v-text-field",
      props: {
        type: "number",
        min: 0,
        step: 1,
        variant: "outlined",
        density: "comfortable",
        hideDetails: "auto"
      }
    }
  ],
  addEditOptions: {
    model: formState,
    apiUrlTemplate: isCreateMode.value ? "/workout-set-logs" : "/workout-set-logs/:recordId",
    queryKeyFactory: (surfaceId = "", workspaceSlug = "") => [
      "convict",
      "workout-set-logs",
      isCreateMode.value ? "create" : "edit",
      String(surfaceId || ""),
      String(workspaceSlug || ""),
      String(props.exercise?.occurrenceExerciseId || ""),
      normalizedRecordId.value || String(props.sequenceValue || "")
    ],
    routeRecordId: normalizedRecordId,
    readEnabled: false,
    writeMethod: isCreateMode.value ? "POST" : "PATCH",
    placementSource: "convict.workout-set-logs.editor",
    fallbackSaveError: isCreateMode.value ? "Unable to add this set." : "Unable to update this set.",
    onSaveSuccess: async () => {
      if (isCreateMode.value) {
        formState.performedValue = "";
      }
      emit("saved");
    }
  },
  createModel: () => ({
    performedValue: normalizedInitialPerformedValue.value
  }),
  buildPayload(model = {}) {
    const performedValue = Number(String(model?.performedValue ?? "").trim() || 0);
    if (isCreateMode.value) {
      return {
        workoutOccurrenceExerciseId: String(props.exercise?.occurrenceExerciseId || "").trim(),
        setNumber: Number(props.sequenceValue || 1),
        side: "both",
        measurementUnitSnapshot: String(props.exercise?.measurementUnit || "").trim().toLowerCase() || "reps",
        performedValue
      };
    }

    return {
      performedValue
    };
  }
});

const addEdit = formRuntime.addEdit;
const measurementUnitLabel = computed(() => (
  measurementLabel(props.exercise?.measurementUnit) === "seconds" ? "Seconds" : "Reps"
));
const hasEnteredValue = computed(() => String(formState.performedValue ?? "").trim() !== "");
const formIsDirty = computed(() => String(formState.performedValue ?? "").trim() !== normalizedInitialPerformedValue.value);

watch(
  formIsDirty,
  (nextValue) => {
    emit("dirty-state-changed", Boolean(nextValue));
  },
  {
    immediate: true
  }
);

function resolveFieldErrors(fieldKey = "") {
  return formRuntime.resolveFieldErrors(fieldKey);
}

async function submit() {
  await addEdit.submit();
}

function cancel() {
  emit("cancel");
}
</script>

<template>
  <v-card variant="tonal" color="primary" class="set-log-editor">
    <v-card-text class="d-flex flex-column ga-4">
      <div class="d-flex align-center justify-space-between ga-3 flex-wrap">
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ isCreateMode ? `Add set ${displaySetNumber}` : `Edit set ${displaySetNumber}` }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ isCreateMode ? "Save this set to persist it immediately." : "Update this saved set." }}
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="!isCreateMode"
            variant="text"
            color="primary"
            @click="cancel"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="addEdit.isSaving"
            :disabled="addEdit.isSubmitDisabled || !hasEnteredValue"
            @click="submit"
          >
            Save set
          </v-btn>
        </div>
      </div>

      <v-alert
        v-if="addEdit.message && addEdit.messageType === 'error'"
        type="error"
        variant="tonal"
        border="start"
        :text="addEdit.message"
      />

      <v-form @submit.prevent="submit" novalidate>
        <v-text-field
          v-model="formState.performedValue"
          :label="measurementUnitLabel"
          type="number"
          min="0"
          step="1"
          variant="outlined"
          density="comfortable"
          :disabled="addEdit.isFieldLocked"
          :error-messages="resolveFieldErrors('performedValue')"
        />
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.set-log-editor {
  border-radius: 1rem;
}
</style>
