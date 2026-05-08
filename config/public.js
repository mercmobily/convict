import { surfaceAccessPolicies } from "./surfaceAccessPolicies.js";

export const config = {};
config.tenancyMode = "none";


config.surfaceModeAll = "all";
config.surfaceDefaultId = "home";
config.webRootAllowed = "no";
config.surfaceAccessPolicies = surfaceAccessPolicies;
config.surfaceDefinitions = {};
config.surfaceDefinitions.home = {
  id: "home",
  label: "Home",
  pagesRoot: "home",
  enabled: true,
  requiresAuth: false,
  requiresWorkspace: false,
  accessPolicyId: "public",
  origin: ""
};


config.surfaceDefinitions.auth = {
  id: "auth",
  label: "Auth",
  pagesRoot: "auth",
  enabled: true,
  requiresAuth: false,
  requiresWorkspace: false,
  origin: ""
};


config.surfaceDefinitions.account = {
  id: "account",
  label: "Account",
  pagesRoot: "account",
  enabled: true,
  requiresAuth: true,
  requiresWorkspace: false,
  origin: ""
};


config.surfaceDefinitions.console = {
  id: "console",
  label: "Console",
  pagesRoot: "console",
  enabled: true,
  requiresAuth: true,
  requiresWorkspace: false,
  accessPolicyId: "console_owner",
  icon: "mdi-console-network-outline",
  showInSurfaceSwitchMenu: false,
  origin: ""
};


config.surfaceDefinitions.app = {
  id: "app",
  label: "App",
  pagesRoot: "app",
  enabled: true,
  requiresAuth: true,
  requiresWorkspace: false,
  accessPolicyId: "authenticated",
  origin: ""
};

// jskit-mobile-capacitor:config:start
config.mobile = {
  enabled: true,
  strategy: "capacitor",
  appId: "ai.jskit.convict",
  appName: "Convict",
  assetMode: "bundled",
  devServerUrl: "",
  apiBaseUrl: "http://127.0.0.1:3000",
  auth: {
    callbackPath: "/auth/login",
    customScheme: "convict",
    appLinkDomains: []
  },
  android: {
    packageName: "ai.jskit.convict",
    minSdk: 26,
    targetSdk: 35,
    versionCode: 1,
    versionName: "0.1.0"
  }
};
// jskit-mobile-capacitor:config:end
