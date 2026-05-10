import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "workout_exercises",
  tableName: "workout_exercises",
  schema: {
  workoutId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "workouts", valueKey: "id" },
    belongsTo: "workouts",
    as: "workout",
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
  section: {
    type: "string",
    maxLength: 32,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  sourceKind: {
    type: "string",
    maxLength: 32,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  instanceProgramEntryId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-program-entries", valueKey: "id" },
    belongsTo: "instanceProgramEntries",
    as: "instanceProgramEntry",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  instanceRoutineEntryId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-routine-entries", valueKey: "id" },
    belongsTo: "instanceRoutineEntries",
    as: "instanceRoutineEntry",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  instanceProgressionId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-progressions", valueKey: "id" },
    belongsTo: "instanceProgressions",
    as: "instanceProgression",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  instanceProgressionEntryId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-progression-entries", valueKey: "id" },
    belongsTo: "instanceProgressionEntries",
    as: "instanceProgressionEntry",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
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
  progressionNameSnapshot: {
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
  progressionStepLabelSnapshot: {
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
  plannedSetsMin: {
    type: "integer",
    min: 0,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  plannedSetsMax: {
    type: "integer",
    min: 0,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  targetRepsMinSnapshot: {
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
  targetRepsMaxSnapshot: {
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
  targetSecondsSnapshot: {
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
  restSecondsSnapshot: {
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
  notesSnapshot: {
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
    ids: { type: "array", actualField: "id", filterOperator: "in" },
    workoutId: { type: "id", actualField: "workout_id", filterOperator: "=" },
    workoutIds: { type: "array", actualField: "workout_id", filterOperator: "in" },
    instanceProgramEntryId: { type: "id", actualField: "instance_program_entry_id", filterOperator: "=" },
    instanceProgramEntryIds: { type: "array", actualField: "instance_program_entry_id", filterOperator: "in" },
    instanceRoutineEntryId: { type: "id", actualField: "instance_routine_entry_id", filterOperator: "=" },
    instanceRoutineEntryIds: { type: "array", actualField: "instance_routine_entry_id", filterOperator: "in" },
    instanceProgressionId: { type: "id", actualField: "instance_progression_id", filterOperator: "=" },
    instanceProgressionIds: { type: "array", actualField: "instance_progression_id", filterOperator: "in" },
    instanceProgressionEntryId: { type: "id", actualField: "instance_progression_entry_id", filterOperator: "=" },
    instanceProgressionEntryIds: { type: "array", actualField: "instance_progression_entry_id", filterOperator: "in" },
    exerciseId: { type: "id", actualField: "exercise_id", filterOperator: "=" },
    exerciseIds: { type: "array", actualField: "exercise_id", filterOperator: "in" },
    q: { type: "string", oneOf: ["section","sourceKind","exerciseNameSnapshot","progressionNameSnapshot","progressionStepLabelSnapshot","measurementUnitSnapshot","notesSnapshot","status","notes"], filterOperator: "like", splitBy: " ", matchAll: true },
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
