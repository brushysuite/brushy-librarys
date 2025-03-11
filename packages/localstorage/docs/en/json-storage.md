# JSONStorage Class

The `JSONStorage` class extends the `LocalStorage` class and provides specific methods for working with JSON data, including partial update operations, array merging, and schema validation.

## Import

```typescript
import { JSONStorage } from "@brushy/localstorage";
```

## Constructor

```typescript
constructor((prefix = "@brushy/json:"));
```

Creates a new instance of `JSONStorage` with the specified prefix.

| Parameter | Type   | Default         | Description                     |
| --------- | ------ | --------------- | ------------------------------- |
| prefix    | string | '@brushy/json:' | Prefix used for all stored keys |

**Example:**

```typescript
// Using the default prefix
const defaultJsonStorage = new JSONStorage();

// Using a custom prefix
const appJsonStorage = new JSONStorage("@myapp:json:");
```

## Methods

### setJSON

```typescript
setJSON<T>(key: string, value: T, options?: JSONStorageOptions): void
```

Stores a JSON value in localStorage.

| Parameter | Type               | Description                  |
| --------- | ------------------ | ---------------------------- |
| key       | string             | Key to store the value under |
| value     | T                  | Value to be stored           |
| options   | JSONStorageOptions | Storage options (optional)   |

**Options:**

```typescript
interface JSONStorageOptions extends StorageOptions {
  // Inherits ttl and compress from StorageOptions
}
```

**Examples:**

```typescript
// Basic storage
jsonStorage.setJSON("config", { theme: "dark", fontSize: 16 });

// With TTL (expires after 1 day)
jsonStorage.setJSON("userPrefs", { notifications: true }, { ttl: 86400000 });

// With compression
jsonStorage.setJSON("largeConfig", complexObject, { compress: true });
```

### getJSON

```typescript
getJSON<T>(key: string): T | null
```

Retrieves a JSON value from localStorage.

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| key       | string | Key of the value to retrieve |

**Return:**

- The stored JSON value, or `null` if the key doesn't exist, the value has expired, or is not valid JSON.

**Examples:**

```typescript
// Retrieve a value
const config = jsonStorage.getJSON("config");
if (config) {
  console.log(`Theme: ${config.theme}, Font size: ${config.fontSize}`);
}

// With typing
interface Config {
  theme: string;
  fontSize: number;
}
const typedConfig = jsonStorage.getJSON<Config>("config");
if (typedConfig) {
  applyTheme(typedConfig.theme);
  setFontSize(typedConfig.fontSize);
}
```

### updateJSON

```typescript
updateJSON<T extends object>(key: string, updates: Partial<T>): T | null
```

Partially updates an existing JSON value, merging the updates with the current value.

| Parameter | Type       | Description                      |
| --------- | ---------- | -------------------------------- |
| key       | string     | Key of the value to update       |
| updates   | Partial<T> | Object with properties to update |

**Return:**

- The updated JSON value, or `null` if the key doesn't exist or an error occurs.

**Examples:**

```typescript
// Partially update an object
jsonStorage.setJSON("config", {
  theme: "light",
  fontSize: 14,
  notifications: true,
});

// Update only the theme and font size
const updatedConfig = jsonStorage.updateJSON("config", {
  theme: "dark",
  fontSize: 16,
});
// Result: { theme: 'dark', fontSize: 16, notifications: true }

// With typing
interface Config {
  theme: string;
  fontSize: number;
  notifications: boolean;
}
const typedUpdate = jsonStorage.updateJSON<Config>("config", { fontSize: 18 });
```

### mergeArrays

```typescript
mergeArrays<T>(key: string, items: T[]): T[] | null
```

Merges an array with an existing array, removing duplicates.

| Parameter | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| key       | string | Key of the array to merge              |
| items     | T[]    | Items to merge with the existing array |

**Return:**

- The merged array, or `null` if the key doesn't exist or an error occurs.

**Examples:**

```typescript
// Create an initial array
jsonStorage.setJSON("tags", ["javascript", "typescript"]);

// Merge with new items
const mergedTags = jsonStorage.mergeArrays("tags", ["react", "typescript"]);
// Result: ['javascript', 'typescript', 'react']

// Merge with more items
jsonStorage.mergeArrays("tags", ["node", "express"]);
// Result: ['javascript', 'typescript', 'react', 'node', 'express']

// With typing
enum Category {
  Frontend,
  Backend,
  DevOps,
}
const categories = jsonStorage.mergeArrays<Category>("categories", [
  Category.Frontend,
]);
```

### isValidJSON

```typescript
isValidJSON(value: string): boolean
```

Checks if a string is valid JSON.

| Parameter | Type   | Description        |
| --------- | ------ | ------------------ |
| value     | string | String to validate |

