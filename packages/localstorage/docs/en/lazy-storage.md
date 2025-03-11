# LazyStorage Class

The `LazyStorage` class extends the `JSONStorage` class and provides support for lazy loading of large fields in objects, allowing efficient storage and retrieval of large datasets without overloading localStorage or memory.

## Import

```typescript
import { LazyStorage } from "@brushy/localstorage";
```

## Constructor

```typescript
constructor((prefix = "@brushy/lazy:"));
```

Creates a new instance of `LazyStorage` with the specified prefix.

| Parameter | Type   | Default         | Description                     |
| --------- | ------ | --------------- | ------------------------------- |
| prefix    | string | '@brushy/lazy:' | Prefix used for all stored keys |

**Example:**

```typescript
// Using the default prefix
const defaultLazyStorage = new LazyStorage();

// Using a custom prefix
const appLazyStorage = new LazyStorage("@myapp:lazy:");
```

## Methods

### setLazy

```typescript
setLazy<T extends object>(key: string, value: T, options?: LazyStorageOptions): void
```

Stores an object with support for lazy fields.

| Parameter | Type               | Description                  |
| --------- | ------------------ | ---------------------------- |
| key       | string             | Key to store the value under |
| value     | T                  | Object to be stored          |
| options   | LazyStorageOptions | Storage options (optional)   |

**Options:**

```typescript
interface LazyStorageOptions extends JSONStorageOptions {
  lazyFields?: string[]; // Fields to be loaded lazily
  chunkSize?: number; // Chunk size for large arrays
  compression?: CompressionOptions; // Compression options
  preloadFields?: string[]; // Fields to preload
}
```

**Examples:**

```typescript
// Object with large fields
const userData = {
  id: 123,
  name: "John",
  email: "john@example.com",
  posts: Array(1000)
    .fill()
    .map((_, i) => ({
      id: i,
      title: `Post ${i}`,
      content: `Content of post ${i}...`,
    })),
  comments: Array(500)
    .fill()
    .map((_, i) => ({
      id: i,
      text: `Comment ${i}`,
    })),
};

// Basic storage with lazy fields
lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "comments"], // These fields will be loaded on demand
});

// With custom chunk size
lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "comments"],
  chunkSize: 200, // Larger chunks (default is 50)
});

// With compression
lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "comments"],
  compression: {
    mode: "aggressive", // Compression mode: 'auto' or 'aggressive'
    threshold: 512, // Threshold in bytes for compression
  },
});
```

### getLazy

```typescript
getLazy<T extends object>(key: string, options?: LazyStorageOptions): T | null
```

Retrieves an object with lazy loading support.

| Parameter | Type               | Description                   |
| --------- | ------------------ | ----------------------------- |
| key       | string             | Key of the object to retrieve |
| options   | LazyStorageOptions | Retrieval options (optional)  |

**Return:**

- The stored object with lazy loading support, or `null` if the key doesn't exist or an error occurs.

**Examples:**

```typescript
// Retrieve an object with lazy fields
const user = lazyStorage.getLazy("user");

// Normal fields are accessed directly
console.log(user.id); // 123
console.log(user.name); // 'John'

// Lazy fields are loaded only when accessed
console.log(user.posts.length); // 1000 (loads posts on demand)
console.log(user.posts[0].title); // 'Post 0'

// With preloading of specific fields
const userWithPreload = lazyStorage.getLazy("user", {
  preloadFields: ["comments"], // Preloads comments
});

// With typing
interface User {
  id: number;
  name: string;
  posts: Post[];
  comments: Comment[];
}

interface Post {
  id: number;
  title: string;
  content: string;
}

interface Comment {
  id: number;
  text: string;
}

const typedUser = lazyStorage.getLazy<User>("user");
if (typedUser) {
  console.log(`User: ${typedUser.name}`);
  console.log(`Number of posts: ${typedUser.posts.length}`);
}
```

### preload

```typescript
preload(key: string, fields: string[]): void
```

Preloads specific lazy fields.

| Parameter | Type     | Description       |
| --------- | -------- | ----------------- |
| key       | string   | Key of the object |
| fields    | string[] | Fields to preload |

**Examples:**

```typescript
// Preload specific fields
lazyStorage.preload("user", ["posts"]);

// Preload multiple fields
lazyStorage.preload("user", ["posts", "comments"]);

// Practical use: preload data before displaying a page
function loadUserProfile(userId) {
  // Preload fields that will be displayed on the page
  lazyStorage.preload(`user:${userId}`, ["posts", "followers"]);

  // Retrieve the user (fields will already be in cache)
  return lazyStorage.getLazy(`user:${userId}`);
}
```

### clearCache

```typescript
clearCache(): void
```

Clears the internal cache of lazy fields.

**Examples:**

```typescript
// Clear the cache
lazyStorage.clearCache();

// Practical use: clear cache after intensive operations
function processLargeDataset() {
  const data = lazyStorage.getLazy("largeDataset");

  // Process the data...

  // Clear cache to free memory
  lazyStorage.clearCache();
}
```

## Inheritance from JSONStorage and LocalStorage

The `LazyStorage` class inherits all methods from the `JSONStorage` and `LocalStorage` classes, including:

### From JSONStorage:

- `setJSON<T>(key: string, value: T, options?: JSONStorageOptions): void`
- `getJSON<T>(key: string): T | null`
- `updateJSON<T extends object>(key: string, updates: Partial<T>): T | null`
- `mergeArrays<T>(key: string, items: T[]): T[] | null`
- `isValidJSON(value: string): boolean`
- `getJSONSchema(key: string): object | null`

