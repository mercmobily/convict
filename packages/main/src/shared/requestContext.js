import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { normalizeRecordId } from "@jskit-ai/kernel/shared/support/normalize";

function resolveCurrentUserId(context = {}) {
  const visibilityUserId = normalizeRecordId(context?.visibilityContext?.userId, { fallback: null });
  if (visibilityUserId) {
    return visibilityUserId;
  }

  const actorUserId = normalizeRecordId(context?.actor?.id, { fallback: null });
  if (actorUserId) {
    return actorUserId;
  }

  throw new AppError(401, "Authentication is required.");
}

function resolveCurrentWorkspaceId(context = {}) {
  return normalizeRecordId(
    context?.workspace?.id || context?.requestMeta?.resolvedWorkspaceContext?.workspace?.id,
    { fallback: null }
  );
}

function resolveCurrentWorkspace(context = {}) {
  const workspace = context?.workspace || context?.requestMeta?.resolvedWorkspaceContext?.workspace || null;
  if (!workspace || typeof workspace !== "object") {
    return null;
  }

  const id = normalizeRecordId(workspace.id, { fallback: null });
  if (!id) {
    return null;
  }

  return {
    ...workspace,
    id
  };
}

export {
  resolveCurrentUserId,
  resolveCurrentWorkspaceId,
  resolveCurrentWorkspace
};
