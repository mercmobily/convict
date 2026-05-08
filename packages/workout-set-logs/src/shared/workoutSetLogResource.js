import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "workout_set_logs",
  tableName: "workout_set_logs",
  schema: {
  workoutOccurrenceExerciseId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "workout-occurrence-exercises", valueKey: "id" },
    belongsTo: "workoutOccurrenceExercises",
    as: "workoutOccurrenceExercise",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
  side: {
    type: "string",
    maxLength: 16,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  measurementUnitSnapshot: {
    type: "string",
    maxLength: 16,
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  performedValue: {
    type: "integer",
    min: 0,
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  qualifiesForProgression: {
    type: "boolean",
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  loggedAt: {
    type: "dateTime",
    default: "now()",
    search: true,
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  createdAt: {
    type: "dateTime",
    default: "now()",
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true }
    }
  },
  updatedAt: {
    type: "dateTime",
    default: "now()",
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true }
    }
  },
  },
  searchSchema: {
    id: { type: "id", actualField: "id" },
    workoutOccurrenceExerciseIds: { type: "array", actualField: "workoutOccurrenceExerciseId", filterOperator: "in" },
    q: { type: "string", oneOf: ["side","measurementUnitSnapshot"], filterOperator: "like", splitBy: " ", matchAll: true },
  },
  defaultSort: ["loggedAt", "id"],
  autofilter: "user",
  messages: {
    validation: "Fix invalid values and try again.",
    saveSuccess: "Record saved.",
    saveError: "Unable to save record.",
    deleteSuccess: "Record deleted.",
    deleteError: "Unable to delete record."
  },
  contract: {
    lookup: {
      containerKey: "lookups",
      defaultInclude: "*",
      maxDepth: 3
    }
  }
});

export { resource };
