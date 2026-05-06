import { createSchema } from "json-rest-schema";
import { composeSchemaDefinitions } from "@jskit-ai/kernel/shared/validators";
import { deepFreeze } from "@jskit-ai/kernel/shared/support/deepFreeze";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";

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

const todayProjectionQueryInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator
]);

const startWorkoutBodyInputValidator = deepFreeze({
  schema: createSchema({
    scheduledForDate: scheduledForDateSchema
  }),
  mode: "patch"
});

const markWorkoutDefinitelyMissedBodyInputValidator = deepFreeze({
  schema: createSchema({
    scheduledForDate: scheduledForDateSchema
  }),
  mode: "patch"
});

const applyAdvancementBodyInputValidator = deepFreeze({
  schema: createSchema({
    exerciseId: {
      type: "id",
      required: true
    }
  }),
  mode: "patch"
});

const saveWorkoutSetLogsBodyInputValidator = deepFreeze({
  schema: createSchema({
    occurrenceExerciseId: {
      type: "id",
      required: true
    },
    sets: {
      type: "array",
      required: true,
      items: {
        type: "object",
        properties: {
          setNumber: {
            type: "integer",
            required: true,
            minimum: 1
          },
          side: {
            type: "string",
            required: false,
            enum: ["both", "left", "right"]
          },
          performedValue: {
            type: "number",
            required: false,
            minimum: 0
          }
        }
      }
    }
  }),
  mode: "patch"
});

const startWorkoutCommandInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  startWorkoutBodyInputValidator
]);

const markWorkoutDefinitelyMissedCommandInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  markWorkoutDefinitelyMissedBodyInputValidator
]);

const workoutDetailQueryInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  scheduledForDateRouteParamsValidator
]);

const submitWorkoutCommandInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  scheduledForDateRouteParamsValidator
]);

const saveWorkoutSetLogsCommandInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  scheduledForDateRouteParamsValidator,
  saveWorkoutSetLogsBodyInputValidator
]);

const applyAdvancementCommandInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  applyAdvancementBodyInputValidator
]);

export {
  todayProjectionQueryInputValidator,
  workoutDetailQueryInputValidator,
  startWorkoutBodyInputValidator,
  markWorkoutDefinitelyMissedBodyInputValidator,
  applyAdvancementBodyInputValidator,
  saveWorkoutSetLogsBodyInputValidator,
  startWorkoutCommandInputValidator,
  markWorkoutDefinitelyMissedCommandInputValidator,
  submitWorkoutCommandInputValidator,
  saveWorkoutSetLogsCommandInputValidator,
  applyAdvancementCommandInputValidator
};
