import { resolveScopedApiBasePath, normalizeSurfaceId } from "@jskit-ai/kernel/shared/surface";
import { ROUTE_VISIBILITY_WORKSPACE_USER } from "@jskit-ai/kernel/shared/support/visibility";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";
import { buildWorkspaceInputFromRouteParams } from "@jskit-ai/workspaces-core/server/support/workspaceRouteInput";
import { READ_PROGRESS_STATE } from "./actions.js";

function registerRoutes(
  app,
  {
    routeSurface = "",
    routeRelativePath = "",
    routeSurfaceRequiresWorkspace = false
  } = {}
) {
  if (!app || typeof app.make !== "function") {
    throw new Error("registerRoutes requires application make().");
  }

  const router = app.make("jskit.http.router");
  const normalizedRouteSurface = normalizeSurfaceId(routeSurface);
  const routeBase = resolveScopedApiBasePath({
    routeBase: routeSurfaceRequiresWorkspace === true ? "/w/:workspaceSlug" : "/",
    relativePath: routeRelativePath,
    strictParams: false
  });

  router.register(
    "GET",
    routeBase,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Read the user's cross-exercise progress projection."
      },
      params: workspaceSlugParamsValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_PROGRESS_STATE,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params)
        }
      });

      reply.code(200).send(response);
    }
  );
}

export { registerRoutes };
