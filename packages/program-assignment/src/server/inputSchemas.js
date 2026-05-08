import { createSchema } from "json-rest-schema";
import { deepFreeze } from "@jskit-ai/kernel/shared/support/deepFreeze";

const startsOnSchema = {
  type: "string",
  required: true,
  minLength: 10,
  maxLength: 10,
  pattern: "^\\d{4}-\\d{2}-\\d{2}$"
};

const selectionStateQueryInputValidator = deepFreeze({
  schema: createSchema({}),
  mode: "patch"
});

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

const startProgramCommandInputValidator = startProgramBodyInputValidator;

export {
  selectionStateQueryInputValidator,
  startProgramBodyInputValidator,
  startProgramCommandInputValidator
};
