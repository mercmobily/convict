import { createSchema } from "json-rest-schema";
import { composeSchemaDefinitions } from "@jskit-ai/kernel/shared/validators";
import { deepFreeze } from "@jskit-ai/kernel/shared/support/deepFreeze";

const scheduledForDateSchema = {
  type: "string",
  required: true,
  minLength: 10,
  maxLength: 10,
  pattern: "^\\d{4}-\\d{2}-\\d{2}$"
};

const scheduledForDateRouteParamsValidator = deepFreeze({
  schema: createSchema({
    scheduledForDate: scheduledForDateSchema
  }),
  mode: "patch"
});

const assignmentQueryRouteValidator = deepFreeze({
  schema: createSchema({
    userProgramAssignmentId: {
      type: "id",
      required: false
    }
  }),
  mode: "patch"
});

const historyProjectionQueryRouteValidator = deepFreeze({
  schema: createSchema({
    month: {
      type: "string",
      required: false,
      minLength: 7,
      maxLength: 7,
      pattern: "^\\d{4}-\\d{2}$"
    }
  }),
  mode: "patch"
});

const todayProjectionQueryInputValidator = deepFreeze({
  schema: createSchema({}),
  mode: "patch"
});

const historyProjectionQueryInputValidator = composeSchemaDefinitions([
  historyProjectionQueryRouteValidator
]);

const startWorkoutBodyInputValidator = deepFreeze({
  schema: createSchema({
    scheduledForDate: scheduledForDateSchema,
    userProgramAssignmentId: {
      type: "id",
      required: false
    }
  }),
  mode: "patch"
});

const markWorkoutDefinitelyMissedBodyInputValidator = deepFreeze({
  schema: createSchema({
    scheduledForDate: scheduledForDateSchema,
    userProgramAssignmentId: {
      type: "id",
      required: false
    }
  }),
  mode: "patch"
});

const applyAdvancementBodyInputValidator = deepFreeze({
  schema: createSchema({
    progressionTrackId: {
      type: "id",
      required: true
    }
  }),
  mode: "patch"
});

const startWorkoutCommandInputValidator = composeSchemaDefinitions([
  startWorkoutBodyInputValidator
]);

const markWorkoutDefinitelyMissedCommandInputValidator = composeSchemaDefinitions([
  markWorkoutDefinitelyMissedBodyInputValidator
]);

const workoutDetailQueryInputValidator = composeSchemaDefinitions([
  scheduledForDateRouteParamsValidator,
  assignmentQueryRouteValidator
]);

const submitWorkoutCommandInputValidator = composeSchemaDefinitions([
  scheduledForDateRouteParamsValidator,
  assignmentQueryRouteValidator
]);

const applyAdvancementCommandInputValidator = composeSchemaDefinitions([
  applyAdvancementBodyInputValidator
]);

export {
  todayProjectionQueryInputValidator,
  historyProjectionQueryRouteValidator,
  assignmentQueryRouteValidator,
  historyProjectionQueryInputValidator,
  workoutDetailQueryInputValidator,
  startWorkoutBodyInputValidator,
  markWorkoutDefinitelyMissedBodyInputValidator,
  applyAdvancementBodyInputValidator,
  startWorkoutCommandInputValidator,
  markWorkoutDefinitelyMissedCommandInputValidator,
  submitWorkoutCommandInputValidator,
  applyAdvancementCommandInputValidator
};
