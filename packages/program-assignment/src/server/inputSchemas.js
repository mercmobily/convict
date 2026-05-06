import { createSchema } from "json-rest-schema";
import { composeSchemaDefinitions } from "@jskit-ai/kernel/shared/validators";
import { deepFreeze } from "@jskit-ai/kernel/shared/support/deepFreeze";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";

const startsOnSchema = {
  type: "string",
  required: true,
  minLength: 10,
  maxLength: 10,
  pattern: "^\\d{4}-\\d{2}-\\d{2}$"
};

const selectionStateQueryInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator
]);

const startProgramBodyInputValidator = deepFreeze({
  schema: createSchema({
    programTemplateId: {
      type: "id",
      required: true
    },
    startsOn: startsOnSchema
  }),
  mode: "patch"
});

const startProgramCommandInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator,
  deepFreeze({
    schema: createSchema({
      programTemplateId: {
        type: "id",
        required: true
      },
      startsOn: startsOnSchema
    }),
    mode: "patch"
  })
]);

export {
  selectionStateQueryInputValidator,
  startProgramBodyInputValidator,
  startProgramCommandInputValidator
};
