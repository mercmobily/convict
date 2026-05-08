import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "program_template_schedule_entries",
  tableName: "program_template_schedule_entries",
  schema: {
  programTemplateId: {
    type: "id",
    required: true,
    search: true,
    relation: { kind: "lookup", namespace: "program-templates", valueKey: "id" },
    belongsTo: "programTemplates",
    as: "programTemplate",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  dayOfWeek: {
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
  workSetsMin: {
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
  workSetsMax: {
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
    programTemplateIds: { type: "array", actualField: "program_template_id", filterOperator: "in" },
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
