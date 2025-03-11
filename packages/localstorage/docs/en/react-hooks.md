# React Hooks

The `@brushy/localstorage` library provides React hooks to facilitate the use of local storage in React applications. These hooks allow you to use localStorage declaratively, with typing support, automatic updates, and integration with component lifecycle.

## Import

```typescript
import {
  useStorage,
  useJSONStorage,
  useLazyStorage,
} from "@brushy/localstorage";
```

## useStorage

```typescript
function useStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions,
): [T, (value: T) => void, () => void];
```

Basic hook for local storage, supporting any data type.

| Parameter    | Type           | Description                            |
| ------------ | -------------- | -------------------------------------- |
| key          | string         | Key to store the value under           |
| defaultValue | T              | Default value if the key doesn't exist |
| options      | StorageOptions | Storage options (optional)             |

**Return:**

- An array with three elements:
  1. The stored value (or the default value if the key doesn't exist)
  2. A function to update the value
  3. A function to remove the value

**Examples:**

```tsx
import { useStorage } from "@brushy/localstorage";

function AuthComponent() {
  // Basic storage
  const [token, setToken, removeToken] = useStorage("auth:token", null);

  const handleLogin = async (credentials) => {
    const response = await api.login(credentials);
    setToken(response.token);
  };

  const handleLogout = () => {
    removeToken();
  };

  return (
    <div>
      {token ? (
        <>
          <p>Authenticated with token: {token}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

```tsx
// With TTL (expiration)
function SessionComponent() {
  const [session, setSession] = useStorage("user:session", null, {
    ttl: 3600000, // 1 hour
  });

  // ...
}

// With compression
function LargeDataComponent() {
  const [data, setData] = useStorage("app:largeData", [], {
    compress: true,
  });

  // ...
}
```

## useJSONStorage

```typescript
function useJSONStorage<T>(
  key: string,
  defaultValue: T,
  options?: JSONStorageOptions,
): [T, (value: T) => void, (updates: Partial<T>) => void];
```

Hook for storing JSON data, with support for partial updates.

| Parameter    | Type               | Description                            |
| ------------ | ------------------ | -------------------------------------- |
| key          | string             | Key to store the value under           |
| defaultValue | T                  | Default value if the key doesn't exist |
| options      | JSONStorageOptions | Storage options (optional)             |

**Return:**

- An array with three elements:
  1. The stored value (or the default value if the key doesn't exist)
  2. A function to replace the value
  3. A function to partially update the value

**Examples:**

```tsx
import { useJSONStorage } from "@brushy/localstorage";

function SettingsComponent() {
  // Settings with default value
  const [settings, setSettings, updateSettings] = useJSONStorage(
    "app:settings",
    {
      theme: "light",
      fontSize: 14,
      notifications: true,
    },
  );

  const toggleTheme = () => {
    // Partial update (only the theme)
    updateSettings({ theme: settings.theme === "light" ? "dark" : "light" });
  };

  const increaseFontSize = () => {
    // Partial update (only the font size)
    updateSettings({ fontSize: settings.fontSize + 2 });
  };

  const resetSettings = () => {
    // Complete replacement
    setSettings({
      theme: "light",
      fontSize: 14,
      notifications: true,
    });
  };

  return (
    <div className={`theme-${settings.theme}`}>
      <h1 style={{ fontSize: settings.fontSize }}>Settings</h1>
      <button onClick={toggleTheme}>
        Switch to {settings.theme === "light" ? "dark" : "light"} theme
      </button>
      <button onClick={increaseFontSize}>Increase font</button>
      <button onClick={resetSettings}>Reset</button>
    </div>
  );
}
```

```tsx
// With typing
interface UserPreferences {
  theme: "light" | "dark";
  fontSize: number;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

function TypedSettingsComponent() {
  const [prefs, setPrefs, updatePrefs] = useJSONStorage<UserPreferences>(
    "user:prefs",
    {
      theme: "light",
      fontSize: 14,
      language: "en-US",
      notifications: {
        email: true,
        push: true,
      },
    },
  );

  // Typed partial update
  const disableNotifications = () => {
    updatePrefs({
      notifications: {
        email: false,
        push: false,
      },
    });
  };

  // ...
}
```

## useLazyStorage

```typescript
function useLazyStorage<T extends object>(
  key: string,
  defaultValue: T | null,
  options?: LazyStorageOptions,
): [T | null, (value: T) => void];
```

Hook for storage with lazy loading, ideal for large datasets.

| Parameter    | Type               | Description                            |
| ------------ | ------------------ | -------------------------------------- |
| key          | string             | Key to store the value under           |
| defaultValue | T \| null          | Default value if the key doesn't exist |
| options      | LazyStorageOptions | Storage options (optional)             |

**Return:**

- An array with two elements:
  1. The stored value with lazy loading support (or the default value if the key doesn't exist)
  2. A function to update the value

**Examples:**

```tsx
import { useLazyStorage } from "@brushy/localstorage";

function UserProfileComponent({ userId }) {
  // User data with lazy fields
  const [userData, setUserData] = useLazyStorage(`user:${userId}`, null, {
    lazyFields: ["posts", "comments", "followers"],
    chunkSize: 50,
  });

  // Load user data from API
  useEffect(() => {
    async function loadUserData() {
      const data = await api.getUserData(userId);
      setUserData(data);
    }

    if (!userData) {
      loadUserData();
    }
  }, [userId, userData, setUserData]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{userData.name}</h1>
      <p>{userData.bio}</p>

      {/* Posts will only be loaded when this component is rendered */}
      <PostsList posts={userData.posts} />

      {/* Comments will only be loaded when this component is rendered */}
      <CommentsList comments={userData.comments} />
    </div>
  );
}
```

```tsx
// With preloading
function ProductPageComponent({ productId }) {
  const [product, setProduct] = useLazyStorage(`product:${productId}`, null, {
    lazyFields: ["reviews", "relatedProducts", "specifications"],
    preloadFields: ["specifications"], // Preload specifications
  });

  // ...
}

// With compression
function DatasetComponent() {
  const [dataset, setDataset] = useLazyStorage("app:dataset", null, {
    lazyFields: ["items", "metadata"],
    compression: {
      mode: "aggressive",
      threshold: 512,
    },
  });

  // ...
}
```

## Integration with Form Components

```tsx
import { useJSONStorage } from "@brushy/localstorage";

function FormWithPersistence() {
  const [formData, setFormData, updateFormData] = useJSONStorage("form:draft", {
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.submitForm(formData);
    setFormData({ name: "", email: "", message: "" }); // Clear after submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Integration with State Management

```tsx
import { useJSONStorage } from "@brushy/localstorage";
import { createContext, useContext, ReactNode } from "react";

// Create context for global state
interface AppState {
  user: {
    id: string | null;
    name: string | null;
    isAuthenticated: boolean;
  };
  theme: "light" | "dark";
  language: string;
}

interface AppStateContextType {
  state: AppState;
  setState: (state: AppState) => void;
  updateState: (updates: Partial<AppState>) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined,
);

// State provider with persistence
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState, updateState] = useJSONStorage<AppState>("app:state", {
    user: {
      id: null,
      name: null,
      isAuthenticated: false,
    },
    theme: "light",
    language: "en-US",
  });

  return (
    <AppStateContext.Provider value={{ state, setState, updateState }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook to use global state
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

// Usage in components
function Header() {
  const { state, updateState } = useAppState();

  const toggleTheme = () => {
    updateState({ theme: state.theme === "light" ? "dark" : "light" });
  };

  return (
    <header className={`theme-${state.theme}`}>
      <h1>My App</h1>
      <button onClick={toggleTheme}>Toggle Theme</button>
      {state.user.isAuthenticated && <span>Hello, {state.user.name}</span>}
    </header>
  );
}
```

## Best Practices

1. **Use specific keys** to avoid collisions between different parts of the application.
2. **Define default values** to ensure your components always have valid data.
3. **Use generic typing** to ensure type safety during development.
4. **Prefer partial updates** with `useJSONStorage` to avoid unnecessarily overwriting data.
5. **Use `useLazyStorage` for large data** to improve application performance.
6. **Consider component lifecycle** when using storage hooks.

## Limitations

- The hooks depend on localStorage, which is only available in browser environments.
- Changes to localStorage from other tabs or windows are not automatically reflected in the hooks.
- localStorage has a storage limit (typically 5-10 MB, depending on the browser).

## Next Steps

- Explore the [LocalStorage](./localstorage.md), [JSONStorage](./json-storage.md), and [LazyStorage](./lazy-storage.md) classes to better understand the underlying implementation.
- Check out the [Advanced Examples](./advanced-examples.md) for more complex use cases.
- See the [Utilities](./utilities.md) to better understand data compression.
