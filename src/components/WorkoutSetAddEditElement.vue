<script setup>
import { computed, reactive, watch } from "vue";
import { useCrudAddEdit } from "@jskit-ai/users-web/client/composables/useCrudAddEdit";
import { resource as workoutSetResource } from "@local/workout-sets/shared";
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
  resource: workoutSetResource,
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
    apiUrlTemplate: isCreateMode.value ? "/workout-sets" : "/workout-sets/:recordId",
    queryKeyFactory: (surfaceId = "", routeScope = "") => [
      "convict",
      "workout-sets",
      isCreateMode.value ? "create" : "edit",
      String(surfaceId || ""),
      String(routeScope || ""),
      String(props.exercise?.workoutExerciseId || ""),
      normalizedRecordId.value || "create"
    ],
    routeRecordId: normalizedRecordId,
    readEnabled: false,
    writeMethod: isCreateMode.value ? "POST" : "PATCH",
    placementSource: "convict.workout-sets.editor",
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
        workoutExerciseId: String(props.exercise?.workoutExerciseId || "").trim(),
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
const fieldLabel = computed(() => (
  isCreateMode.value ? `${measurementUnitLabel.value} in new set` : measurementUnitLabel.value
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
  <v-sheet
    rounded="lg"
    border
    class="workout-set-editor workout-set-editor--inline"
  >
    <div
      class="d-flex flex-column ga-3 workout-set-editor__content workout-set-editor__content--inline"
    >
      <v-alert
        v-if="addEdit.message && addEdit.messageType === 'error'"
        type="error"
        variant="tonal"
        border="start"
        :text="addEdit.message"
      />

      <v-form @submit.prevent="submit" novalidate>
        <div class="workout-set-editor__form-row">
          <v-text-field
            v-model="formState.performedValue"
            :label="fieldLabel"
            type="number"
            min="0"
            step="1"
            variant="outlined"
            density="comfortable"
            class="workout-set-editor__field"
            :disabled="addEdit.isFieldLocked"
            hide-details="auto"
            :error-messages="resolveFieldErrors('performedValue')"
          />

          <div class="workout-set-editor__actions">
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
              type="submit"
              :loading="addEdit.isSaving"
              :disabled="addEdit.isSubmitDisabled || !hasEnteredValue"
            >
              Save set
            </v-btn>
          </div>
        </div>
      </v-form>
    </div>
  </v-sheet>
</template>

<style scoped>
.workout-set-editor {
  border-radius: 1rem;
  background: rgba(var(--v-theme-primary), 0.08);
  color: inherit;
}

.workout-set-editor--inline {
  background: rgba(var(--v-theme-surface), 0.72);
}

.workout-set-editor__content {
  padding: 0.85rem;
}

.workout-set-editor__content--inline {
  padding: 0.75rem 1rem !important;
}

.workout-set-editor__form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.workout-set-editor__field {
  flex: 1 1 14rem;
  min-width: 10.75rem;
}

.workout-set-editor__field :deep(.v-input__control) {
  min-width: 0;
}

.workout-set-editor__actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 0.5rem;
  margin-left: auto;
  padding-top: 0.125rem;
}
</style>
