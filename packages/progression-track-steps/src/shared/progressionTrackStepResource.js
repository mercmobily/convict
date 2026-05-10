import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "progression_track_steps",
  tableName: "progression_track_steps",
  schema: {
  progressionTrackId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "progression-tracks", valueKey: "id" },
    belongsTo: "progressionTracks",
    as: "progressionTrack",
    ui: { formControl: "autocomplete" },
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
  stepNumber: {
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
  stepLabel: {
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
  instructionText: {
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
  measurementUnit: {
    type: "string",
    maxLength: 16,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  beginnerSets: {
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
  beginnerRepsMin: {
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
  beginnerRepsMax: {
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
  beginnerSeconds: {
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
  intermediateSets: {
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
  intermediateRepsMin: {
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
  intermediateRepsMax: {
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
  intermediateSeconds: {
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
  progressionSets: {
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
  progressionRepsMin: {
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
  progressionRepsMax: {
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
  progressionSeconds: {
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
  sourceRef: {
    type: "string",
    maxLength: 80,
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
    ids: { type: "array", actualField: "id", filterOperator: "in" },
    progressionTrackId: { type: "id", actualField: "progression_track_id", filterOperator: "=" },
    progressionTrackIds: { type: "array", actualField: "progression_track_id", filterOperator: "in" },
    exerciseId: { type: "id", actualField: "exercise_id", filterOperator: "=" },
    stepNumber: { type: "integer", actualField: "step_number", filterOperator: "=" },
    q: { type: "string", oneOf: ["stepLabel","instructionText","measurementUnit","sourceRef"], filterOperator: "like", splitBy: " ", matchAll: true },
  },
  defaultSort: ["-createdAt"],
  autofilter: "public",
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
