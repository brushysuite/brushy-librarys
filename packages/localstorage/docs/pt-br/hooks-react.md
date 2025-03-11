# Hooks React

A biblioteca `@brushy/localstorage` fornece hooks React para facilitar o uso do armazenamento local em aplicações React. Esses hooks permitem que você use o localStorage de forma declarativa, com suporte a tipagem, atualizações automáticas e integração com o ciclo de vida dos componentes.

## Importação

```typescript
import {
  useStorage,
  useJSONStorage,
  useLazyStorage,
} from "@brushy/localstorage/react";
```

## useStorage

```typescript
function useStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions,
): [T, (value: T) => void, () => void];
```

Hook básico para armazenamento local, com suporte a qualquer tipo de dados.

| Parâmetro    | Tipo           | Descrição                           |
| ------------ | -------------- | ----------------------------------- |
| key          | string         | Chave para armazenar o valor        |
| defaultValue | T              | Valor padrão se a chave não existir |
| options      | StorageOptions | Opções de armazenamento (opcional)  |

**Retorno:**

- Um array com três elementos:
  1. O valor armazenado (ou o valor padrão se a chave não existir)
  2. Uma função para atualizar o valor
  3. Uma função para remover o valor

**Exemplos:**

```tsx
import { useStorage } from "@brushy/localstorage/react";

function AuthComponent() {
  // Armazenamento básico
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
          <p>Autenticado com token: {token}</p>
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
// Com TTL (expiração)
function SessionComponent() {
  const [session, setSession] = useStorage("user:session", null, {
    ttl: 3600000, // 1 hora
  });

  // ...
}

// Com compressão
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

Hook para armazenamento de dados JSON, com suporte a atualizações parciais.

| Parâmetro    | Tipo               | Descrição                           |
| ------------ | ------------------ | ----------------------------------- |
| key          | string             | Chave para armazenar o valor        |
| defaultValue | T                  | Valor padrão se a chave não existir |
| options      | JSONStorageOptions | Opções de armazenamento (opcional)  |

**Retorno:**

- Um array com três elementos:
  1. O valor armazenado (ou o valor padrão se a chave não existir)
  2. Uma função para substituir o valor
  3. Uma função para atualizar parcialmente o valor

**Exemplos:**

```tsx
import { useJSONStorage } from "@brushy/localstorage/react";

function SettingsComponent() {
  // Configurações com valor padrão
  const [settings, setSettings, updateSettings] = useJSONStorage(
    "app:settings",
    {
      theme: "light",
      fontSize: 14,
      notifications: true,
    },
  );

  const toggleTheme = () => {
    // Atualização parcial (apenas o tema)
    updateSettings({ theme: settings.theme === "light" ? "dark" : "light" });
  };

  const increaseFontSize = () => {
    // Atualização parcial (apenas o tamanho da fonte)
    updateSettings({ fontSize: settings.fontSize + 2 });
  };

  const resetSettings = () => {
    // Substituição completa
    setSettings({
      theme: "light",
      fontSize: 14,
      notifications: true,
    });
  };

  return (
    <div className={`theme-${settings.theme}`}>
      <h1 style={{ fontSize: settings.fontSize }}>Configurações</h1>
      <button onClick={toggleTheme}>
        Alternar para tema {settings.theme === "light" ? "escuro" : "claro"}
      </button>
      <button onClick={increaseFontSize}>Aumentar fonte</button>
      <button onClick={resetSettings}>Resetar</button>
    </div>
  );
}
```

```tsx
// Com tipagem
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
      language: "pt-BR",
      notifications: {
        email: true,
        push: true,
      },
    },
  );

  // Atualização parcial com tipagem
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

Hook para armazenamento com carregamento preguiçoso, ideal para grandes conjuntos de dados.

| Parâmetro    | Tipo               | Descrição                           |
| ------------ | ------------------ | ----------------------------------- |
| key          | string             | Chave para armazenar o valor        |
| defaultValue | T \| null          | Valor padrão se a chave não existir |
| options      | LazyStorageOptions | Opções de armazenamento (opcional)  |

