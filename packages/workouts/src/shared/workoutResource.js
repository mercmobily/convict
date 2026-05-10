import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "workouts",
  tableName: "workouts",
  schema: {
  userId: {
    type: "id",
    required: true,
    search: true,
    hidden: true,
    operations: {}
  },
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
  programAssignmentRevisionId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "program-assignment-revisions", valueKey: "id" },
    belongsTo: "programAssignmentRevisions",
    as: "programAssignmentRevision",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  scheduledForDate: {
    type: "date",
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  performedOnDate: {
    type: "date",
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
  startedAt: {
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
  submittedAt: {
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
  definitelyMissedAt: {
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
    programAssignmentId: { type: "id", actualField: "program_assignment_id", filterOperator: "=" },
    programAssignmentIds: { type: "array", actualField: "program_assignment_id", filterOperator: "in" },
    programAssignmentRevisionId: { type: "id", actualField: "program_assignment_revision_id", filterOperator: "=" },
    programAssignmentRevisionIds: { type: "array", actualField: "program_assignment_revision_id", filterOperator: "in" },
    scheduledForDateRange: {
      type: "array",
      actualField: "scheduled_for_date",
      filterOperator: "between"
    },
    q: { type: "string", oneOf: ["status","notes"], filterOperator: "like", splitBy: " ", matchAll: true },
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
