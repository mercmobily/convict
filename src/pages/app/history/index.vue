<route lang="json">
{
  "meta": {
    "jskit": {
      "surface": "app"
    }
  }
}
</route>

<script setup>
import { computed, ref, watch } from "vue";
import {
  mdiCalendarMonthOutline,
  mdiCheckCircleOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiClockAlertOutline,
  mdiCloseCircleOutline,
  mdiPlayCircleOutline
} from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import HistoryDayDetailCard from "@/components/HistoryDayDetailCard.vue";
import { useConvictWorkoutPresentation } from "@/composables/useConvictWorkoutPresentation";
import {
  ISO_DAY_LABELS,
  normalizeDateOnly,
  normalizeMonthKey,
  parseDateOnly,
  shiftMonthKey
} from "@local/main/shared";
import { usePaths } from "@jskit-ai/users-web/client/composables/usePaths";
import { useEndpointResource } from "@jskit-ai/users-web/client/composables/useEndpointResource";

const { workoutStatusColor } = useConvictWorkoutPresentation();
const route = useRoute();
const router = useRouter();
const paths = usePaths();
const { smAndDown } = useDisplay();

const requestedMonth = computed(() => {
  const rawValue = Array.isArray(route.query.month)
    ? route.query.month[0]
    : route.query.month;
  return String(rawValue || "").trim();
});
const historyApiPath = computed(() => paths.api("/today/history"));

const historyResource = useEndpointResource({
  queryKey: computed(() => ["today-history", historyApiPath.value, requestedMonth.value || "server-default"]),
  path: historyApiPath,
  refreshOnPull: true,
  readQuery: computed(() => (
    requestedMonth.value
      ? {
          month: requestedMonth.value
        }
      : null
  )),
  fallbackLoadError: "Unable to load history."
});

const historyState = computed(() => {
  const payload = historyResource.data.value;
  return payload && typeof payload === "object" ? payload : {};
});
const assignment = computed(() => historyState.value.assignment || null);
const range = computed(() => historyState.value.range || {});
const summary = computed(() => historyState.value.summary || {});
const days = computed(() => (Array.isArray(historyState.value.days) ? historyState.value.days : []));
const currentMonthDays = computed(() => days.value.filter((day) => day.isCurrentMonth === true));
const loadError = computed(() => String(historyResource.loadError.value || "").trim());
const isInitialLoading = computed(() => Boolean(historyResource.isInitialLoading.value));
const isRefreshing = computed(() => Boolean(historyResource.isRefetching.value));
const hasActiveAssignment = computed(() => Boolean(assignment.value?.id));
const activeMonth = computed(() => (
  String(historyState.value.month || normalizeMonthKey(requestedMonth.value) || "").trim()
));
const mobileDaySheetOpen = ref(false);

const weekdayHeaders = computed(() => (
  [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
    key: dayOfWeek,
    label: ISO_DAY_LABELS[dayOfWeek] || "",
    compactLabel: String(ISO_DAY_LABELS[dayOfWeek] || "").slice(0, 3)
  }))
));

const monthTitle = computed(() => {
  const monthStart = String(range.value.monthStart || "").trim();
  const parsedDate = parseDateOnly(monthStart);
  if (!parsedDate) {
    return "History";
  }

  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric"
  }).format(parsedDate);
});

const summaryCards = computed(() => ([
  {
    key: "completed",
    label: "Completed",
    mobileLabel: "Done",
    value: Number(summary.value.completedDays || 0),
    icon: mdiCheckCircleOutline,
    color: "success"
  },
  {
    key: "in-progress",
    label: "In progress",
    mobileLabel: "Open",
    value: Number(summary.value.inProgressDays || 0),
    icon: mdiPlayCircleOutline,
    color: "info"
  },
  {
    key: "overdue",
    label: "Overdue",
    mobileLabel: "Overdue",
    value: Number(summary.value.overdueDays || 0),
    icon: mdiClockAlertOutline,
    color: "warning"
  },
  {
    key: "missed",
    label: "Definitely missed",
    mobileLabel: "Missed",
    value: Number(summary.value.definitelyMissedDays || 0),
    icon: mdiCloseCircleOutline,
    color: "error"
  }
]));

