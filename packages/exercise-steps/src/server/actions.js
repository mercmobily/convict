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
import { resource } from "../shared/exerciseStepResource.js";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";

const listCursorPaginationQueryValidator = createCrudCursorPaginationQueryValidator({
  orderBy: resource.defaultSort
});
const listParentFilterQueryValidator = createCrudParentFilterQueryValidator(resource);
const actionPermissions = Object.freeze({
  list: "crud.exercise_steps.list",
  view: "crud.exercise_steps.view",
  create: "crud.exercise_steps.create",
  update: "crud.exercise_steps.update",
  delete: "crud.exercise_steps.delete"
});

function createActions({ surface } = {}) {
  return Object.freeze([
    {
      id: "crud.exercise_steps.list",
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
        actionName: "crud.exercise_steps.list"
      },
      observability: {},
      async execute(input, context, deps) {
        const { workspaceSlug, ...query } = input || {};
        return deps.exerciseStepsService.queryDocuments(query, {
          context
        });
      }
    },
    {
      id: "crud.exercise_steps.view",
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
        actionName: "crud.exercise_steps.view"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.exerciseStepsService.getDocumentById(input.recordId, {
          context,
          include: input.include
        });
      }
    },
    {
      id: "crud.exercise_steps.create",
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
        actionName: "crud.exercise_steps.create"
      },
      observability: {},
      async execute(input, context, deps) {
        const { workspaceSlug, ...payload } = input || {};
        return deps.exerciseStepsService.createDocument(payload, {
          context
        });
      }
    },
    {
      id: "crud.exercise_steps.update",
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
        actionName: "crud.exercise_steps.update"
      },
      observability: {},
      async execute(input, context, deps) {
        const { workspaceSlug, recordId, ...patch } = input || {};
        return deps.exerciseStepsService.patchDocumentById(recordId, patch, {
          context
        });
      }
    },
    {
      id: "crud.exercise_steps.delete",
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
        actionName: "crud.exercise_steps.delete"
      },
      observability: {},
      async execute(input, context, deps) {
        return deps.exerciseStepsService.deleteDocumentById(input.recordId, {
          context
        });
      }
    }
  ]);
}

export { createActions };
