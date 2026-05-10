import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "instance_progressions",
  tableName: "instance_progressions",
  schema: {
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
  sourceProgressionId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "progressions", valueKey: "id" },
    belongsTo: "progressions",
    as: "sourceProgression",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  slug: {
    type: "string",
    maxLength: 120,
    required: true,
    search: true,
    operations: {
      output: { required: true },
      create: { required: true },
      patch: { required: false }
    }
  },
  name: {
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
  description: {
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
  defaultCategoryId: {
    type: "id",
    nullable: true,
    search: true,
    relation: { kind: "lookup", namespace: "categories", valueKey: "id" },
    belongsTo: "categories",
    as: "defaultCategory",
    ui: { formControl: "autocomplete" },
    operations: {
      output: { required: true },
      create: { required: false },
      patch: { required: false }
    }
  },
  sourceKey: {
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
  sortOrder: {
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
    instanceProgramId: { type: "id", actualField: "instance_program_id", filterOperator: "=" },
    instanceProgramIds: { type: "array", actualField: "instance_program_id", filterOperator: "in" },
    sourceProgressionId: { type: "id", actualField: "source_progression_id", filterOperator: "=" },
    sourceProgressionIds: { type: "array", actualField: "source_progression_id", filterOperator: "in" },
    defaultCategoryId: { type: "id", actualField: "default_category_id", filterOperator: "=" },
    defaultCategoryIds: { type: "array", actualField: "default_category_id", filterOperator: "in" },
    q: { type: "string", oneOf: ["slug","name","description","sourceKey","sourceRef"], filterOperator: "like", splitBy: " ", matchAll: true },
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
