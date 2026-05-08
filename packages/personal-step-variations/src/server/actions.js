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
import { resource } from "../shared/personalStepVariationResource.js";

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
      id: "crud.personal_step_variations.list",
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
        actionName: "crud.personal_step_variations.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const query = input || {};
        return deps.personalStepVariationsService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.personal_step_variations.view",
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
        actionName: "crud.personal_step_variations.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.personalStepVariationsService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.personal_step_variations.create",
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
        actionName: "crud.personal_step_variations.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const payload = input || {};
        return deps.personalStepVariationsService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.personal_step_variations.update",
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
        actionName: "crud.personal_step_variations.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { recordId, ...patch } = input || {};
        return deps.personalStepVariationsService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.personal_step_variations.delete",
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
        actionName: "crud.personal_step_variations.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.personalStepVariationsService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
