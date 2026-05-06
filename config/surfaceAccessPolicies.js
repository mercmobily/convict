export const surfaceAccessPolicies = {};

surfaceAccessPolicies.public = {};


surfaceAccessPolicies.console_owner = {
  requireAuth: true,
  requireFlagsAll: ["console_owner"]
};


surfaceAccessPolicies.workspace_member = {
  requireAuth: true,
  requireWorkspaceMembership: true
};