const selectedDate = computed(() => {
  const requestedDay = normalizeDateOnly(route.query.day);
  if (requestedDay && days.value.some((day) => day.scheduledForDate === requestedDay)) {
    return requestedDay;
  }

  const todayEntry = currentMonthDays.value.find((day) => day.isToday === true) || null;
  if (todayEntry?.scheduledForDate) {
    return todayEntry.scheduledForDate;
  }

  return currentMonthDays.value[0]?.scheduledForDate || days.value[0]?.scheduledForDate || "";
});

const selectedDay = computed(() => (
  days.value.find((day) => day.scheduledForDate === selectedDate.value) || null
));

const workoutDetailPagePath = computed(() => {
  if (!selectedDay.value?.canOpenWorkoutDetail) {
    return "";
  }

  return paths.page(`/workouts/${selectedDay.value.scheduledForDate}`);
});

const selectedDayDescription = computed(() => {
  if (!selectedDay.value) {
    return "Select a day to review its projected workout and workout history.";
  }

  if (selectedDay.value.status === "not_started_yet") {
    const startsOn = String(selectedDay.value.assignmentStartsOn || assignment.value?.startsOn || "").trim();
    return startsOn
      ? `Your current program starts on ${startsOn}.`
      : "This day falls before your current program starts.";
  }

  if (selectedDay.value.status === "rest_day") {
    return "No workout is scheduled on this day.";
  }

  if (selectedDay.value.performedOnDate && selectedDay.value.performedOnDate !== selectedDay.value.scheduledForDate) {
    return `Scheduled for ${selectedDay.value.scheduledForDate} and performed on ${selectedDay.value.performedOnDate}.`;
  }

  if (selectedDay.value.status === "scheduled" && selectedDay.value.isFuture) {
    return "This workout is planned for a future day. You can review it here before it becomes available.";
  }

  return "This is the projected or recorded workout state for the selected day.";
});

watch(
  [() => route.query.day, smAndDown],
  ([dayQuery, mobile]) => {
    mobileDaySheetOpen.value = Boolean(mobile && normalizeDateOnly(dayQuery));
  },
  {
    immediate: true
  }
);

function historyDayKey(day = {}) {
  return String(day.scheduledForDate || "").trim();
}

function historyDayNumber(day = {}) {
  const scheduledForDate = String(day.scheduledForDate || "").trim();
  return scheduledForDate ? scheduledForDate.slice(-2) : "";
}

function historyDayStatusLabel(day = {}) {
  const status = String(day.status || "").trim().toLowerCase();

  switch (status) {
    case "completed":
      return "Done";
    case "in_progress":
      return "Open";
    case "overdue":
      return "Overdue";
    case "scheduled":
      return day.isToday ? "Today" : "Planned";
    case "rest_day":
      return "Rest";
    case "definitely_missed":
      return "Missed";
    case "not_started_yet":
      return "";
    default:
      return "";
  }
}

function historyDayToneClass(day = {}) {
  const tone = String(workoutStatusColor(day.status) || "default").trim().toLowerCase();
  return `history-day--tone-${tone}`;
}

function historyDayCountLabel(day = {}) {
  const status = String(day.status || "").trim().toLowerCase();
  const exerciseCount = Array.isArray(day.exercises) ? day.exercises.length : 0;
  if (exerciseCount < 1) {
    if (status === "not_started_yet") {
      return "";
    }

    return day.isRestDay ? "Rest day" : "No exercises";
  }

  return exerciseCount === 1 ? "1 exercise" : `${exerciseCount} exercises`;
}

function buildRouteQuery({ month = null, day = null } = {}) {
  const nextQuery = {
    ...route.query
  };

  if (month) {
    nextQuery.month = month;
  } else {
    delete nextQuery.month;
  }

  if (day) {
    nextQuery.day = day;
  } else {
    delete nextQuery.day;
  }

  return nextQuery;
}

async function moveMonth(monthOffset) {
  const nextMonth = shiftMonthKey(activeMonth.value, monthOffset);
  if (!nextMonth) {
    return;
  }

  mobileDaySheetOpen.value = false;

  await router.replace({
    query: buildRouteQuery({
      month: nextMonth,
      day: null
    })
  });
}

