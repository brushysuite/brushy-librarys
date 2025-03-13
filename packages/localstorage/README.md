# @brushy/localstorage

<div align="center">

[![Coverage - Statements](https://img.shields.io/badge/Coverage%20Statements-95.72%25-brightgreen.svg)](coverage)
[![Coverage - Branches](https://img.shields.io/badge/Coverage%20Branches-91.51%25-brightgreen.svg)](coverage)
[![Coverage - Functions](https://img.shields.io/badge/Coverage%20Functions-94%25-brightgreen.svg)](coverage)
[![Coverage - Lines](https://img.shields.io/badge/Coverage%20Lines-96.87%25-brightgreen.svg)](coverage)

<!-- Package Stats -->

[![npm downloads](https://img.shields.io/npm/dm/@brushy/localstorage.svg)](https://www.npmjs.com/package/@brushy/localstorage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@brushy/localstorage)](https://bundlephobia.com/package/@brushy/localstorage)
[![npm version](https://img.shields.io/npm/v/@brushy/localstorage.svg)](https://www.npmjs.com/package/@brushy/localstorage)

</div>

A robust and efficient TypeScript library for local storage management in browsers, with support for compression, expiration, JSON serialization, and lazy loading.

## Real-World Problem Solving

Here's how @brushy/localstorage compares to other solutions in solving common real-world problems:

| Problem           | @brushy/localstorage       | localStorage   | localforage     | Other Solutions |
| ----------------- | -------------------------- | -------------- | --------------- | --------------- |
| **Type Safety**   | ✅ Full TypeScript support | ❌ No types    | ⚠️ Basic types  | ⚠️ Varies       |
| **Compression**   | ✅ Automatic compression   | ❌ None        | ❌ None         | ⚠️ Manual       |
| **TTL Support**   | ✅ Built-in expiration     | ❌ None        | ❌ None         | ⚠️ Manual       |
| **Large Data**    | ✅ Lazy loading & chunks   | ❌ Size limits | ✅ IndexedDB    | ⚠️ Varies       |
| **Performance**   | ✅ Optimized caching       | ✅ Native API  | ⚠️ Async only   | ⚠️ Varies       |
| **Events**        | ✅ Fine-grained control    | ⚠️ Limited     | ✅ Good support | ⚠️ Basic        |
| **Serialization** | ✅ Smart JSON handling     | ⚠️ Basic       | ✅ Good support | ⚠️ Manual       |

Legend:

- ✅ Fully Supported/Optimal
- ⚠️ Partial/Varies
- ❌ Limited/Problematic

## Features

- 🔒 **Strong Typing**: Fully written in TypeScript for a safe development experience
- 🗜️ **Intelligent Compression**: Automatic compression for large data, optimizing storage usage
- ⏱️ **TTL (Time-to-Live)**: Easily set expiration for your stored data
- 🔄 **JSON Serialization**: Store and retrieve complex objects without worries
- 🦥 **Lazy Loading**: Load large datasets only when needed
- 🪝 **React Hooks**: Seamless integration with React applications
- 📊 **Size Monitoring**: Track the size of stored data
- 🧪 **Highly Tested**: Test coverage over 95%

## Installation

```bash
# Using npm
npm install @brushy/localstorage

# Using yarn
yarn add @brushy/localstorage

# Using pnpm
pnpm add @brushy/localstorage
```

## Basic Usage

### Simple LocalStorage

```typescript
import { LocalStorage } from "@brushy/localstorage";

// Create an instance with custom prefix (optional)
const storage = new LocalStorage("@myapp:");

// Store data
storage.set("user", { name: "John", age: 30 });

// Retrieve data
const user = storage.get("user");
console.log(user); // { name: 'John', age: 30 }

// Check if a key exists
if (storage.has("user")) {
  console.log("User found!");
}

// Remove data
storage.remove("user");

// Clear all data with your prefix
storage.clear();
```

### Advanced Options

```typescript
// Store with TTL (expires after 1 hour)
storage.set("session", { token: "abc123" }, { ttl: 3600000 });

// Store with automatic compression
storage.set("largeData", bigObject, { compress: true });

// Check remaining TTL
const ttl = storage.getTTL("session");
console.log(`Session expires in ${ttl / 1000} seconds`);

// Get approximate size in bytes
const size = storage.getSize("largeData");
console.log(`Data size: ${size} bytes`);
```

### Events and Subscriptions

```typescript
// Subscribe to changes on a specific key
const unsubscribe = storage.subscribe("user", (key, newValue, oldValue) => {
  console.log(`${key} changed from`, oldValue, "to", newValue);
});

// Stop receiving notifications
unsubscribe();
```

## JSON Storage

For working specifically with JSON data:

```typescript
import { JSONStorage } from "@brushy/localstorage";

const jsonStorage = new JSONStorage("@myapp:json:");

// Store JSON data
jsonStorage.setJSON("config", { theme: "dark", fontSize: 16 });

// Retrieve JSON data
const config = jsonStorage.getJSON("config");

// Update JSON data (merging with existing)
jsonStorage.updateJSON("config", { fontSize: 18 });
// Now config = { theme: 'dark', fontSize: 18 }

// Merge arrays
jsonStorage.mergeArrays("tags", ["javascript", "typescript"]);
jsonStorage.mergeArrays("tags", ["react", "typescript"]);
// Result: ['javascript', 'typescript', 'react']
```

## Lazy Storage

For large datasets that you want to load on demand:

```typescript
import { LazyStorage } from "@brushy/localstorage";

const lazyStorage = new LazyStorage("@myapp:lazy:");

// Store data with lazy fields
const userData = {
  id: 123,
  name: "Mary",
  posts: Array(1000)
    .fill()
    .map((_, i) => ({ id: i, title: `Post ${i}` })),
  friends: Array(500)
    .fill()
    .map((_, i) => ({ id: i, name: `Friend ${i}` })),
};

lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "friends"], // These fields will be loaded on demand
  chunkSize: 100, // Chunk size for large arrays
});

// Retrieve data (lazy fields will be loaded when accessed)
const user = lazyStorage.getLazy("user");

// Access a lazy field (automatically loaded)
console.log(user.posts.length); // 1000

// Preload specific fields
lazyStorage.preload("user", ["friends"]);
```

## React Hooks

For use in React applications:

```tsx
import {
  useStorage,
  useJSONStorage,
  useLazyStorage,
} from "@brushy/localstorage/react";

function App() {
  // Basic storage hook
  const [token, setToken, removeToken] = useStorage("auth:token", null);

  // JSON data hook
  const [settings, setSettings, updateSettings] = useJSONStorage(
    "app:settings",
    {
      theme: "light",
      notifications: true,
    },
  );

  // Lazy data hook
  const [userData, setUserData] = useLazyStorage("user:data", null, {
    lazyFields: ["posts", "comments"],
  });

  return (
    <div>
      <button onClick={() => setToken("new-token-123")}>Login</button>
      <button onClick={() => updateSettings({ theme: "dark" })}>
        Dark Mode
      </button>
      {userData && <UserProfile data={userData} />}
    </div>
  );
}
```

## Detailed Documentation

For more detailed information about the API and advanced examples, see the [complete documentation](https://github.com/brushysuite/brushy-librarys/blob/main/packages/localstorage/docs/README.md).

### Additional Documentation

- [Benefits and Use Cases](https://github.com/brushysuite/brushy-librarys/blob/main/packages/localstorage/docs/en/benefits-and-use-cases.md) - Explore the problems the library solves and use cases by industry
- [React Hooks](https://github.com/brushysuite/brushy-librarys/blob/main/packages/localstorage/docs/en/react-hooks.md) - Complete guide for React integration

### Other Languages

- [Documentação em Português (BR)](https://github.com/brushysuite/brushy-librarys/blob/main/packages/localstorage/docs/pt-br/README.md)

## License

MIT
