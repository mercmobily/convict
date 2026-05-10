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
  exerciseDetailLine,
  exerciseStatusColor,
  exerciseStatusLabel,
  formatWorkSetLabel,
  measurementLabel,
  progressionTargetLabel
} = useConvictWorkoutPresentation();

const activeDeleteRecordId = ref("");
const createEditorDirty = ref(false);
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
    emit("logs-changed", props.exercise);
  }
});

const savedSetLogs = computed(() => {
  const items = Array.isArray(props.exercise?.setLogs) ? props.exercise.setLogs : [];
  return items.slice();
});

const currentStepTitle = computed(() => exerciseDetailLine(props.exercise) || "No step data available.");
const exerciseEyebrow = computed(() => (
  String(props.exercise.progressionTrackName || props.exercise.section || "").trim()
));
const exerciseMetaParts = computed(() => ([
  formatWorkSetLabel(props.exercise.plannedWorkSetsMin, props.exercise.plannedWorkSetsMax),
  progressionTargetLabel(props.exercise) ? `Progression ${progressionTargetLabel(props.exercise)}` : "",
  measurementUnit.value
].filter(Boolean)));

const hasDirtyDraft = computed(() => createEditorDirty.value || editEditorDirty.value);

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

function openEditEditor(setLog = {}) {
  editState.value = {
    recordId: String(setLog.id || "").trim(),
    initialPerformedValue: String(setLog.performedValue ?? "")
  };
}

function closeEditEditor() {
  editState.value = null;
  editEditorDirty.value = false;
}

async function handleCreateSaved() {
  createEditorDirty.value = false;
  emit("logs-changed", props.exercise);
}

async function handleEditSaved() {
  closeEditEditor();
  emit("logs-changed", props.exercise);
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

function isEditingSetLog(setLog = {}) {
  return Boolean(
    editState.value &&
    editState.value.recordId === String(setLog.id || "").trim()
  );
}
</script>

<template>
  <v-sheet
    rounded="xl"
    border
    class="exercise-card"
  >
    <header class="exercise-card__header">
      <div class="exercise-card__identity">
        <v-avatar color="primary" variant="tonal" rounded="lg" class="exercise-card__icon">
          <v-icon :icon="mdiDumbbell" />
        </v-avatar>
        <div class="exercise-card__title-block">
          <div v-if="exerciseEyebrow" class="exercise-card__family">{{ exerciseEyebrow }}</div>
          <h4 class="exercise-card__step">{{ currentStepTitle }}</h4>
        </div>
      </div>
      <v-chip :color="exerciseStatusColor(exercise.exerciseStatus)" variant="tonal" size="small" label>
        {{ exerciseStatusLabel(exercise.exerciseStatus) }}
      </v-chip>
    </header>

    <div class="exercise-card__body">
      <div class="exercise-card__meta">
        <span
          v-for="metaPart in exerciseMetaParts"
          :key="metaPart"
        >
          {{ metaPart }}
        </span>
      </div>

      <p
        v-if="exerciseInstructionText()"
        class="text-body-2 text-medium-emphasis mb-0 exercise-card__instruction"
      >
        {{ exerciseInstructionText() }}
      </p>

      <section
        v-if="canAdvanceExercise()"
        class="exercise-card__advancement exercise-card__advancement--ready"
      >
        <div>
          <div class="exercise-card__advancement-title">
            Ready to advance to {{ exercise.readyToAdvanceStepName }}
          </div>
          <p class="exercise-card__advancement-copy mb-0">
            Stay on {{ exercise.currentProgressStepName || exercise.currentStepName }} as long as you like, or advance now.
          </p>
        </div>
        <v-btn
          color="success"
          :prepend-icon="mdiArrowRightCircleOutline"
          :loading="isApplyingAdvancement"
          @click="emit('advance-requested')"
        >
          Advance now
        </v-btn>
      </section>

      <section
        v-else-if="hasAdvancedPastWorkoutSnapshot()"
        class="exercise-card__advancement"
      >
        <div class="exercise-card__advancement-title">
          Current training step: {{ exercise.currentProgressStepName }}
        </div>
        <p class="exercise-card__advancement-copy mb-0">
          This workout was logged against {{ exercise.currentStepName }}. Your live progress has already moved on.
        </p>
      </section>

      <div class="exercise-card__sets">
        <template
          v-for="(setLog, index) in savedSetLogs"
          :key="String(setLog.id || '')"
        >
          <WorkoutSetLogAddEditElement
            v-if="isEditingSetLog(setLog)"
            :key="`edit:${editState.recordId}`"
            :exercise="exercise"
            mode="patch"
            :record-id="editState.recordId"
            :initial-performed-value="editState.initialPerformedValue"
            @saved="handleEditSaved"
            @cancel="closeEditEditor"
            @dirty-state-changed="editEditorDirty = $event"
          />

          <WorkoutSetLogListElement
            v-else
            :set-log="setLog"
            :display-set-number="index + 1"
            :measurement-unit="exercise.measurementUnit"
            :qualifies-for-progression="Boolean(setLog.qualifiesForProgression)"
            :can-edit="canEdit"
            :is-deleting="isDeletingSetLog(setLog)"
            @edit="openEditEditor(setLog)"
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
          :exercise="exercise"
          mode="create"
          @saved="handleCreateSaved"
          @dirty-state-changed="createEditorDirty = $event"
        />
      </div>
    </div>
  </v-sheet>
</template>

<style scoped>
.exercise-card {
  background:
    linear-gradient(135deg, rgba(var(--v-theme-primary), 0.06), transparent 18rem),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}

.exercise-card__header {
  align-items: flex-start;
  display: flex;
  gap: 0.85rem;
  justify-content: space-between;
}

.exercise-card__identity {
  align-items: flex-start;
  display: flex;
  gap: 0.85rem;
  min-width: 0;
}

.exercise-card__icon {
  flex: 0 0 auto;
}

.exercise-card__title-block {
  min-width: 0;
}

.exercise-card__family {
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.exercise-card__step {
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-size: clamp(1.2rem, 3vw, 1.55rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.12;
  margin: 0.15rem 0 0;
  overflow-wrap: anywhere;
}

.exercise-card__body,
.exercise-card__sets {
  display: grid;
  gap: 0.85rem;
}

.exercise-card__meta {
  color: rgba(var(--v-theme-on-surface), 0.62);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.9rem;
  gap: 0.35rem 0.75rem;
}

.exercise-card__instruction {
  color: rgba(var(--v-theme-on-surface), 0.68);
  line-height: 1.5;
}

.exercise-card__advancement {
  background: rgba(var(--v-theme-info), 0.08);
  border: 1px solid rgba(var(--v-theme-info), 0.22);
  border-radius: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.85rem;
}

.exercise-card__advancement--ready {
  background: rgba(var(--v-theme-success), 0.1);
  border-color: rgba(var(--v-theme-success), 0.24);
}

.exercise-card__advancement-title {
  color: rgba(var(--v-theme-on-surface), 0.92);
  font-size: 0.96rem;
  font-weight: 740;
  line-height: 1.3;
}

.exercise-card__advancement-copy {
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-top: 0.2rem;
}

@media (max-width: 640px) {
  .exercise-card {
    padding: 0.9rem;
  }

  .exercise-card__advancement {
    align-items: stretch;
    flex-direction: column;
  }

  .exercise-card__advancement :deep(.v-btn) {
    min-height: 48px;
  }
}
</style>
