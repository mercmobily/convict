<script setup>
import { computed, ref, watch } from "vue";
import {
  mdiArrowRightCircleOutline,
  mdiDumbbell
} from "@mdi/js";
import WorkoutSetLogAddEditElement from "@/components/WorkoutSetLogAddEditElement.vue";
import WorkoutSetLogListElement from "@/components/WorkoutSetLogListElement.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import { useCommand } from "@jskit-ai/users-web/client/composables/useCommand";

const props = defineProps({
  exercise: {
    type: Object,
    required: true
  },
  workoutStatus: {
    type: String,
    default: ""
  },
  isApplyingAdvancement: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "logs-changed",
  "dirty-state-changed",
  "advance-requested"
]);

const {
  exerciseCurrentStepNumber,
  exerciseDetailLine,
  exerciseStatusColor,
  exerciseStatusLabel,
  formatWorkSetLabel,
  measurementLabel,
  progressionTargetLabel
} = useConvictWorkoutPresentation();

const activeDeleteRecordId = ref("");
const createEditorDirty = ref(false);
const createEditorResetKey = ref(0);
const editEditorDirty = ref(false);
const editState = ref(null);

const occurrenceExerciseId = computed(() => String(props.exercise?.occurrenceExerciseId || "").trim());
const canEdit = computed(() => props.workoutStatus === "in_progress" && Boolean(occurrenceExerciseId.value));
const measurementUnit = computed(() => measurementLabel(props.exercise?.measurementUnit));

const deleteSetLogCommand = useCommand({
  apiSuffix: () => `/workout-set-logs/${activeDeleteRecordId.value}`,
  writeMethod: "DELETE",
  suppressSuccessMessage: true,
  fallbackRunError: "Unable to delete this set.",
  async onRunSuccess() {
    emit("logs-changed");
  }
});

const savedSetLogs = computed(() => {
  const items = Array.isArray(props.exercise?.setLogs) ? props.exercise.setLogs : [];
  return items.slice().sort((left, right) => {
    const setNumberDelta = Number(left?.setNumber || 0) - Number(right?.setNumber || 0);
    if (setNumberDelta !== 0) {
      return setNumberDelta;
    }

    return String(left?.id || "").localeCompare(String(right?.id || ""));
  });
});

const nextDisplaySetNumber = computed(() => savedSetLogs.value.length + 1);
const nextSequenceValue = computed(() => {
  return savedSetLogs.value.reduce((maxValue, setLog) => {
    const currentValue = Number(setLog?.setNumber || 0);
    return currentValue > maxValue ? currentValue : maxValue;
  }, 0) + 1;
});

const hasDirtyDraft = computed(() => createEditorDirty.value || editEditorDirty.value);
const showUnsavedBadge = computed(() => {
  if (props.workoutStatus !== "in_progress") {
    return false;
  }

  return savedSetLogs.value.length < 1 || hasDirtyDraft.value;
});

watch(
  hasDirtyDraft,
  (nextValue) => {
    emit("dirty-state-changed", Boolean(nextValue));
  },
  {
    immediate: true
  }
);

function exerciseInstructionText() {
  return String(props.exercise?.currentProgressStepInstruction || props.exercise?.currentStepInstruction || "").trim();
}

function canAdvanceExercise() {
  return Boolean(props.exercise?.canApplyAdvancement);
}

function hasAdvancedPastWorkoutSnapshot() {
  return Boolean(props.exercise?.hasProgressStepChanged);
}

function openEditEditor(setLog = {}, displaySetNumber = 1) {
  editState.value = {
    recordId: String(setLog.id || "").trim(),
    displaySetNumber: Number(displaySetNumber || 1),
    initialPerformedValue: String(setLog.performedValue ?? "")
  };
}

function closeEditEditor() {
  editState.value = null;
  editEditorDirty.value = false;
}

async function handleCreateSaved() {
  createEditorDirty.value = false;
  createEditorResetKey.value += 1;
  emit("logs-changed");
}

async function handleEditSaved() {
  closeEditEditor();
  emit("logs-changed");
}

async function deleteSetLog(setLog = {}) {
  const recordId = String(setLog.id || "").trim();
  if (!recordId) {
    return;
  }

  if (String(editState.value?.recordId || "") === recordId) {
    closeEditEditor();
  }

  activeDeleteRecordId.value = recordId;
  try {
    await deleteSetLogCommand.run();
  } finally {
    activeDeleteRecordId.value = "";
  }
}

function isDeletingSetLog(setLog = {}) {
  return Boolean(
    deleteSetLogCommand.isRunning &&
    activeDeleteRecordId.value === String(setLog.id || "")
  );
}
</script>

