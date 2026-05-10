<script setup>
import {
  mdiBookOpenPageVariantOutline,
  mdiCalendarStart,
  mdiCheckBold,
  mdiFlagCheckered
} from "@mdi/js";

const props = defineProps({
  title: {
    type: String,
    default: "Start your first program"
  },
  copy: {
    type: String,
    default: "Pick a collection, choose a program, and set the first training day."
  },
  startsOn: {
    type: String,
    default: ""
  },
  programCollections: {
    type: Array,
    default: () => []
  },
  programVersions: {
    type: Array,
    default: () => []
  },
  selectedProgramCollectionId: {
    type: [String, Number],
    default: ""
  },
  selectedProgramVersionId: {
    type: [String, Number],
    default: ""
  },
  selectedProgramVersion: {
    type: Object,
    default: null
  },
  selectedProgramVersionSummary: {
    type: String,
    default: ""
  },
  selectedProgramVersionSchedule: {
    type: Array,
    default: () => []
  },
  canStart: {
    type: Boolean,
    default: false
  },
  isStarting: {
    type: Boolean,
    default: false
  },
  startLabel: {
    type: String,
    default: "Start Program"
  },
  showCancel: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "cancel",
  "select-collection",
  "select-program",
  "start",
  "update:startsOn"
]);

function isSelectedProgramCollection(programCollectionId) {
  return String(props.selectedProgramCollectionId || "").trim() === String(programCollectionId || "").trim();
}

function isSelectedProgramVersion(programVersionId) {
  return String(props.selectedProgramVersionId || "").trim() === String(programVersionId || "").trim();
}

function isProgramVersionDisabled(programVersion = {}) {
  return Boolean(programVersion?.alreadyActive);
}

function programVersionMeta(programVersion = {}) {
  if (isProgramVersionDisabled(programVersion)) {
    return "Already active";
  }
  return programVersion.difficultyLabel || `Version ${programVersion.versionLabel}`;
}

function workSetLabel(item = {}) {
  const min = Number(item?.workSetsMin || 0);
  const max = Number(item?.workSetsMax || 0);
  return min > 0 && min === max ? `${min} working sets` : `${min}-${max} working sets`;
}

function selectProgramVersion(programVersion = {}) {
  if (isProgramVersionDisabled(programVersion)) {
    return;
  }
  emit("select-program", programVersion.id);
}
</script>

<template>
  <section class="start-program-layout">
    <v-sheet rounded="xl" border class="start-program-card">
      <header class="start-program-card__header">
        <v-avatar color="secondary" variant="tonal" rounded="lg">
          <v-icon :icon="mdiCalendarStart" />
        </v-avatar>
        <div>
          <h3 class="start-program-card__title">{{ title }}</h3>
          <p class="start-program-card__copy mb-0">
            {{ copy }}
          </p>
        </div>
      </header>

      <div class="start-program-card__controls">
        <div class="start-program-card__date">
          <label class="text-body-2 text-medium-emphasis" for="starts-on-input">Start date</label>
          <v-text-field
            id="starts-on-input"
            :model-value="startsOn"
            type="date"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            @update:model-value="emit('update:startsOn', $event)"
          />
        </div>

        <div class="start-program-card__actions">
          <v-btn
            color="primary"
            size="large"
            :prepend-icon="mdiFlagCheckered"
            :disabled="!canStart"
            :loading="isStarting"
            class="start-program-card__button"
            @click="emit('start')"
          >
            {{ startLabel }}
          </v-btn>
          <v-btn
            v-if="showCancel"
            variant="text"
            size="large"
            class="start-program-card__button"
            @click="emit('cancel')"
          >
            Cancel
          </v-btn>
        </div>
      </div>
    </v-sheet>

    <div class="program-selection-layout">
      <div class="program-picker" aria-label="Program collections">
        <button
          v-for="programCollection in programCollections"
          :key="programCollection.id"
          type="button"
          class="program-option"
          :class="{ 'program-option--selected': isSelectedProgramCollection(programCollection.id) }"
          @click="emit('select-collection', programCollection.id)"
        >
          <span class="program-option__icon" aria-hidden="true">
            <v-icon :icon="isSelectedProgramCollection(programCollection.id) ? mdiCheckBold : mdiBookOpenPageVariantOutline" />
          </span>
          <span class="program-option__body">
            <span class="program-option__name">{{ programCollection.name }}</span>
            <span class="program-option__meta">{{ programCollection.programs?.length || 0 }} programs</span>
          </span>
        </button>
      </div>

      <div class="program-picker" aria-label="Programs">
        <button
          v-for="programVersion in programVersions"
          :key="programVersion.id"
          type="button"
          class="program-option"
          :class="{
            'program-option--selected': isSelectedProgramVersion(programVersion.id),
            'program-option--disabled': isProgramVersionDisabled(programVersion)
          }"
          :disabled="isProgramVersionDisabled(programVersion)"
          @click="selectProgramVersion(programVersion)"
        >
          <span class="program-option__icon" aria-hidden="true">
            <v-icon :icon="isSelectedProgramVersion(programVersion.id) ? mdiCheckBold : mdiBookOpenPageVariantOutline" />
          </span>
          <span class="program-option__body">
            <span class="program-option__name">{{ programVersion.name }}</span>
            <span class="program-option__meta">{{ programVersionMeta(programVersion) }}</span>
          </span>
        </button>
      </div>

      <v-sheet rounded="xl" border class="program-detail-panel">
        <template v-if="selectedProgramVersion">
          <header class="program-detail-panel__header">
            <div>
              <p class="program-detail-panel__eyebrow mb-0">Selected program</p>
              <h3 class="program-detail-panel__title">{{ selectedProgramVersion.name }}</h3>
            </div>
            <v-chip color="primary" variant="tonal" label>
              {{ selectedProgramVersion.difficultyLabel || `Version ${selectedProgramVersion.versionLabel}` }}
            </v-chip>
          </header>

          <p v-if="selectedProgramVersionSummary" class="program-detail-panel__summary mb-0">
            {{ selectedProgramVersionSummary }}
          </p>

          <div class="program-detail-panel__schedule">
            <article
              v-for="day in selectedProgramVersionSchedule"
              :key="`program-version-${selectedProgramVersion.id}-${day.dayOfWeek}`"
              class="program-detail-day"
              :class="{ 'program-detail-day--rest': day.isRestDay }"
            >
              <div class="program-detail-day__title">{{ day.dayLabel }}</div>
              <p v-if="day.isRestDay" class="program-detail-day__rest mb-0">Rest</p>
              <div v-else class="program-detail-day__items">
                <div
                  v-for="item in day.items"
                  :key="`program-version-${selectedProgramVersion.id}-${day.dayOfWeek}-${item.slotNumber}`"
                  class="program-detail-day__item"
                >
                  <span>{{ item.exerciseName }}</span>
                  <span>{{ workSetLabel(item) }}</span>
                </div>
              </div>
            </article>
          </div>
        </template>

        <div v-else class="program-detail-panel__empty">
          Choose a collection and a program to see its weekly rhythm.
        </div>
      </v-sheet>
    </div>
  </section>
