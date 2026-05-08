const placements = [];

function addPlacementTopology(value = {}) {
  placements.push(value);
}

export { addPlacementTopology };
export default { placements };

const menuLinkRenderers = Object.freeze({
  link: "local.main.ui.surface-aware-menu-link-item"
});

const bottomNavLinkRenderers = Object.freeze({
  link: "local.main.ui.tab-link-item"
});

addPlacementTopology({
  id: "shell.primary-nav",
  description: "Primary top-level navigation for the current surface.",
  surfaces: ["*"],
  default: true,
  variants: {
    compact: {
      outlet: "shell-layout:primary-bottom-nav",
      renderers: bottomNavLinkRenderers
    },
    medium: {
      outlet: "shell-layout:primary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "shell-layout:primary-menu",
      renderers: menuLinkRenderers
    }
  }
});

addPlacementTopology({
  id: "shell.secondary-nav",
  description: "Secondary navigation for the current surface.",
  surfaces: ["*"],
  variants: {
    compact: {
      outlet: "shell-layout:secondary-menu",
      renderers: menuLinkRenderers
    },
    medium: {
      outlet: "shell-layout:secondary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "shell-layout:secondary-menu",
      renderers: menuLinkRenderers
    }
  }
});

addPlacementTopology({
  id: "shell.identity",
  description: "Current surface identity and switcher controls.",
  surfaces: ["*"],
  variants: {
    compact: {
      outlet: "shell-layout:top-left"
    },
    medium: {
      outlet: "shell-layout:top-left"
    },
    expanded: {
      outlet: "shell-layout:top-left"
    }
  }
});

addPlacementTopology({
  id: "shell.status",
  description: "Surface status, connection, and utility indicators.",
  surfaces: ["*"],
  variants: {
    compact: {
      outlet: "shell-layout:top-right"
    },
    medium: {
      outlet: "shell-layout:top-right"
    },
    expanded: {
      outlet: "shell-layout:top-right"
    }
  }
});

addPlacementTopology({
  id: "page.section-nav",
  owner: "home-settings",
  description: "Navigation between child pages in the home settings section.",
  surfaces: ["home"],
  variants: {
    compact: {
      outlet: "home-settings:primary-menu",
      renderers: menuLinkRenderers
    },
    medium: {
      outlet: "home-settings:primary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "home-settings:primary-menu",
      renderers: menuLinkRenderers
    }
  }
});

addPlacementTopology({
  id: "auth.profile-menu",
  description: "Authenticated profile menu actions.",
  surfaces: ["*"],
  variants: {
    compact: {
      outlet: "auth-profile-menu:primary-menu",
      renderers: {
        link: "auth.web.profile.menu.link-item"
      }
    },
    medium: {
      outlet: "auth-profile-menu:primary-menu",
      renderers: {
        link: "auth.web.profile.menu.link-item"
      }
    },
    expanded: {
      outlet: "auth-profile-menu:primary-menu",
      renderers: {
        link: "auth.web.profile.menu.link-item"
      }
    }
  }
});

addPlacementTopology({
  id: "home.tools-menu",
  description: "Home surface tools menu actions.",
  surfaces: ["home"],
  variants: {
    compact: {
      outlet: "home-cog:primary-menu",
      renderers: menuLinkRenderers
    },
    medium: {
      outlet: "home-cog:primary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "home-cog:primary-menu",
      renderers: menuLinkRenderers
    }
  }
});

addPlacementTopology({
  id: "settings.sections",
  owner: "account-settings",
  description: "Account settings content sections.",
  surfaces: ["account"],
  variants: {
    compact: {
      outlet: "account-settings:sections"
    },
    medium: {
      outlet: "account-settings:sections"
    },
    expanded: {
      outlet: "account-settings:sections"
    }
  }
});

addPlacementTopology({
  id: "page.section-nav",
  owner: "console-settings",
  description: "Navigation between console settings child pages.",
  surfaces: ["console"],
  variants: {
    compact: {
      outlet: "console-settings:primary-menu",
      renderers: menuLinkRenderers
    },
    medium: {
      outlet: "console-settings:primary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "console-settings:primary-menu",
      renderers: menuLinkRenderers
    }
  }
});

addPlacementTopology({
  id: "page.section-nav",
  owner: "admin-settings",
  description: "Navigation between workspace admin settings child pages.",
  surfaces: ["admin"],
  variants: {
    compact: {
      outlet: "admin-settings:primary-menu",
      renderers: menuLinkRenderers
    },
    medium: {
      outlet: "admin-settings:primary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "admin-settings:primary-menu",
      renderers: menuLinkRenderers
    }
  }
});

addPlacementTopology({
  id: "admin.tools-menu",
  description: "Admin surface tools menu actions.",
  surfaces: ["admin"],
  variants: {
    compact: {
      outlet: "admin-cog:primary-menu",
      renderers: menuLinkRenderers
    },
    medium: {
      outlet: "admin-cog:primary-menu",
      renderers: menuLinkRenderers
    },
    expanded: {
      outlet: "admin-cog:primary-menu",
      renderers: menuLinkRenderers
    }
  }
});
