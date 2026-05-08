import {
  composeSchemaDefinitions,
  recordIdParamsValidator
} from "@jskit-ai/kernel/shared/validators";
import {
  createCrudCursorPaginationQueryValidator,
  listSearchQueryValidator,
  lookupIncludeQueryValidator,
  createCrudParentFilterQueryValidator
} from "@jskit-ai/crud-core/server/listQueryValidators";
import { resource } from "../shared/workoutSetLogResource.js";

const listCursorPaginationQueryValidator = createCrudCursorPaginationQueryValidator({
  orderBy: resource.defaultSort
});
const listParentFilterQueryValidator = createCrudParentFilterQueryValidator(resource);
const authenticatedPermission = Object.freeze({
  require: "authenticated"
});

function createActions({ surface } = {}) {
  return Object.freeze([
    {
      id: "crud.workout_set_logs.list",
      version: 1,
      kind: "query",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: authenticatedPermission,
      input: composeSchemaDefinitions([
  listCursorPaginationQueryValidator,
  listSearchQueryValidator,
  listParentFilterQueryValidator,
  lookupIncludeQueryValidator,
]),
      output: null,
      idempotency: "none",
      audit: {
        actionName: "crud.workout_set_logs.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const query = input || {};
        return deps.workoutSetLogsService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.workout_set_logs.view",
      version: 1,
      kind: "query",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: authenticatedPermission,
      input: composeSchemaDefinitions([
  recordIdParamsValidator,
  lookupIncludeQueryValidator,
]),
      output: null,
      idempotency: "none",
      audit: {
        actionName: "crud.workout_set_logs.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.workoutSetLogsService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.workout_set_logs.create",
      version: 1,
      kind: "command",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: authenticatedPermission,
      input: composeSchemaDefinitions([
  resource.operations.create.body,
], {
  mode: "create"
}),
      output: null,
      idempotency: "optional",
      audit: {
        actionName: "crud.workout_set_logs.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const payload = input || {};
        return deps.workoutSetLogsService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.workout_set_logs.update",
      version: 1,
      kind: "command",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: authenticatedPermission,
      input: composeSchemaDefinitions([
  recordIdParamsValidator,
  resource.operations.patch.body,
]),
      output: null,
      idempotency: "optional",
      audit: {
        actionName: "crud.workout_set_logs.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { recordId, ...patch } = input || {};
        return deps.workoutSetLogsService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.workout_set_logs.delete",
      version: 1,
      kind: "command",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: authenticatedPermission,
      input: composeSchemaDefinitions([
  recordIdParamsValidator,
]),
      output: null,
      idempotency: "optional",
      audit: {
        actionName: "crud.workout_set_logs.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.workoutSetLogsService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
