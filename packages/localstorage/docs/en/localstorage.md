# LocalStorage Class

The `LocalStorage` class is the foundation of the library, providing methods to store, retrieve, and manage data in the browser's localStorage with additional features such as TTL (time-to-live), compression, and events.

## Import

```typescript
import { LocalStorage } from "@brushy/localstorage";
```

## Constructor

```typescript
constructor((prefix = "@brushy/storage:"));
```

Creates a new instance of `LocalStorage` with the specified prefix.

| Parameter | Type   | Default            | Description                     |
| --------- | ------ | ------------------ | ------------------------------- |
| prefix    | string | '@brushy/storage:' | Prefix used for all stored keys |

**Example:**

```typescript
// Using the default prefix
const defaultStorage = new LocalStorage();

// Using a custom prefix
const appStorage = new LocalStorage("@myapp:");
```

## Methods

### set

```typescript
set<T>(key: string, value: T, options?: StorageOptions): void
```

Stores a value in localStorage.

| Parameter | Type           | Description                  |
| --------- | -------------- | ---------------------------- |
| key       | string         | Key to store the value under |
| value     | T              | Value to be stored           |
| options   | StorageOptions | Storage options (optional)   |

**Options:**

```typescript
interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean; // Whether to compress the value
}
```

**Examples:**

```typescript
// Basic storage
storage.set("user", { name: "John", age: 30 });

// With TTL (expires after 1 hour)
storage.set("session", { token: "abc123" }, { ttl: 3600000 });

// With compression
storage.set("largeData", bigObject, { compress: true });

// With TTL and compression
storage.set("temporaryData", bigObject, { ttl: 86400000, compress: true });
```

### get

```typescript
get<T>(key: string): T | null
```

Retrieves a value from localStorage.

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| key       | string | Key of the value to retrieve |

**Return:**

- The stored value, or `null` if the key doesn't exist or the value has expired.

**Examples:**

```typescript
// Retrieve a value
const user = storage.get("user");
if (user) {
  console.log(`Hello, ${user.name}!`);
}

// With typing
interface User {
  name: string;
  age: number;
}
const typedUser = storage.get<User>("user");
if (typedUser) {
  console.log(`Hello, ${typedUser.name}! You are ${typedUser.age} years old.`);
}
```

### remove

```typescript
remove(key: string): void
```

Removes a value from localStorage.

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| key       | string | Key of the value to remove |

**Example:**

```typescript
// Remove a value
storage.remove("user");
```

### has

```typescript
has(key: string): boolean
```

Checks if a key exists in localStorage and hasn't expired.

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| key       | string | Key to check |

**Return:**

- `true` if the key exists and hasn't expired, `false` otherwise.

**Example:**

```typescript
// Check if a key exists
if (storage.has("user")) {
  console.log("User found!");
} else {
  console.log("User not found.");
}
```

### clear

```typescript
clear(): void
```

Removes all values stored with the current prefix.

**Example:**

```typescript
// Clear all data
storage.clear();
```

### getTTL

```typescript
getTTL(key: string): number | null
```

Gets the remaining time to live (in milliseconds) of a stored value.

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| key       | string | Key of the value |

**Return:**

- The remaining time in milliseconds, or `null` if the key doesn't exist or doesn't have a TTL.

**Example:**

```typescript
// Check remaining TTL
const ttl = storage.getTTL("session");
if (ttl !== null) {
  console.log(`Session expires in ${ttl / 1000} seconds.`);
} else {
  console.log("Session has no expiration or doesn't exist.");
}
```

### getSize

```typescript
getSize(key: string): number
```

Gets the approximate size (in bytes) of a stored value.

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| key       | string | Key of the value |

**Return:**

- The approximate size in bytes, or `0` if the key doesn't exist.

**Example:**

```typescript
// Check size
const size = storage.getSize("largeData");
console.log(`Data size: ${size} bytes (${(size / 1024).toFixed(2)} KB)`);
```

### subscribe

```typescript
subscribe(key: string, listener: StorageEventListener): () => void
```

Subscribes to changes on a specific key.

| Parameter | Type                 | Description                   |
| --------- | -------------------- | ----------------------------- |
| key       | string               | Key to monitor                |
| listener  | StorageEventListener | Callback function for changes |

**Listener Type:**

```typescript
type StorageEventListener = (key: string, newValue: any, oldValue: any) => void;
```

**Return:**

- A function to unsubscribe.

**Example:**

```typescript
// Subscribe to changes
const unsubscribe = storage.subscribe("user", (key, newValue, oldValue) => {
  console.log(`${key} changed:`);
  console.log("Previous value:", oldValue);
  console.log("New value:", newValue);
});

// Modify the value (will trigger the listener)
storage.set("user", { name: "Mary", age: 28 });

// Unsubscribe
unsubscribe();
```

## Error Handling

The `LocalStorage` class handles errors internally and logs messages to the console. In environments without localStorage support, the library emits appropriate warnings.

```typescript
try {
  const value = storage.get("key");
  // Work with the value
} catch (error) {
  console.error("Error accessing localStorage:", error);
}
```

## Limitations

- localStorage has a storage limit (typically 5-10 MB, depending on the browser).
- Only strings can be stored natively, so the library automatically serializes/deserializes.
- localStorage is synchronous and can cause blocking if used with large volumes of data.

## Best Practices

1. **Use meaningful prefixes** to avoid collisions with other applications.
2. **Set TTL** for temporary data to avoid accumulation of obsolete data.
3. **Use compression** for large data to optimize space usage.
4. **Monitor the size** of stored data to avoid hitting browser limits.
5. **Handle errors** appropriately, especially in environments where localStorage may be disabled.

## Complete Examples

### Session Management

```typescript
const sessionStorage = new LocalStorage("@myapp:session:");

// Login
function login(username, password) {
  // Authentication simulation
  const token = "token-" + Math.random().toString(36).substring(2);

  // Store token with 1 hour expiration
  sessionStorage.set("token", token, { ttl: 3600000 });

  return token;
}

// Check authentication
function isAuthenticated() {
  return sessionStorage.has("token");
}

// Get token
function getToken() {
  return sessionStorage.get("token");
}

// Logout
function logout() {
  sessionStorage.remove("token");
}
```

### User Preferences

```typescript
const prefsStorage = new LocalStorage("@myapp:prefs:");

// Save preferences
function savePreferences(prefs) {
  prefsStorage.set("userPrefs", prefs);
}

// Load preferences
function loadPreferences() {
  return (
    prefsStorage.get("userPrefs") || {
      theme: "light",
      fontSize: "medium",
      notifications: true,
    }
  );
}

// Update a specific preference
function updatePreference(key, value) {
  const prefs = loadPreferences();
  prefs[key] = value;
  savePreferences(prefs);
}

// Monitor changes
prefsStorage.subscribe("userPrefs", (key, newValue) => {
  // Update the interface with new preferences
  applyTheme(newValue.theme);
  setFontSize(newValue.fontSize);
});
```

## Next Steps

- Explore the [JSONStorage](./json-storage.md) class for specific JSON data handling.
- Learn about the [LazyStorage](./lazy-storage.md) class for working with large datasets.
- Check out the [React Hooks](./react-hooks.md) for integration with React applications.
