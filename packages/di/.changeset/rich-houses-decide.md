---
"@brushy/di": minor
---

Adds "immutable" lifecycle for dependency management.

The new "immutable" lifecycle ensures that:

- Instance is created only once
- Never invalidated by the cache system
- Not affected by garbage collector
- Maintains consistent internal state throughout the application lifecycle

Perfect for:

- State managers like React Query, Redux, Zustand
- API clients that need stable connections
- Services that need consistent state across components

Usage example:

```typescript
const container = new Container({
  providers: [
    {
      provide: QUERY_CLIENT,
      useFactory: () => new QueryClient(),
      lifecycle: "immutable", // Will never be invalidated
    },
  ],
});
```