# Mobile Capacitor

This file is managed by `@jskit-ai/mobile-capacitor`.

Installed contract:

- strategy: `capacitor`
- asset mode: `bundled`
- dev server url: `(unused)`
- API base URL: `http://127.0.0.1:3000/`
- auth callback path: `/auth/login`
- custom scheme: `convict`
- app link domains: `(none)`
- Capacitor app id: `ai.jskit.convict`
- Capacitor app name: `Convict`
- Android package name: `ai.jskit.convict`
- Android min SDK: `26`
- Android target SDK: `35`
- Android version code: `1`
- Android version name: `0.1.0`

Owned artifacts:

- `capacitor.config.json`
- `android/` after `jskit add package @jskit-ai/mobile-capacitor` or `jskit mobile add capacitor` runs `cap add android`
- `android/app/src/main/AndroidManifest.xml` managed deep-link intent filter for the custom scheme

Managed commands:

- `jskit add package @jskit-ai/mobile-capacitor`
- `jskit mobile dev android [--target <device-id>]`
- `jskit mobile devices android`
- `jskit mobile add capacitor`
- `jskit mobile sync android`
- `jskit mobile tunnel android --target <device-id>`
- `jskit mobile restart android --target <device-id>`
- `jskit mobile run android [--target <device-id>]`
- `jskit mobile build android`
- `jskit mobile doctor`

Current Stage 1 limits:

- Android only
- web assets stay the JSKIT web client
- OAuth start uses the external browser/custom tab only when the app is running inside the Capacitor shell
- auth/deep-link handling stays routed through normal JSKIT paths
- native app-link verification is still out of scope for Stage 1
