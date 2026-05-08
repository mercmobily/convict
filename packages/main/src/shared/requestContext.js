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

export { resolveCurrentUserId };