**Return:**

- `true` if the string is valid JSON, `false` otherwise.

**Examples:**

```typescript
// Check if a string is valid JSON
const validJson = '{"name":"John","age":30}';
const invalidJson = '{name:"John",age:30}';

console.log(jsonStorage.isValidJSON(validJson)); // true
console.log(jsonStorage.isValidJSON(invalidJson)); // false

// Practical use
function processUserInput(input: string) {
  if (jsonStorage.isValidJSON(input)) {
    const data = JSON.parse(input);
    jsonStorage.setJSON("userInput", data);
  } else {
    console.error("Invalid input. Please provide valid JSON.");
  }
}
```

### getJSONSchema

```typescript
getJSONSchema(key: string): object | null
```

Generates a simplified JSON schema for the stored value.

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| key       | string | Key of the value |

**Return:**

- An object representing the schema of the value, or `null` if the key doesn't exist or an error occurs.

**Examples:**

```typescript
// Store a complex object
jsonStorage.setJSON("user", {
  name: "Mary",
  age: 28,
  address: {
    street: "Main Street",
    number: 123,
    city: "New York",
  },
  hobbies: ["reading", "swimming"],
});

// Get the schema
const schema = jsonStorage.getJSONSchema("user");
/* Approximate result:
{
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        number: { type: 'number' },
        city: { type: 'string' }
      }
    },
    hobbies: {
      type: 'array',
      items: { type: 'string' }
    }
  }
}
*/
```

## Inheritance from LocalStorage

The `JSONStorage` class inherits all methods from the `LocalStorage` class, including:

- `set<T>(key: string, value: T, options?: StorageOptions): void`
- `get<T>(key: string): T | null`
- `remove(key: string): void`
- `has(key: string): boolean`
- `clear(): void`
- `getTTL(key: string): number | null`
- `getSize(key: string): number`
- `subscribe(key: string, listener: StorageEventListener): () => void`

See the [LocalStorage class documentation](./localstorage.md) for more details on these methods.

## Error Handling

The `JSONStorage` class handles errors internally and logs messages to the console.

```typescript
try {
  const data = jsonStorage.getJSON("key");
  // Work with the data
} catch (error) {
  console.error("Error accessing JSON data:", error);
}
```

## Best Practices

1. **Use `updateJSON` instead of `setJSON`** for partial updates to avoid overwriting existing data.
2. **Use `mergeArrays` for collections** to maintain data integrity and avoid duplicates.
3. **Check the schema** with `getJSONSchema` to understand the structure of stored data.
4. **Validate external inputs** with `isValidJSON` before processing them.
5. **Use generic typing** to ensure type safety during development.

## Complete Examples

### Configuration Management

```typescript
const configStorage = new JSONStorage("@myapp:config:");

// Default configuration
const defaultConfig = {
  theme: "light",
  fontSize: 14,
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  language: "en-US",
};

// Initialize configuration
function initConfig() {
  if (!configStorage.has("app")) {
    configStorage.setJSON("app", defaultConfig);
  }
  return configStorage.getJSON("app");
}

// Get configuration
function getConfig() {
  return configStorage.getJSON("app") || defaultConfig;
}

// Update configuration
function updateConfig(updates) {
  return configStorage.updateJSON("app", updates);
}

// Reset to default
function resetConfig() {
  configStorage.setJSON("app", defaultConfig);
  return defaultConfig;
}

// Usage
const config = initConfig();
updateConfig({ theme: "dark" });
updateConfig({ notifications: { push: false } });
```

### Tags Management

```typescript
const tagsStorage = new JSONStorage("@myapp:tags:");

// Add tags
function addTags(newTags: string[]) {
  // If it doesn't exist, create an empty array
  if (!tagsStorage.has("userTags")) {
    tagsStorage.setJSON("userTags", []);
  }

  // Merge with existing tags
  return tagsStorage.mergeArrays("userTags", newTags);
}

// Remove a tag
function removeTag(tag: string) {
  const tags = tagsStorage.getJSON<string[]>("userTags");
  if (!tags) return null;

  const updatedTags = tags.filter((t) => t !== tag);
  tagsStorage.setJSON("userTags", updatedTags);

  return updatedTags;
}

// Get all tags
function getAllTags() {
  return tagsStorage.getJSON<string[]>("userTags") || [];
}

// Usage
addTags(["javascript", "react"]);
addTags(["typescript", "node"]);
removeTag("react");
console.log(getAllTags()); // ['javascript', 'typescript', 'node']
```

## Next Steps

- Explore the [LazyStorage](./lazy-storage.md) class for working with large datasets.
- Check out the [React Hooks](./react-hooks.md) for integration with React applications.
- See the [Advanced Examples](./advanced-examples.md) for more complex use cases.
