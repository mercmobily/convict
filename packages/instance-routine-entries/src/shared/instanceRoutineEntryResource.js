import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "instance_routine_entries",
  tableName: "instance_routine_entries",
  schema: {
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
  instanceProgramRoutineId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-program-routines", valueKey: "id" },
    belongsTo: "instanceProgramRoutines",
    as: "instanceProgramRoutine",
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
  targetSets: {
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
  targetRepsMin: {
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
  targetRepsMax: {
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
  targetSeconds: {
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
  restSeconds: {
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
    instanceProgramRoutineId: { type: "id", actualField: "instance_program_routine_id", filterOperator: "=" },
    instanceProgramRoutineIds: { type: "array", actualField: "instance_program_routine_id", filterOperator: "in" },
    exerciseId: { type: "id", actualField: "exercise_id", filterOperator: "=" },
    exerciseIds: { type: "array", actualField: "exercise_id", filterOperator: "in" },
    q: { type: "string", oneOf: ["exerciseNameSnapshot","measurementUnit","notes"], filterOperator: "like", splitBy: " ", matchAll: true },
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
