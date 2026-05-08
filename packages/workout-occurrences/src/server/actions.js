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
import { resource } from "../shared/workoutOccurrenceResource.js";

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
      id: "crud.workout_occurrences.list",
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
        actionName: "crud.workout_occurrences.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const query = input || {};
        return deps.workoutOccurrencesService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.workout_occurrences.view",
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
        actionName: "crud.workout_occurrences.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.workoutOccurrencesService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.workout_occurrences.create",
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
        actionName: "crud.workout_occurrences.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const payload = input || {};
        return deps.workoutOccurrencesService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.workout_occurrences.update",
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
        actionName: "crud.workout_occurrences.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { recordId, ...patch } = input || {};
        return deps.workoutOccurrencesService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.workout_occurrences.delete",
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
        actionName: "crud.workout_occurrences.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.workoutOccurrencesService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
