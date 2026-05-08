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
import { resource } from "../shared/userExerciseProgressResource.js";

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
      id: "crud.user_exercise_progress.list",
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
        actionName: "crud.user_exercise_progress.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const query = input || {};
        return deps.userExerciseProgressService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.user_exercise_progress.view",
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
        actionName: "crud.user_exercise_progress.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.userExerciseProgressService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.user_exercise_progress.create",
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
        actionName: "crud.user_exercise_progress.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const payload = input || {};
        return deps.userExerciseProgressService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.user_exercise_progress.update",
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
        actionName: "crud.user_exercise_progress.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { recordId, ...patch } = input || {};
        return deps.userExerciseProgressService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.user_exercise_progress.delete",
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
        actionName: "crud.user_exercise_progress.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.userExerciseProgressService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
