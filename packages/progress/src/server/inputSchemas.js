import { createSchema } from "json-rest-schema";
import { deepFreeze } from "@jskit-ai/kernel/shared/support/deepFreeze";

const progressStateQueryInputValidator = deepFreeze({
  schema: createSchema({}),
  mode: "patch"
});

export { progressStateQueryInputValidator };
