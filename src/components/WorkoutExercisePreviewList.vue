<script setup>
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";

const props = defineProps({
  exercises: {
    type: Array,
    default: () => []
  },
  keyPrefix: {
    type: String,
    default: "exercise-preview"
  },
  stacked: {
    type: Boolean,
    default: false
  }
});

const {
  exerciseCurrentStepNumber,
  exerciseDetailLine,
  formatWorkSetLabel,
  progressionTargetLabel
} = useConvictWorkoutPresentation();

function exerciseKey(exercise = {}, index = 0) {
  return [
    props.keyPrefix,
    String(exercise.slotNumber || index),
    String(exercise.exerciseId || "")
  ].join("-");
}

function exerciseMetaLine(exercise = {}) {
  const parts = [
    formatWorkSetLabel(exercise.plannedWorkSetsMin, exercise.plannedWorkSetsMax)
  ];
  const stepNumber = exerciseCurrentStepNumber(exercise);
  const progressionTarget = progressionTargetLabel(exercise);

  if (stepNumber) {
    parts.push(`Step ${stepNumber}`);
  }
  if (progressionTarget) {
    parts.push(`Progression ${progressionTarget}`);
  }

  return parts.filter(Boolean).join(" / ");
}

function exerciseEyebrow(exercise = {}) {
  return String(exercise.progressionTrackName || exercise.section || "").trim();
}
</script>

<template>
  <div
    v-if="Array.isArray(exercises) && exercises.length > 0"
    class="exercise-preview-list"
    :class="{ 'exercise-preview-list--stacked': stacked }"
    role="list"
  >
    <div
      v-for="(exercise, index) in exercises"
      :key="exerciseKey(exercise, index)"
      class="exercise-preview-list__item"
      role="listitem"
    >
      <div class="exercise-preview-list__main">
        <div v-if="exerciseEyebrow(exercise)" class="exercise-preview-list__eyebrow">{{ exerciseEyebrow(exercise) }}</div>
        <div class="exercise-preview-list__title">{{ exerciseDetailLine(exercise) || exercise.exerciseName }}</div>
      </div>
      <div class="exercise-preview-list__meta">{{ exerciseMetaLine(exercise) }}</div>
    </div>
  </div>
</template>

<style scoped>
.exercise-preview-list {
  display: grid;
  gap: 0.65rem;
}

.exercise-preview-list__item {
  align-items: start;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 0.75rem 0.2rem;
}

.exercise-preview-list__item:last-child {
  border-bottom: 0;
}

.exercise-preview-list__main {
  min-width: 0;
}

.exercise-preview-list__eyebrow {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.exercise-preview-list__title {
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-size: 1.08rem;
  font-weight: 760;
  letter-spacing: -0.02em;
  line-height: 1.22;
  margin-top: 0.2rem;
  overflow-wrap: anywhere;
}

.exercise-preview-list__meta {
  color: rgba(var(--v-theme-primary), 0.92);
  font-size: 0.86rem;
  font-weight: 650;
  line-height: 1.35;
  max-width: 18rem;
  text-align: right;
}

.exercise-preview-list--stacked .exercise-preview-list__item {
  grid-template-columns: 1fr;
}

.exercise-preview-list--stacked .exercise-preview-list__meta {
  max-width: none;
  text-align: left;
}

@media (max-width: 640px) {
  .exercise-preview-list__item {
    grid-template-columns: 1fr;
    padding: 0.85rem;
  }

  .exercise-preview-list__meta {
    max-width: none;
    text-align: left;
  }
}
</style>
