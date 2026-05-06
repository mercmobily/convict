export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/today",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (today).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/database-runtime",
    "@jskit-ai/workspaces-core"
  ],
  capabilities: {
    provides: [
      "feature.today"
    ],
    requires: [
      "runtime.actions"
    ]
  },
  runtime: {
    server: {
      providers: [
        {
          entrypoint: "src/server/TodayProvider.js",
          export: "TodayProvider"
        }
      ]
    },
    client: {
      providers: []
    }
  },
  metadata: {
    apiSummary: {
      surfaces: [
        {
          subpath: "./server/actions",
          summary: "Exports today projection and workout-occurrence action definitions."
        }
      ],
      containerTokens: {
        server: [
          "feature.today.service",
          "feature.today.repository"
        ],
        client: []
      }
    },
    jskit: {
      scaffoldShape: "feature-server-v1",
      scaffoldMode: "custom-knex",
      lane: "weird-custom"
    }
  },
  mutations: {
    dependencies: {
      runtime: {},
      dev: {}
    },
    packageJson: {
      scripts: {}
    },
    procfile: {},
    files: [],
    text: []
  }
});
