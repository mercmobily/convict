import { createJsonRestContext } from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";

function createRepository({ api } = {}) {
  if (!api) {
    throw new TypeError("createRepository requires api.");
  }

  return Object.freeze({
    hasResource(resourceName = "") {
      return Boolean(api.resources?.[String(resourceName || "").trim()]);
    },
    createContext(context = null) {
      return createJsonRestContext(context);
    }
  });
}

export { createRepository };