async function selectDay(day = {}) {
  const scheduledForDate = String(day.scheduledForDate || "").trim();
  if (!scheduledForDate) {
    return;
  }

  await router.replace({
    query: buildRouteQuery({
      month: activeMonth.value,
      day: scheduledForDate
    })
  });

  if (smAndDown.value) {
    mobileDaySheetOpen.value = true;
  }
}
</script>

<template>
  <section
    class="history-page d-flex flex-column ga-6"
  >
    <div class="d-flex flex-wrap align-center justify-space-between ga-3">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">History</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Review scheduled training days, completed workouts, overdue work, and future projections month by month.
        </p>
      </div>

      <v-progress-circular
        v-if="isRefreshing"
        indeterminate
        color="primary"
        size="22"
        width="2"
      />
    </div>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
    >
      {{ loadError }}
    </v-alert>

    <template v-if="isInitialLoading">
      <div class="d-flex align-center justify-space-between ga-3">
        <v-skeleton-loader type="chip" />
        <v-skeleton-loader type="button" />
      </div>
      <v-skeleton-loader type="article" />
      <v-skeleton-loader type="article" />
    </template>

    <template v-else>
      <v-alert
        v-if="!hasActiveAssignment"
        type="info"
        variant="tonal"
      >
        Choose a program before using history. The calendar projection appears after you have an active assignment.
      </v-alert>

      <template v-else>
        <div class="d-flex flex-wrap align-center justify-space-between ga-3">
          <div class="d-flex align-center ga-3">
            <v-avatar
              color="primary"
              variant="tonal"
              size="42"
            >
              <v-icon :icon="mdiCalendarMonthOutline" />
            </v-avatar>
            <div>
              <div class="text-overline text-medium-emphasis">Calendar month</div>
              <div class="text-h6 font-weight-bold">{{ monthTitle }}</div>
            </div>
          </div>

          <div class="history-month-nav" aria-label="Calendar month navigation">
            <v-btn
              icon
              color="primary"
              variant="text"
              aria-label="Previous calendar month"
              @click="moveMonth(-1)"
            >
              <v-icon :icon="mdiChevronLeft" />
            </v-btn>
            <v-btn
              icon
              color="primary"
              variant="text"
              aria-label="Next calendar month"
              @click="moveMonth(1)"
            >
              <v-icon :icon="mdiChevronRight" />
            </v-btn>
          </div>
        </div>

        <div class="history-page__summary-chip-row">
          <v-chip
            v-for="summaryCard in summaryCards"
            :key="summaryCard.key"
            :color="summaryCard.color"
            size="small"
            variant="tonal"
            :prepend-icon="summaryCard.icon"
          >
            {{ summaryCard.mobileLabel }} {{ summaryCard.value }}
          </v-chip>
        </div>

        <div class="history-page__content-grid">
          <v-card
            rounded="xl"
            variant="outlined"
          >
            <v-card-text class="pa-3 pa-sm-4">
              <div class="history-page__calendar-shell">
                <div class="history-page__weekday-row mb-3">
                  <div
                    v-for="header in weekdayHeaders"
                    :key="header.key"
                    class="text-caption font-weight-medium text-medium-emphasis text-center"
                  >
                    {{ smAndDown ? header.compactLabel : header.label }}
                  </div>
                </div>

                <div class="history-page__calendar-grid">
                  <button
                    v-for="day in days"
                    :key="historyDayKey(day)"
                    type="button"
                    class="history-day"
                    :class="[
                      historyDayToneClass(day),
                      {
                        'history-day--selected': selectedDate === day.scheduledForDate,
                        'history-day--outside-month': day.isCurrentMonth !== true,
                        'history-day--today': day.isToday === true
                      }
                    ]"
                    :data-testid="`history-day-${day.scheduledForDate}`"
                    @click="selectDay(day)"
                  >
                    <div class="history-day__top">
                      <span class="history-day__number">{{ historyDayNumber(day) }}</span>
                      <span class="history-day__dot" />
                    </div>

                    <div
                      v-if="historyDayStatusLabel(day)"
                      class="history-day__status"
                    >
                      {{ historyDayStatusLabel(day) }}
                    </div>

                    <div
                      v-if="historyDayCountLabel(day)"
                      class="history-day__count"
                    >
                      {{ historyDayCountLabel(day) }}
                    </div>

                    <div
                      v-if="day.performedOnDate && day.performedOnDate !== day.scheduledForDate"
                      class="history-day__performed"
                    >
                      Done {{ day.performedOnDate.slice(-5) }}
                    </div>
                  </button>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <HistoryDayDetailCard
            v-if="!smAndDown"
            :day="selectedDay"
            :description="selectedDayDescription"
            :workout-detail-page-path="workoutDetailPagePath"
          />
        </div>

        <v-bottom-sheet
          v-if="smAndDown"
          v-model="mobileDaySheetOpen"
          scrollable
        >
          <div class="history-page__mobile-sheet">
            <HistoryDayDetailCard
              :day="selectedDay"
              :description="selectedDayDescription"
              :workout-detail-page-path="workoutDetailPagePath"
            />
          </div>
        </v-bottom-sheet>
      </template>
    </template>
  </section>
