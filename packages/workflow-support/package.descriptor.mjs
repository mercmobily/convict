export default Object.freeze({
  packageVersion: 1,
  packageId: "@local/workflow-support",
  version: "0.1.0",
  kind: "runtime",
  description: "App-local non-CRUD feature package (workflow-support).",
  dependsOn: [
    "@jskit-ai/kernel",
    "@jskit-ai/json-rest-api-core"
  ],
  capabilities: {
    provides: [
      "feature.workflow-support"
    ],
    requires: [
      "json-rest-api.core"
    ]
  },
  runtime: {
    server: {
      providers: [
        {
          entrypoint: "src/server/WorkflowSupportProvider.js",
          export: "WorkflowSupportProvider"
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
          subpath: "./server/requestContext",
          summary: "Exports server-only authenticated user context helpers."
        },
        {
          subpath: "./server/jsonRestWorkflow",
          summary: "Exports small workflow repository helpers for internal json-rest-api reads."
        }
      ],
      containerTokens: {
        server: [
          "feature.workflow-support.repository"
        ],
        client: []
      }
    },
    jskit: {
      scaffoldShape: "feature-server-v1",
      scaffoldMode: "json-rest",
      lane: "default"
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
