import { resolveScopedApiBasePath, normalizeSurfaceId } from "@jskit-ai/kernel/shared/surface";
import { ROUTE_VISIBILITY_WORKSPACE_USER } from "@jskit-ai/kernel/shared/support/visibility";
import { workspaceSlugParamsValidator } from "@jskit-ai/workspaces-core/server/validators/routeParamsValidator";
import { buildWorkspaceInputFromRouteParams } from "@jskit-ai/workspaces-core/server/support/workspaceRouteInput";
import {
  startProgramBodyInputValidator
} from "./inputSchemas.js";

const READ_PROGRAM_SELECTION_STATE = "feature.program-assignment.selection.read";
const START_PROGRAM_ASSIGNMENT = "feature.program-assignment.assignment.start";

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
        summary: "Read program selection state for the current user."
      },
      params: workspaceSlugParamsValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: READ_PROGRAM_SELECTION_STATE,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params)
        }
      });

      reply.code(200).send(response);
    }
  );

  router.register(
    "POST",
    routeBase,
    {
      auth: "required",
      surface: normalizedRouteSurface,
      visibility: ROUTE_VISIBILITY_WORKSPACE_USER,
      meta: {
        tags: ["feature"],
        summary: "Start the first active program assignment for the current user."
      },
      params: workspaceSlugParamsValidator,
      body: startProgramBodyInputValidator
    },
    async function (request, reply) {
      const response = await request.executeAction({
        actionId: START_PROGRAM_ASSIGNMENT,
        input: {
          ...buildWorkspaceInputFromRouteParams(request.input.params),
          ...(request.input.body || {})
        }
      });

      reply.code(201).send(response);
    }
  );
}

export { registerRoutes };