### From LocalStorage:

- `set<T>(key: string, value: T, options?: StorageOptions): void`
- `get<T>(key: string): T | null`
- `remove(key: string): void`
- `has(key: string): boolean`
- `clear(): void`
- `getTTL(key: string): number | null`
- `getSize(key: string): number`
- `subscribe(key: string, listener: StorageEventListener): () => void`

See the [JSONStorage class documentation](./json-storage.md) and [LocalStorage class documentation](./localstorage.md) for more details on these methods.

## How Lazy Loading Works

The `LazyStorage` class uses JavaScript proxies to intercept property access and load data on demand:

1. When you store an object with `setLazy`, fields marked as lazy are extracted and stored separately.
2. For large arrays, data is divided into smaller chunks to optimize storage.
3. When you retrieve the object with `getLazy`, a proxy is created to intercept property access.
4. When a lazy field is accessed for the first time, the data is loaded from localStorage and stored in cache.
5. Subsequent accesses to the same field use the cached data, avoiding additional localStorage accesses.

## Best Practices

1. **Identify large fields** that are good candidates for lazy loading (arrays, nested objects, etc.).
2. **Adjust chunk size** based on the typical size of your data.
3. **Use preloading** for fields that are likely to be accessed together.
4. **Clear the cache** after intensive operations to free memory.
5. **Combine with compression** for very large data.

## Complete Examples

### Product Catalog Management

```typescript
const productStorage = new LazyStorage("@myapp:products:");

// Store product catalog
function storeCatalog(catalog) {
  productStorage.setLazy("catalog", catalog, {
    lazyFields: ["items", "categories", "reviews"],
    chunkSize: 100,
    compression: { mode: "auto", threshold: 1024 },
  });
}

// Retrieve catalog
function getCatalog() {
  return productStorage.getLazy("catalog");
}

// Preload categories (for navigation menu)
function preloadCategories() {
  productStorage.preload("catalog", ["categories"]);
}

// Preload products for a specific category
function preloadCategoryProducts(categoryId) {
  // Assuming products are organized by category
  productStorage.preload("catalog", [`items.${categoryId}`]);
}

// Usage
const catalog = {
  metadata: { lastUpdated: new Date(), version: "1.0" },
  categories: Array(50)
    .fill()
    .map((_, i) => ({
      id: i,
      name: `Category ${i}`,
    })),
  items: Array(10000)
    .fill()
    .map((_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: Math.random() * 1000,
      description: `Detailed description of product ${i}...`,
      categoryId: Math.floor(Math.random() * 50),
    })),
  reviews: Array(5000)
    .fill()
    .map((_, i) => ({
      id: i,
      productId: Math.floor(Math.random() * 10000),
      rating: Math.floor(Math.random() * 5) + 1,
      text: `Product review...`,
    })),
};

storeCatalog(catalog);
preloadCategories();

// Access the catalog
const loadedCatalog = getCatalog();
console.log(`Number of categories: ${loadedCatalog.categories.length}`);
console.log(`First category: ${loadedCatalog.categories[0].name}`);

// Products will only be loaded when accessed
console.log(`Number of products: ${loadedCatalog.items.length}`);
```

### News Feed Management

```typescript
const feedStorage = new LazyStorage("@myapp:feed:");

// Store news feed
function storeFeed(feed) {
  feedStorage.setLazy("newsFeed", feed, {
    lazyFields: ["articles", "comments", "media"],
    chunkSize: 20, // Smaller chunks for faster loading
  });
}

// Retrieve feed
function getFeed() {
  return feedStorage.getLazy("newsFeed", {
    preloadFields: ["articles"], // Preload articles
  });
}

// Load comments for a specific article
function loadCommentsForArticle(articleId) {
  const feed = getFeed();
  // Accessing comments will trigger lazy loading
  return feed.comments.filter((comment) => comment.articleId === articleId);
}

// Clear cache after navigation
function navigateAway() {
  feedStorage.clearCache();
}

// Usage
const newsFeed = {
  metadata: { lastUpdated: new Date() },
  articles: Array(100)
    .fill()
    .map((_, i) => ({
      id: i,
      title: `News ${i}`,
      summary: `Summary of news ${i}...`,
      content: `Full content of news ${i}...`.repeat(50),
    })),
  comments: Array(1000)
    .fill()
    .map((_, i) => ({
      id: i,
      articleId: Math.floor(Math.random() * 100),
      author: `User ${i % 50}`,
      text: `Comment on the news...`,
    })),
  media: Array(200)
    .fill()
    .map((_, i) => ({
      id: i,
      articleId: Math.floor(Math.random() * 100),
      type: i % 2 === 0 ? "image" : "video",
      url: `https://example.com/media/${i}`,
      metadata: { width: 800, height: 600, duration: i % 2 === 0 ? null : 120 },
    })),
};

storeFeed(newsFeed);
const feed = getFeed();

// Display articles (already preloaded)
console.log(`Number of articles: ${feed.articles.length}`);

// Load comments for the first article
const commentsForArticle0 = loadCommentsForArticle(0);
console.log(`Comments for article 0: ${commentsForArticle0.length}`);

// Clear cache when navigating to another page
navigateAway();
```

## Next Steps

- Check out the [React Hooks](./react-hooks.md) for integration with React applications, including the `useLazyStorage` hook.
- See the [Advanced Examples](./advanced-examples.md) for more complex use cases.
- Explore the [Utilities](./utilities.md) to better understand data compression.
