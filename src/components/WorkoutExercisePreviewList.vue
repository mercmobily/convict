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
</script>

<template>
  <v-list
    v-if="Array.isArray(exercises) && exercises.length > 0"
    lines="two"
    density="comfortable"
  >
    <v-list-item
      v-for="(exercise, index) in exercises"
      :key="exerciseKey(exercise, index)"
      :subtitle="exerciseDetailLine(exercise)"
    >
      <v-list-item-title>{{ exercise.exerciseName }}</v-list-item-title>
      <template #append>
        <div class="d-flex flex-wrap ga-2 justify-end">
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
          <v-chip
            v-if="progressionTargetLabel(exercise)"
            color="success"
            variant="tonal"
            size="small"
            label
          >
            Progression {{ progressionTargetLabel(exercise) }}
          </v-chip>
          <v-chip color="secondary" variant="tonal" size="small" label>
            {{ measurementLabel(exercise.measurementUnit) }}
          </v-chip>
        </div>
      </template>
    </v-list-item>
  </v-list>
</template>