<template>
  <v-card
    rounded="xl"
    elevation="1"
    border
    class="exercise-card"
  >
    <v-card-item>
      <template #prepend>
        <v-avatar color="primary" variant="tonal" rounded="lg">
          <v-icon :icon="mdiDumbbell" />
        </v-avatar>
      </template>
      <div class="d-flex flex-column ga-1">
        <h4 class="text-h6 mb-0">{{ exercise.exerciseName }}</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ exerciseDetailLine(exercise) }}
        </p>
      </div>
    </v-card-item>
    <v-divider />
    <v-card-text class="d-flex flex-column ga-4">
      <div class="d-flex flex-wrap ga-2 align-center">
        <v-chip color="primary" variant="tonal" size="small" label>
          {{ formatWorkSetLabel(exercise.plannedWorkSetsMin, exercise.plannedWorkSetsMax) }}
        </v-chip>
        <v-chip
          v-if="exerciseCurrentStepNumber(exercise)"
          color="info"
          variant="tonal"
          size="small"
          label
        >
          Step {{ exerciseCurrentStepNumber(exercise) }}
        </v-chip>
        <v-chip color="secondary" variant="tonal" size="small" label>
          {{ measurementUnit }}
        </v-chip>
        <v-chip
          v-if="progressionTargetLabel(exercise)"
          color="success"
          variant="tonal"
          size="small"
          label
        >
          Progression {{ progressionTargetLabel(exercise) }}
        </v-chip>
        <v-chip :color="exerciseStatusColor(exercise.exerciseStatus)" variant="tonal" size="small" label>
          {{ exerciseStatusLabel(exercise.exerciseStatus) }}
        </v-chip>
      </div>

      <div class="exercise-card__save-state-lane">
        <div
          class="exercise-card__save-state-badge"
          :class="{ 'exercise-card__save-state-badge--visible': showUnsavedBadge }"
          :aria-hidden="String(!showUnsavedBadge)"
        >
          LOG NOT SAVED
        </div>
      </div>

      <p
        v-if="exerciseInstructionText()"
        class="text-body-2 text-medium-emphasis mb-0 exercise-card__instruction"
      >
        {{ exerciseInstructionText() }}
      </p>

      <v-alert
        v-if="canAdvanceExercise()"
        type="success"
        variant="tonal"
        border="start"
        :title="`Ready to advance to ${exercise.readyToAdvanceStepName}`"
        :text="`You have earned the next canonical step. Stay on ${exercise.currentProgressStepName || exercise.currentStepName} as long as you like, or advance now.`"
      >
        <template #append>
          <v-btn
            color="success"
            :prepend-icon="mdiArrowRightCircleOutline"
            :loading="isApplyingAdvancement"
            @click="emit('advance-requested')"
          >
            Advance now
          </v-btn>
        </template>
      </v-alert>

      <v-alert
        v-else-if="hasAdvancedPastWorkoutSnapshot()"
        type="info"
        variant="tonal"
        border="start"
        :title="`Current training step: ${exercise.currentProgressStepName}`"
        :text="`This workout was logged against ${exercise.currentStepName}. Your live progress has already moved on.`"
      />

      <div class="d-flex flex-column ga-3">
        <template
          v-for="(setLog, index) in savedSetLogs"
          :key="String(setLog.id || '')"
        >
          <WorkoutSetLogAddEditElement
            v-if="editState && editState.recordId === String(setLog.id || '')"
            :key="`edit:${editState.recordId}`"
            :exercise="exercise"
            mode="patch"
            :record-id="editState.recordId"
            :display-set-number="editState.displaySetNumber"
            :initial-performed-value="editState.initialPerformedValue"
            @saved="handleEditSaved"
            @cancel="closeEditEditor"
            @dirty-state-changed="editEditorDirty = $event"
          />

          <WorkoutSetLogListElement
            :set-log="setLog"
            :display-set-number="index + 1"
            :measurement-unit="exercise.measurementUnit"
            :qualifies-for-progression="Boolean(setLog.qualifiesForProgression)"
            :can-edit="canEdit"
            :is-deleting="isDeletingSetLog(setLog)"
            @edit="openEditEditor(setLog, index + 1)"
            @delete="deleteSetLog(setLog)"
          />
        </template>

        <p
          v-if="savedSetLogs.length < 1"
          class="text-body-2 text-medium-emphasis mb-0"
        >
          No saved sets yet.
        </p>

        <WorkoutSetLogAddEditElement
          v-if="canEdit"
          :key="`create:${createEditorResetKey}`"
          :exercise="exercise"
          mode="create"
          :display-set-number="nextDisplaySetNumber"
          :sequence-value="nextSequenceValue"
          @saved="handleCreateSaved"
          @dirty-state-changed="createEditorDirty = $event"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.exercise-card {
  background: rgba(var(--v-theme-surface-variant), 0.12);
}

.exercise-card__instruction {
  line-height: 1.5;
}

.exercise-card__save-state-lane {
  min-height: 2.25rem;
  display: flex;
  align-items: center;
}

.exercise-card__save-state-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-theme-error), 0.4);
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.14s ease;
}

.exercise-card__save-state-badge--visible {
  opacity: 1;
  visibility: visible;
}
</style>
