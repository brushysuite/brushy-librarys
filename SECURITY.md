# Security Policy

## Supported Versions

| Version | Packages | Supported |
| --- | --- | --- |
| 2.x | `@brushy/di`, `@brushy/di-core`, `@brushy/di-react`, `@brushy/di-monitor`, `@brushy/di-otel`, `@brushy/storage`, `@brushy/storage-react` | Yes |
| 1.x | `@brushy/di` only | No. Upgrade to 2.0.0. See [Migration v2](packages/di/docs/en/migration-v2.md). |
| 1.x | `@brushy/localstorage` | Deprecated. Use `@brushy/storage` 2.x. |

Security fixes are released for supported versions only. We recommend running the latest 2.x of the DI packages.

## In-Scope Packages

Reports are accepted for published npm packages in this repository:

- `@brushy/di`
- `@brushy/di-core`
- `@brushy/di-react`
- `@brushy/di-monitor`
- `@brushy/di-otel`
- `@brushy/storage`
- `@brushy/storage-react`
- `@brushy/localstorage` (deprecated)

Out of scope: `@brushy/di-bench` (private monorepo tooling, not published).

## Reporting a Vulnerability

Email **contact@gfrancodev.com** (do not open public GitHub issues for undisclosed security problems).

Include:

- Package name and version
- Affected environment (Node.js version, browser, React Native, etc.)
- Steps to reproduce
- Impact assessment (confidentiality, integrity, availability)
- Optional: suggested fix or CVE reference

## Process

1. **Acknowledgment** within 7 days of your report.
2. **Triage**: we confirm the issue, severity, and affected versions.
3. **Fix**: patch on a supported release line; coordinated disclosure preferred.
4. **Release**: security fix published to npm with notes in the relevant CHANGELOG.
5. **Credit**: reporters credited in release notes when they agree.

Please do not publish vulnerability details until we have shipped a fix or agreed on a disclosure timeline.

## Recommendations for Consumers

- Prefer `@brushy/di@2.x` and related `@brushy/di-*` packages over unmaintained `@brushy/di@1.x`.
- Use `createToken()` or `Symbol` for DI tokens. Avoid plain string tokens that can collide across modules.
- When using `@brushy/di-otel`, keep `@opentelemetry/api` up to date.
- Run `npm audit` in your application and update transitive dependencies regularly.
