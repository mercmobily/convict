import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "user_exercise_progress",
  tableName: "user_exercise_progress",
  schema: {
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
  exerciseId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "exercises", valueKey: "id" },
    belongsTo: "exercises",
    as: "exercise",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  currentStepId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "exercise-steps", valueKey: "id" },
    belongsTo: "exerciseSteps",
    as: "currentStep",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  readyToAdvanceStepId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "exercise-steps", valueKey: "id" },
    belongsTo: "exerciseSteps",
    as: "readyToAdvanceStep",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  activeVariationId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "personal-step-variations", valueKey: "id" },
    belongsTo: "personalStepVariations",
    as: "activeVariation",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  readyToAdvanceAt: {
    type: "dateTime",
    nullable: true,
    search: true,
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  lastCompletedOccurrenceId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "workout-occurrences", valueKey: "id" },
    belongsTo: "workoutOccurrences",
    as: "lastCompletedOccurrence",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  lastCompletedAt: {
    type: "dateTime",
    nullable: true,
    search: true,
    storage: { writeSerializer: "datetime-utc" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  stallCount: {
    type: "integer",
    min: 0,
    search: true,
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
    exerciseIds: { type: "array", actualField: "exercise_id", filterOperator: "in" },
  },
  defaultSort: ["-createdAt"],
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
