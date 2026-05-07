import {
  todayProjectionQueryInputValidator,
  historyProjectionQueryInputValidator,
  workoutDetailQueryInputValidator,
  startWorkoutCommandInputValidator,
  markWorkoutDefinitelyMissedCommandInputValidator,
  submitWorkoutCommandInputValidator,
  applyAdvancementCommandInputValidator
} from "./inputSchemas.js";

const READ_TODAY_PROJECTION = "feature.today.projection.read";
const READ_HISTORY_PROJECTION = "feature.today.history.read";
const READ_WORKOUT_DETAIL = "feature.today.workout.read";
const START_WORKOUT_OCCURRENCE = "feature.today.workout.start";
const SUBMIT_WORKOUT_OCCURRENCE = "feature.today.workout.submit";
const APPLY_EXERCISE_ADVANCEMENT = "feature.today.progress.advance";
const MARK_WORKOUT_DEFINITELY_MISSED = "feature.today.workout.definitely-missed";

const featureActions = Object.freeze([
  {
    id: READ_TODAY_PROJECTION,
    version: 1,
    kind: "query",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: todayProjectionQueryInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: READ_TODAY_PROJECTION
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.readToday(input, {
        context
      });
    }
  },
  {
    id: READ_HISTORY_PROJECTION,
    version: 1,
    kind: "query",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: historyProjectionQueryInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: READ_HISTORY_PROJECTION
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.readHistory(input, {
        context
      });
    }
  },
  {
    id: READ_WORKOUT_DETAIL,
    version: 1,
    kind: "query",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: workoutDetailQueryInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: READ_WORKOUT_DETAIL
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.readWorkoutDetail(input, {
        context
      });
    }
  },
  {
    id: START_WORKOUT_OCCURRENCE,
    version: 1,
    kind: "command",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: startWorkoutCommandInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: START_WORKOUT_OCCURRENCE
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.startWorkout(input, {
        context
      });
    }
  },
  {
    id: SUBMIT_WORKOUT_OCCURRENCE,
    version: 1,
    kind: "command",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: submitWorkoutCommandInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: SUBMIT_WORKOUT_OCCURRENCE
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.submitWorkout(input, {
        context
      });
    }
  },
  {
    id: APPLY_EXERCISE_ADVANCEMENT,
    version: 1,
    kind: "command",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: applyAdvancementCommandInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: APPLY_EXERCISE_ADVANCEMENT
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.applyAdvancement(input, {
        context
      });
    }
  },
  {
    id: MARK_WORKOUT_DEFINITELY_MISSED,
    version: 1,
    kind: "command",
    channels: ["api", "automation", "internal"],
    surfaces: ["app"],
    input: markWorkoutDefinitelyMissedCommandInputValidator,
    output: null,
    idempotency: "optional",
    audit: {
      actionName: MARK_WORKOUT_DEFINITELY_MISSED
    },
    observability: {},
    async execute(input, context, deps) {
      return deps.todayService.markWorkoutDefinitelyMissed(input, {
        context
      });
    }
  }
]);

export {
  READ_TODAY_PROJECTION,
  READ_HISTORY_PROJECTION,
  READ_WORKOUT_DETAIL,
  START_WORKOUT_OCCURRENCE,
  SUBMIT_WORKOUT_OCCURRENCE,
  APPLY_EXERCISE_ADVANCEMENT,
  MARK_WORKOUT_DEFINITELY_MISSED,
  featureActions
};
