# Brushy DI + Expo

Same feature-driven layout as Vite. Entry at `index.js` → `src/providers/root`.

## Run

```bash
npm run build-packages   # from monorepo root
npm start                # clears Metro cache + EXPO_NO_METRO_WORKSPACE_ROOT=1
```

Requires **Expo Go SDK 57** (matches `expo` ~57 in `package.json`). If you see an SDK 52 mismatch:

1. Stop every Metro process (`Ctrl+C`, or `lsof -i :8081`).
2. Run `npm start` again from `examples/expo`.
3. In Expo Go, remove the old project from **Recently opened** and scan the new QR code.

Expo SDK 57 resolves monorepo packages automatically (`metro.config.js` uses the default Expo config). `experiments.autolinkingModuleResolution` keeps `react` / `react-native` aligned with the app.

## Layout

```text
index.js
src/
  container.ts
  screens/App.tsx
  features/users/
  shared/logger/
  providers/
```

**Note:** not run in CI. Validate with `npx expo start`.
