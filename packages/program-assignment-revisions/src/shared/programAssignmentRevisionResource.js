import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "program_assignment_revisions",
  tableName: "program_assignment_revisions",
  schema: {
  programAssignmentId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "program-assignments", valueKey: "id" },
    belongsTo: "programAssignments",
    as: "programAssignment",
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
  instanceProgramId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "instance-programs", valueKey: "id" },
    belongsTo: "instancePrograms",
    as: "instanceProgram",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  effectiveFromDate: {
    type: "date",
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  changeReason: {
    type: "string",
    maxLength: 64,
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
  },
  searchSchema: {
    id: { type: "id", actualField: "id" },
    ids: { type: "array", actualField: "id", filterOperator: "in" },
    programAssignmentId: { type: "id", actualField: "program_assignment_id", filterOperator: "=" },
    programAssignmentIds: { type: "array", actualField: "program_assignment_id", filterOperator: "in" },
    instanceProgramId: { type: "id", actualField: "instance_program_id", filterOperator: "=" },
    instanceProgramIds: { type: "array", actualField: "instance_program_id", filterOperator: "in" },
    q: { type: "string", oneOf: ["changeReason","notes"], filterOperator: "like", splitBy: " ", matchAll: true },
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
