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
import { resource } from "../shared/programTemplateResource.js";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";

const listCursorPaginationQueryValidator = createCrudCursorPaginationQueryValidator({
  orderBy: resource.defaultSort
});
const listParentFilterQueryValidator = createCrudParentFilterQueryValidator(resource);
const actionPermissions = Object.freeze({
  list: "crud.program_templates.list",
  view: "crud.program_templates.view",
  create: "crud.program_templates.create",
  update: "crud.program_templates.update",
  delete: "crud.program_templates.delete"
});

function createActions({ surface } = {}) {
  return Object.freeze([
    {
      id: "crud.program_templates.list",
      version: 1,
      kind: "query",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: { require: "all", permissions: [actionPermissions.list] },
      input: composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  listCursorPaginationQueryValidator,
  listSearchQueryValidator,
  listParentFilterQueryValidator,
  lookupIncludeQueryValidator,
]),
      output: null,
      idempotency: "none",
      audit: {
        actionName: "crud.program_templates.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const { workspaceSlug, ...query } = input || {};
        return deps.programTemplatesService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.program_templates.view",
      version: 1,
      kind: "query",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: { require: "all", permissions: [actionPermissions.view] },
      input: composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  recordIdParamsValidator,
  lookupIncludeQueryValidator,
]),
      output: null,
      idempotency: "none",
      audit: {
        actionName: "crud.program_templates.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.programTemplatesService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.program_templates.create",
      version: 1,
      kind: "command",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: { require: "all", permissions: [actionPermissions.create] },
      input: composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  resource.operations.create.body,
], {
  mode: "create"
}),
      output: null,
      idempotency: "optional",
      audit: {
        actionName: "crud.program_templates.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const { workspaceSlug, ...payload } = input || {};
        return deps.programTemplatesService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.program_templates.update",
      version: 1,
      kind: "command",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: { require: "all", permissions: [actionPermissions.update] },
      input: composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  recordIdParamsValidator,
  resource.operations.patch.body,
]),
      output: null,
      idempotency: "optional",
      audit: {
        actionName: "crud.program_templates.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { workspaceSlug, recordId, ...patch } = input || {};
        return deps.programTemplatesService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.program_templates.delete",
      version: 1,
      kind: "command",
      channels: ["api", "automation", "internal"],
      surfaces: [surface],
      permission: { require: "all", permissions: [actionPermissions.delete] },
      input: composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  recordIdParamsValidator,
]),
      output: null,
      idempotency: "optional",
      audit: {
        actionName: "crud.program_templates.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.programTemplatesService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
