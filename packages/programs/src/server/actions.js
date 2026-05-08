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
import { resource } from "../shared/programResource.js";

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
      id: "crud.programs.list",
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
        actionName: "crud.programs.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const query = input || {};
        return deps.programsService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.programs.view",
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
        actionName: "crud.programs.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.programsService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.programs.create",
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
        actionName: "crud.programs.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const payload = input || {};
        return deps.programsService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.programs.update",
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
        actionName: "crud.programs.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { recordId, ...patch } = input || {};
        return deps.programsService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.programs.delete",
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
        actionName: "crud.programs.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.programsService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
