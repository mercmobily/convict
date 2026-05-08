import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "workout_occurrence_exercises",
  tableName: "workout_occurrence_exercises",
  schema: {
  workoutOccurrenceId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "workout-occurrences", valueKey: "id" },
    belongsTo: "workoutOccurrences",
    as: "workoutOccurrence",
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
  slotNumber: {
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
  exerciseNameSnapshot: {
    type: "string",
    maxLength: 160,
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  canonicalStepId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "exercise-steps", valueKey: "id" },
    belongsTo: "exerciseSteps",
    as: "canonicalStep",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  canonicalStepNameSnapshot: {
    type: "string",
    maxLength: 160,
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  personalStepVariationId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "personal-step-variations", valueKey: "id" },
    belongsTo: "personalStepVariations",
    as: "personalStepVariation",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  variationNameSnapshot: {
    type: "string",
    maxLength: 160,
    nullable: true,
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
  plannedWorkSetsMin: {
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
  plannedWorkSetsMax: {
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
  progressionSetsSnapshot: {
    type: "integer",
    min: 0,
    nullable: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  progressionRepsMinSnapshot: {
    type: "integer",
    min: 0,
    nullable: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  progressionRepsMaxSnapshot: {
    type: "integer",
    min: 0,
    nullable: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  progressionSecondsSnapshot: {
    type: "integer",
    min: 0,
    nullable: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  status: {
    type: "string",
    maxLength: 32,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  notes: {
    type: "string",
    maxLength: 65535,
    nullable: true,
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
    workoutOccurrenceIds: { type: "array", actualField: "workout_occurrence_id", filterOperator: "in" },
    q: { type: "string", oneOf: ["exerciseNameSnapshot","canonicalStepNameSnapshot","variationNameSnapshot","measurementUnitSnapshot","status","notes"], filterOperator: "like", splitBy: " ", matchAll: true },
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