</template>

<style scoped>
.history-page__summary-chip-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.history-page__summary-chip-row::-webkit-scrollbar {
  display: none;
}

.history-month-nav {
  align-items: center;
  background: rgba(var(--v-theme-surface-variant), 0.28);
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.72));
  border-radius: 999px;
  display: inline-flex;
  gap: 4px;
  padding: 4px;
}

.history-month-nav :deep(.v-btn) {
  min-height: 48px;
  min-width: 48px;
}

.history-page__content-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
}

.history-page__weekday-row,
.history-page__calendar-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.history-page__calendar-shell {
  overflow-x: auto;
}

.history-page__weekday-row,
.history-page__calendar-grid {
  min-width: 780px;
}

.history-day {
  appearance: none;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, rgb(var(--v-theme-primary)) 6%);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 116px;
  padding: 12px;
  text-align: left;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.history-day:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  transform: translateY(-1px);
}

.history-day--selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.16);
}

.history-day__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.history-day__number {
  font-size: 1rem;
  font-weight: 700;
}

.history-day__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.32);
  box-shadow: 0 0 0 4px rgba(var(--v-theme-on-surface), 0.08);
  flex: 0 0 auto;
}

.history-day__status {
  color: rgba(var(--v-theme-on-surface), 0.86);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
  min-height: 1.8em;
}

.history-day__count,
.history-day__performed {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.74rem;
  line-height: 1.2;
}

.history-day__count {
  margin-top: auto;
}

.history-day--outside-month {
  opacity: 0.58;
}

.history-day--today {
  box-shadow: 0 0 0 1px rgba(var(--v-theme-info), 0.25);
}

.history-day--tone-primary .history-day__dot {
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.14);
}

.history-day--tone-warning .history-day__dot {
  background: rgb(var(--v-theme-warning));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-warning), 0.14);
}

.history-day--tone-info .history-day__dot {
  background: rgb(var(--v-theme-info));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-info), 0.14);
}

.history-day--tone-success .history-day__dot {
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-success), 0.14);
}

.history-day--tone-error .history-day__dot {
  background: rgb(var(--v-theme-error));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-error), 0.14);
}

.history-day--tone-secondary .history-day__dot {
  background: rgb(var(--v-theme-secondary));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-secondary), 0.14);
}

.history-page__mobile-sheet {
  background: rgb(var(--v-theme-surface));
  border-radius: 28px 28px 0 0;
  max-height: 84vh;
  overflow: auto;
  padding: 12px 12px 20px;
}

@media (max-width: 960px) {
  .history-page__content-grid {
    grid-template-columns: 1fr;
  }

  .history-page__weekday-row,
  .history-page__calendar-grid {
    gap: 8px;
  }

  .history-day {
    min-height: 100px;
    padding: 10px;
  }

  .history-day__status {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .history-page__calendar-shell {
    overflow-x: visible;
  }

  .history-page__weekday-row,
  .history-page__calendar-grid {
    min-width: 0;
    gap: 4px;
  }

  .history-day {
    min-height: 72px;
    padding: 8px 6px;
    border-radius: 14px;
    gap: 4px;
  }

  .history-day__number {
    font-size: 0.92rem;
  }

  .history-day__dot {
    width: 8px;
    height: 8px;
    box-shadow: 0 0 0 3px rgba(var(--v-theme-on-surface), 0.08);
  }

  .history-day__status,
  .history-day__count,
  .history-day__performed {
    display: none;
  }
}
</style>
