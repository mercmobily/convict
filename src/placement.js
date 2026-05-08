import { createPlacementRegistry } from "@jskit-ai/shell-web/client/placement";

const registry = createPlacementRegistry();
const { addPlacement } = registry;

export { addPlacement };

// Keep the default export near the top so module installers can append addPlacement(...)
// blocks at the bottom of this file without changing the export section.
export default function getPlacements() {
  return registry.build();
}

addPlacement({
  id: "shell-web.home.menu.home",
  target: "shell.primary-nav",
  kind: "link",
  surfaces: ["home"],
  order: 50,
  props: {
    label: "Home",
    surface: "home",
    scopedSuffix: "/",
    unscopedSuffix: "/",
    exact: true
  }
});

addPlacement({
  id: "shell-web.home.menu.settings",
  target: "shell.primary-nav",
  kind: "link",
  surfaces: ["home"],
  order: 100,
  props: {
    label: "Settings",
    surface: "home",
    scopedSuffix: "/settings",
    unscopedSuffix: "/settings"
  }
});

addPlacement({
  id: "shell-web.home.settings.general",
  target: "page.section-nav",
  owner: "home-settings",
  kind: "link",
  surfaces: ["home"],
  order: 100,
  props: {
    label: "General",
    surface: "home",
    scopedSuffix: "/settings/general",
    unscopedSuffix: "/settings/general"
  }
});


addPlacement({
  id: "auth.profile.widget",
  target: "shell.status",
  kind: "component",
  surfaces: ["*"],
  order: 1000,
  componentToken: "auth.web.profile.widget"
});

addPlacement({
  id: "auth.profile.menu.sign-in",
  target: "auth.profile-menu",
  kind: "link",
  surfaces: ["*"],
  order: 200,
  props: {
    label: "Sign in",
    to: "/auth/login"
  },
  when: ({ auth }) => auth?.authenticated !== true
});

addPlacement({
  id: "auth.profile.menu.sign-out",
  target: "auth.profile-menu",
  kind: "link",
  surfaces: ["*"],
  order: 1000,
  props: {
    label: "Sign out",
    to: "/auth/signout"
  },
  when: ({ auth }) => auth?.authenticated === true
});


addPlacement({
  id: "users.profile.menu.settings",
  target: "auth.profile-menu",
  kind: "link",
  surfaces: ["*"],
  order: 500,
  props: {
    label: "Settings",
    to: "/account"
  },
  when: ({ auth }) => auth?.authenticated === true
});


addPlacement({
  id: "users.home.tools.widget",
  target: "shell.status",
  kind: "component",
  surfaces: ["home"],
  order: 900,
  componentToken: "users.web.home.tools.widget",
  when: ({ auth }) => auth?.authenticated === true
});

addPlacement({
  id: "users.home.menu.settings",
  target: "home.tools-menu",
  kind: "link",
  surfaces: ["home"],
  order: 100,
  props: {
    label: "Settings",
    surface: "home",
    scopedSuffix: "/settings",
    unscopedSuffix: "/settings"
  },
  when: ({ auth }) => auth?.authenticated === true
});


addPlacement({
  id: "users.account.settings.profile",
  target: "settings.sections",
  owner: "account-settings",
  kind: "component",
  surfaces: ["account"],
  order: 100,
  componentToken: "local.main.account-settings.section.profile",
  props: {
    title: "Profile",
    value: "profile",
    usesSharedRuntime: true
  }
});

addPlacement({
  id: "users.account.settings.preferences",
  target: "settings.sections",
  owner: "account-settings",
  kind: "component",
  surfaces: ["account"],
  order: 200,
  componentToken: "local.main.account-settings.section.preferences",
  props: {
    title: "Preferences",
    value: "preferences",
    usesSharedRuntime: true
  }
});

addPlacement({
  id: "users.account.settings.notifications",
  target: "settings.sections",
  owner: "account-settings",
  kind: "component",
  surfaces: ["account"],
  order: 300,
  componentToken: "local.main.account-settings.section.notifications",
  props: {
    title: "Notifications",
    value: "notifications",
    usesSharedRuntime: true
  }
});


addPlacement({
  id: "console.web.profile.menu.console",
  target: "auth.profile-menu",
  kind: "link",
  surfaces: ["*"],
  order: 600,
  props: {
    label: "Go to console",
    to: "/console",
    icon: "mdi-console-network-outline"
  },
  when: ({ auth, surfaceAccess, surface }) => {
    return auth?.authenticated === true && surfaceAccess?.consoleowner === true && surface !== "console";
  }
});


addPlacement({
  id: "console.web.menu.settings",
  target: "shell.primary-nav",
  kind: "link",
  surfaces: ["console"],
  order: 100,
  props: {
    label: "Settings",
    to: "/console/settings",
    icon: "mdi-cog-outline"
  },
  when: ({ auth }) => auth?.authenticated === true
});


