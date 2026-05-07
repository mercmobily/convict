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
  measurementLabel,
  progressionTargetLabel
} = useConvictWorkoutPresentation();

function exerciseKey(exercise = {}, index = 0) {
  return [
    props.keyPrefix,
    String(exercise.slotNumber || index),
    String(exercise.exerciseId || "")
  ].join("-");
}

function exerciseMetaChips(exercise = {}) {
  const chips = [
    {
      key: "work-sets",
      color: "primary",
      label: formatWorkSetLabel(exercise.plannedWorkSetsMin, exercise.plannedWorkSetsMax)
    }
  ];

  if (exerciseCurrentStepNumber(exercise)) {
    chips.push({
      key: "step",
      color: "info",
      label: `Step ${exerciseCurrentStepNumber(exercise)}`
    });
  }

  if (progressionTargetLabel(exercise)) {
    chips.push({
      key: "progression",
      color: "success",
      label: `Progression ${progressionTargetLabel(exercise)}`
    });
  }

  chips.push({
    key: "measurement",
    color: "secondary",
    label: measurementLabel(exercise.measurementUnit)
  });

  return chips;
}
</script>

<template>
  <v-list
    v-if="Array.isArray(exercises) && exercises.length > 0"
    lines="two"
    density="comfortable"
  >
    <template v-if="stacked">
      <v-list-item
        v-for="(exercise, index) in exercises"
        :key="exerciseKey(exercise, index)"
        class="exercise-preview-list__item exercise-preview-list__item--stacked"
      >
        <v-list-item-title class="exercise-preview-list__title">
          {{ exercise.exerciseName }}
        </v-list-item-title>
        <v-list-item-subtitle class="exercise-preview-list__subtitle">
          {{ exerciseDetailLine(exercise) }}
        </v-list-item-subtitle>
        <div class="exercise-preview-list__chips exercise-preview-list__chips--stacked">
          <v-chip
            v-for="chip in exerciseMetaChips(exercise)"
            :key="chip.key"
            :color="chip.color"
            variant="tonal"
            size="small"
            label
          >
            {{ chip.label }}
          </v-chip>
        </div>
      </v-list-item>
    </template>

    <template v-else>
      <v-list-item
        v-for="(exercise, index) in exercises"
        :key="exerciseKey(exercise, index)"
        class="exercise-preview-list__item"
      >
        <v-list-item-title>{{ exercise.exerciseName }}</v-list-item-title>
        <v-list-item-subtitle>{{ exerciseDetailLine(exercise) }}</v-list-item-subtitle>
        <template #append>
          <div class="exercise-preview-list__chips exercise-preview-list__chips--inline">
            <v-chip
              v-for="chip in exerciseMetaChips(exercise)"
              :key="chip.key"
              :color="chip.color"
              variant="tonal"
              size="small"
              label
            >
              {{ chip.label }}
            </v-chip>
          </div>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<style scoped>
.exercise-preview-list__title,
.exercise-preview-list__subtitle {
  white-space: normal;
}

.exercise-preview-list__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.exercise-preview-list__chips--inline {
  justify-content: flex-end;
}

.exercise-preview-list__chips--stacked {
  justify-content: flex-start;
  margin-top: 10px;
}
</style>
