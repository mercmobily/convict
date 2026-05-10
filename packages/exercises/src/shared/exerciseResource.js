import { defineCrudResource } from "@jskit-ai/resource-crud-core/shared/crudResource";

const resource = defineCrudResource({
  namespace: "exercises",
  tableName: "exercises",
  schema: {
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
    shortName: {
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
    defaultMeasurementUnit: {
      type: "string",
      maxLength: 16,
      required: true,
      search: true,
      operations: {
        output: { required: true },
        create: { required: false },
        patch: { required: false }
      }
    },
    defaultEquipment: {
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
    difficultyHint: {
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
    }
  },
  searchSchema: {
    id: { type: "id", actualField: "id" },
    ids: { type: "array", actualField: "id", filterOperator: "in" },
    slug: { type: "string", actualField: "slug", filterOperator: "=" },
    status: { type: "string", actualField: "status", filterOperator: "=" },
    sourceKey: { type: "string", actualField: "source_key", filterOperator: "=" },
    q: {
      type: "string",
      oneOf: ["slug", "name", "shortName", "description", "instructionText"],
      filterOperator: "like",
      splitBy: " ",
      matchAll: true
    }
  },
  defaultSort: ["slug"],
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