addPlacement({
  id: "workspaces.profile.menu.surface-switch",
  target: "auth.profile-menu",
  kind: "component",
  surfaces: ["*"],
  order: 100,
  componentToken: "workspaces.web.profile.menu.surface-switch-item",
  when: ({ auth }) => auth?.authenticated === true
});


addPlacement({
  id: "workspaces.workspace.menu.app",
  target: "shell.primary-nav",
  kind: "link",
  surfaces: ["app"],
  order: 50,
  props: {
    label: "Home",
    surface: "app",
    scopedSuffix: "/",
    unscopedSuffix: "/",
    exact: true
  },
  when: ({ auth }) => auth?.authenticated === true
});

addPlacement({
  id: "workspaces.workspace.menu.admin",
  target: "shell.primary-nav",
  kind: "link",
  surfaces: ["admin"],
  order: 60,
  props: {
    label: "Home",
    surface: "admin",
    scopedSuffix: "/",
    unscopedSuffix: "/",
    exact: true
  },
  when: ({ auth }) => auth?.authenticated === true
});

addPlacement({
  id: "workspaces.workspace.selector",
  target: "shell.identity",
  kind: "component",
  surfaces: ["*"],
  order: 200,
  componentToken: "workspaces.web.workspace.selector",
  props: {
    allowOnNonWorkspaceSurface: true,
    targetSurfaceId: "app"
  },
  when: ({ auth }) => auth?.authenticated === true
});

addPlacement({
  id: "workspaces.account.invites.cue",
  target: "shell.status",
  kind: "component",
  surfaces: ["*"],
  order: 850,
  componentToken: "local.main.account.pending-invites.cue",
  when: ({ auth }) => auth?.authenticated === true
});

addPlacement({
  id: "workspaces.workspace.tools.widget",
  target: "shell.status",
  kind: "component",
  surfaces: ["admin"],
  order: 900,
  componentToken: "workspaces.web.workspace.tools.widget"
});

addPlacement({
  id: "workspaces.workspace.menu.workspace-settings",
  target: "admin.tools-menu",
  kind: "component",
  surfaces: ["admin"],
  order: 100,
  componentToken: "workspaces.web.workspace-settings.menu-item"
});

addPlacement({
  id: "workspaces.workspace.menu.members",
  target: "admin.tools-menu",
  kind: "component",
  surfaces: ["admin"],
  order: 200,
  componentToken: "workspaces.web.workspace-members.menu-item"
});


addPlacement({
  id: "workspaces.account.settings.invites",
  target: "settings.sections",
  owner: "account-settings",
  kind: "component",
  surfaces: ["account"],
  order: 400,
  componentToken: "local.main.account-settings.section.invites",
  props: {
    title: "Invites",
    value: "invites",
    usesSharedRuntime: false
  },
  when: ({ auth, workspaceInvitesEnabled }) => auth?.authenticated === true && workspaceInvitesEnabled === true
});
// jskit:assistant.page.link:admin:/assistant
{
  addPlacement({
    id: "ui-generator.page.admin.assistant.link",
    target: "shell.primary-nav",
    kind: "link",
    surfaces: ["admin"],
    order: 155,
    props: {
      label: "Assistant",
      surface: "admin",
      scopedSuffix: "/assistant",
      unscopedSuffix: "/assistant",
    },
    when: ({ auth }) => auth?.authenticated === true
  });
}
// jskit:assistant.settings-page.link:console:/settings/admin-assistant:admin
{
  addPlacement({
    id: "ui-generator.page.console.settings.admin-assistant.link",
    target: "page.section-nav",
    owner: "console-settings",
    kind: "link",
    surfaces: ["console"],
    order: 155,
    props: {
      label: "Admin Assistant",
      surface: "console",
      scopedSuffix: "/settings/admin-assistant",
      unscopedSuffix: "/settings/admin-assistant",
    },
    when: ({ auth }) => auth?.authenticated === true
  });
}
// jskit:ui-generator.page.link:app:/progress
{
  addPlacement({
    id: "ui-generator.page.app.progress.link",
    target: "shell.primary-nav",
    kind: "link",
    surfaces: ["app"],
    order: 155,
    props: {
      label: "Progress",
      icon: "mdi-view-list-outline",
      surface: "app",
      scopedSuffix: "/progress",
      unscopedSuffix: "/progress",
    },
    when: ({ auth }) => auth?.authenticated === true
  });
}
// jskit:ui-generator.page.link:app:/history
{
  addPlacement({
    id: "ui-generator.page.app.history.link",
    target: "shell.primary-nav",
    kind: "link",
    surfaces: ["app"],
    order: 155,
    props: {
      label: "History",
      icon: "mdi-calendar-month-outline",
      surface: "app",
      scopedSuffix: "/history",
      unscopedSuffix: "/history",
    },
    when: ({ auth }) => auth?.authenticated === true
  });
}


addPlacement({
  id: "realtime.connection.indicator",
  target: "shell.status",
  kind: "component",
  surfaces: ["*"],
  order: 950,
  componentToken: "realtime.web.connection.indicator"
});
