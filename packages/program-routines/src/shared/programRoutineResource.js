import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "program_routines",
  tableName: "program_routines",
  schema: {
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
  programId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "programs", valueKey: "id" },
    belongsTo: "programs",
    as: "program",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  sourceRoutineId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "routines", valueKey: "id" },
    belongsTo: "routines",
    as: "sourceRoutine",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  timing: {
    type: "string",
    maxLength: 32,
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  dayOfWeek: {
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
  slotNumber: {
    type: "integer",
    min: 0,
    search: true,
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  nameSnapshot: {
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
  descriptionSnapshot: {
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
    programId: { type: "id", actualField: "program_id", filterOperator: "=" },
    programIds: { type: "array", actualField: "program_id", filterOperator: "in" },
    sourceRoutineId: { type: "id", actualField: "source_routine_id", filterOperator: "=" },
    timing: { type: "string", actualField: "timing", filterOperator: "=" },
    q: { type: "string", oneOf: ["timing","nameSnapshot","descriptionSnapshot"], filterOperator: "like", splitBy: " ", matchAll: true },
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
