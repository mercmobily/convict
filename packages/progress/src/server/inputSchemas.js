import { composeSchemaDefinitions } from "@jskit-ai/kernel/shared/validators";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";

const progressStateQueryInputValidator = composeSchemaDefinitions([
  workspaceSlugParamsValidator
]);

export { progressStateQueryInputValidator };