</template>

<style scoped>
.start-program-layout {
  display: grid;
  gap: 1rem;
}

.start-program-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-secondary), 0.08), transparent),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.start-program-card__header {
  align-items: center;
  display: flex;
  gap: 0.9rem;
}

.start-program-card__title {
  font-size: clamp(1.35rem, 3vw, 1.9rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.08;
  margin: 0;
}

.start-program-card__copy,
.program-detail-panel__summary,
.program-detail-day__rest {
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.start-program-card__controls {
  align-items: end;
  display: grid;
  gap: 0.9rem;
  grid-template-columns: minmax(12rem, 1fr) auto;
}

.start-program-card__date {
  display: grid;
  gap: 0.35rem;
}

.start-program-card__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.start-program-card__button {
  min-height: 48px;
}

.program-selection-layout {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(12rem, 16rem) minmax(13rem, 18rem) minmax(0, 1fr);
}

.program-picker {
  display: grid;
  gap: 0.5rem;
}

.program-option {
  appearance: none;
  align-items: center;
  background: rgba(var(--v-theme-surface), 0.68);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 1rem;
  color: inherit;
  cursor: pointer;
  display: flex;
  gap: 0.75rem;
  min-height: 64px;
  padding: 0.75rem;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.program-option:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-1px);
}

.program-option--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.14);
}

.program-option--disabled {
  cursor: not-allowed;
  opacity: 0.58;
  transform: none;
}

.program-option--disabled:hover {
  border-color: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  transform: none;
}

.program-option__icon {
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 0.75rem;
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  flex: 0 0 auto;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;
}

.program-option__body {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.program-option__name {
  font-size: 1rem;
  font-weight: 740;
  line-height: 1.2;
}

.program-option__meta,
.program-detail-panel__eyebrow,
.program-detail-day__item span:last-child {
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.program-option__meta {
  font-size: 0.86rem;
}

.program-detail-panel {
  background:
    radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.08), transparent 20rem),
    rgb(var(--v-theme-surface));
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.program-detail-panel__header {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.program-detail-panel__eyebrow {
  font-size: 0.76rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.program-detail-panel__title {
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 780;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin: 0.15rem 0 0;
}

.program-detail-panel__summary {
  line-height: 1.5;
  max-width: 54rem;
}

.program-detail-panel__schedule {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
}

.program-detail-day {
  background: rgba(var(--v-theme-surface-variant), 0.16);
  border-radius: 1rem;
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem;
}

.program-detail-day--rest {
  background: rgba(var(--v-theme-surface-variant), 0.08);
}

.program-detail-day__title {
  font-weight: 740;
  line-height: 1.2;
}

.program-detail-day__items {
  display: grid;
  gap: 0.45rem;
}

.program-detail-day__item {
  display: grid;
  gap: 0.15rem;
}

.program-detail-day__item span:first-child {
  font-weight: 680;
  line-height: 1.25;
}

.program-detail-day__item span:last-child {
  font-size: 0.88rem;
}

.program-detail-panel__empty {
  color: rgba(var(--v-theme-on-surface), 0.62);
  padding: 1rem;
  text-align: center;
}

@media (max-width: 640px) {
  .start-program-card,
  .program-detail-panel {
    padding: 0.85rem;
  }

  .start-program-card__header,
  .start-program-card__controls,
  .program-detail-panel__header {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .start-program-card__header,
  .program-detail-panel__header {
    flex-direction: column;
  }

  .start-program-card__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .start-program-card__actions :deep(.v-btn) {
    width: 100%;
  }

  .program-selection-layout {
    grid-template-columns: 1fr;
  }

  .program-detail-panel__schedule {
    grid-template-columns: 1fr;
  }
}
</style>
