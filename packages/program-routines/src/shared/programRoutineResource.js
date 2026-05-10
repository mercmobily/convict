import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "program_routines",
  tableName: "program_routines",
  schema: {
  programVersionId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "program-versions", valueKey: "id" },
    belongsTo: "programVersions",
    as: "programVersion",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  routineId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "routines", valueKey: "id" },
    belongsTo: "routines",
    as: "routine",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
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
    programVersionId: { type: "id", actualField: "program_version_id", filterOperator: "=" },
    programVersionIds: { type: "array", actualField: "program_version_id", filterOperator: "in" },
    routineId: { type: "id", actualField: "routine_id", filterOperator: "=" },
    routineIds: { type: "array", actualField: "routine_id", filterOperator: "in" },
    q: { type: "string", oneOf: ["timing"], filterOperator: "like", splitBy: " ", matchAll: true },
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