**Retorno:**

- Um array com dois elementos:
  1. O valor armazenado com suporte a carregamento preguiçoso (ou o valor padrão se a chave não existir)
  2. Uma função para atualizar o valor

**Exemplos:**

```tsx
import { useLazyStorage } from "@brushy/localstorage/react";

function UserProfileComponent({ userId }) {
  // Dados do usuário com campos preguiçosos
  const [userData, setUserData] = useLazyStorage(`user:${userId}`, null, {
    lazyFields: ["posts", "comments", "followers"],
    chunkSize: 50,
  });

  // Carregar dados do usuário da API
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
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1>{userData.name}</h1>
      <p>{userData.bio}</p>

      {/* Os posts só serão carregados quando este componente for renderizado */}
      <PostsList posts={userData.posts} />

      {/* Os comentários só serão carregados quando este componente for renderizado */}
      <CommentsList comments={userData.comments} />
    </div>
  );
}
```

```tsx
// Com pré-carregamento
function ProductPageComponent({ productId }) {
  const [product, setProduct] = useLazyStorage(`product:${productId}`, null, {
    lazyFields: ["reviews", "relatedProducts", "specifications"],
    preloadFields: ["specifications"], // Pré-carregar especificações
  });

  // ...
}

// Com compressão
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

## Integração com Componentes de Formulário

```tsx
import { useJSONStorage } from "@brushy/localstorage/react";

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
    setFormData({ name: "", email: "", message: "" }); // Limpar após envio
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Nome:</label>
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
        <label htmlFor="message">Mensagem:</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Enviar</button>
    </form>
  );
}
```

## Integração com Gerenciamento de Estado

```tsx
import { useJSONStorage } from "@brushy/localstorage/react";
import { createContext, useContext, ReactNode } from "react";

// Criar contexto para o estado global
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

// Provedor de estado com persistência
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState, updateState] = useJSONStorage<AppState>("app:state", {
    user: {
      id: null,
      name: null,
      isAuthenticated: false,
    },
    theme: "light",
    language: "pt-BR",
  });

  return (
    <AppStateContext.Provider value={{ state, setState, updateState }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook para usar o estado global
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState deve ser usado dentro de um AppStateProvider");
  }
  return context;
}

// Uso em componentes
function Header() {
  const { state, updateState } = useAppState();

  const toggleTheme = () => {
    updateState({ theme: state.theme === "light" ? "dark" : "light" });
  };

  return (
    <header className={`theme-${state.theme}`}>
      <h1>Meu App</h1>
      <button onClick={toggleTheme}>Alternar Tema</button>
      {state.user.isAuthenticated && <span>Olá, {state.user.name}</span>}
    </header>
  );
}
```

## Boas Práticas

1. **Use chaves específicas** para evitar colisões entre diferentes partes da aplicação.
2. **Defina valores padrão** para garantir que seus componentes sempre tenham dados válidos.
3. **Use tipagem genérica** para garantir a segurança de tipos em tempo de desenvolvimento.
4. **Prefira atualizações parciais** com `useJSONStorage` para evitar sobrescrever dados desnecessariamente.
5. **Use `useLazyStorage` para dados grandes** para melhorar o desempenho da aplicação.
6. **Considere o ciclo de vida dos componentes** ao usar hooks de armazenamento.

## Limitações

- Os hooks dependem do localStorage, que está disponível apenas em ambientes de navegador.
- Mudanças no localStorage de outras abas ou janelas não são automaticamente refletidas nos hooks.
- O localStorage tem um limite de armazenamento (geralmente 5-10 MB, dependendo do navegador).

## Próximos Passos

- Explore as classes [LocalStorage](./localstorage.md), [JSONStorage](./json-storage.md) e [LazyStorage](./lazy-storage.md) para entender melhor a implementação subjacente.
- Consulte os [Exemplos Avançados](./exemplos-avancados.md) para casos de uso mais complexos.
- Veja os [Utilitários](./utilitarios.md) para entender melhor a compressão de dados.
