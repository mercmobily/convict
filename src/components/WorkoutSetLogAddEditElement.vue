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
      normalizedRecordId.value || "create"
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
  <v-card
    variant="tonal"
    color="primary"
    :class="[
      'set-log-editor',
      { 'set-log-editor--inline': !isCreateMode }
    ]"
  >
    <v-card-text
      :class="[
        'd-flex',
        'flex-column',
        'ga-4',
        'set-log-editor__content',
        { 'set-log-editor__content--inline': !isCreateMode }
      ]"
    >
      <div v-if="isCreateMode">
        <div class="text-body-2 font-weight-medium">
          {{ `Add set ${displaySetNumber}` }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          Save this set to persist it immediately.
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
        <div class="set-log-editor__form-row">
          <v-text-field
            v-model="formState.performedValue"
            :label="measurementUnitLabel"
            type="number"
            min="0"
            step="1"
            variant="outlined"
            density="comfortable"
            class="set-log-editor__field"
            :disabled="addEdit.isFieldLocked"
            hide-details="auto"
            :error-messages="resolveFieldErrors('performedValue')"
          />

          <div class="set-log-editor__actions">
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
    </v-card-text>
  </v-card>
</template>

<style scoped>
.set-log-editor {
  border-radius: 1rem;
}

.set-log-editor--inline {
  background: rgba(var(--v-theme-surface), 0.72);
  color: inherit;
}

.set-log-editor__content--inline {
  padding: 0.75rem 1rem !important;
}

.set-log-editor__form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.set-log-editor__field {
  flex: 0 1 8.5rem;
  min-width: 7rem;
}

.set-log-editor__field :deep(.v-input__control) {
  min-width: 0;
}

.set-log-editor__actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: auto;
  padding-top: 0.125rem;
}

@media (max-width: 420px) {
  .set-log-editor__field {
    flex-basis: 100%;
    min-width: 100%;
  }

  .set-log-editor__actions {
    width: 100%;
    margin-left: 0;
  }
}
</style>
