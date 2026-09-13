/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-react-in-core",
      severity: "error",
      from: {
        path: "^packages/di-core/src",
        pathNot: ["tests", "spec\\.ts$"],
      },
      to: { path: "react" },
    },
    {
      name: "no-react-native-in-core",
      severity: "error",
      from: {
        path: "^packages/di-core/src",
        pathNot: ["tests", "spec\\.ts$"],
      },
      to: { path: "react-native" },
    },
    {
      name: "react-only-depends-on-core",
      severity: "error",
      from: { path: "^packages/di-react/src" },
      to: {
        path: "^packages",
        pathNot: ["packages/di-core", "packages/di-react"],
      },
    },
    {
      name: "monitor-only-depends-on-core",
      severity: "error",
      from: { path: "^packages/di-monitor/src" },
      to: {
        path: "^packages",
        pathNot: ["packages/di-core", "packages/di-monitor"],
      },
    },
    {
      name: "otel-only-depends-on-core",
      severity: "error",
      from: { path: "^packages/di-otel/src" },
      to: {
        path: "^packages",
        pathNot: ["packages/di-core", "packages/di-otel"],
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
  },
};
