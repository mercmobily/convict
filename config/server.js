export const config = {};


config.auth = {
  oauth: {
    providers: [],
    defaultProvider: ""
  }
};


config.workspaceColor = "#1867C0";


config.workspaceSettings = {
  defaults: {
    invitesEnabled: true
  }
};


config.workspaceMembers = {
  defaults: {
    inviteExpiresInMs: 604800000
  }
};


config.assistantServer ||= {};


config.assistantServer.admin = {
  aiConfigPrefix: "ADMIN_ASSISTANT"
};
