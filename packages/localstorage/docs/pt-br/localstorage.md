# Classe LocalStorage

A classe `LocalStorage` é a base da biblioteca, fornecendo métodos para armazenar, recuperar e gerenciar dados no localStorage do navegador com recursos adicionais como TTL (time-to-live), compressão e eventos.

## Importação

```typescript
import { LocalStorage } from "@brushy/localstorage";
```

## Construtor

```typescript
constructor((prefix = "@brushy/storage:"));
```

Cria uma nova instância de `LocalStorage` com o prefixo especificado.

| Parâmetro | Tipo   | Padrão             | Descrição                                      |
| --------- | ------ | ------------------ | ---------------------------------------------- |
| prefix    | string | '@brushy/storage:' | Prefixo usado para todas as chaves armazenadas |

**Exemplo:**

```typescript
// Usando o prefixo padrão
const defaultStorage = new LocalStorage();

// Usando um prefixo personalizado
const appStorage = new LocalStorage("@myapp:");
```

## Métodos

### set

```typescript
set<T>(key: string, value: T, options?: StorageOptions): void
```

Armazena um valor no localStorage.

| Parâmetro | Tipo           | Descrição                          |
| --------- | -------------- | ---------------------------------- |
| key       | string         | Chave para armazenar o valor       |
| value     | T              | Valor a ser armazenado             |
| options   | StorageOptions | Opções de armazenamento (opcional) |

**Opções:**

```typescript
interface StorageOptions {
  ttl?: number; // Tempo de vida em milissegundos
  compress?: boolean; // Se deve comprimir o valor
}
```

**Exemplos:**

```typescript
// Armazenamento básico
storage.set("user", { name: "João", age: 30 });

// Com TTL (expira após 1 hora)
storage.set("session", { token: "abc123" }, { ttl: 3600000 });

// Com compressão
storage.set("largeData", bigObject, { compress: true });

// Com TTL e compressão
storage.set("temporaryData", bigObject, { ttl: 86400000, compress: true });
```

### get

```typescript
get<T>(key: string): T | null
```

Recupera um valor do localStorage.

| Parâmetro | Tipo   | Descrição                       |
| --------- | ------ | ------------------------------- |
| key       | string | Chave do valor a ser recuperado |

**Retorno:**

- O valor armazenado, ou `null` se a chave não existir ou o valor tiver expirado.

**Exemplos:**

```typescript
// Recuperar um valor
const user = storage.get("user");
if (user) {
  console.log(`Olá, ${user.name}!`);
}

// Com tipagem
interface User {
  name: string;
  age: number;
}
const typedUser = storage.get<User>("user");
if (typedUser) {
  console.log(`Olá, ${typedUser.name}! Você tem ${typedUser.age} anos.`);
}
```

### remove

```typescript
remove(key: string): void
```

Remove um valor do localStorage.

| Parâmetro | Tipo   | Descrição                     |
| --------- | ------ | ----------------------------- |
| key       | string | Chave do valor a ser removido |

**Exemplo:**

```typescript
// Remover um valor
storage.remove("user");
```

### has

```typescript
has(key: string): boolean
```

Verifica se uma chave existe no localStorage e não expirou.

| Parâmetro | Tipo   | Descrição              |
| --------- | ------ | ---------------------- |
| key       | string | Chave a ser verificada |

**Retorno:**

- `true` se a chave existir e não tiver expirado, `false` caso contrário.

**Exemplo:**

```typescript
// Verificar se uma chave existe
if (storage.has("user")) {
  console.log("Usuário encontrado!");
} else {
  console.log("Usuário não encontrado.");
}
```

### clear

```typescript
clear(): void
```

Remove todos os valores armazenados com o prefixo atual.

**Exemplo:**

```typescript
// Limpar todos os dados
storage.clear();
```

### getTTL

```typescript
getTTL(key: string): number | null
```

Obtém o tempo restante de vida (em milissegundos) de um valor armazenado.

| Parâmetro | Tipo   | Descrição      |
| --------- | ------ | -------------- |
| key       | string | Chave do valor |

**Retorno:**

- O tempo restante em milissegundos, ou `null` se a chave não existir ou não tiver TTL.

**Exemplo:**

```typescript
// Verificar TTL restante
const ttl = storage.getTTL("session");
if (ttl !== null) {
  console.log(`A sessão expira em ${ttl / 1000} segundos.`);
} else {
  console.log("A sessão não tem expiração ou não existe.");
}
```

### getSize

```typescript
getSize(key: string): number
```

Obtém o tamanho aproximado (em bytes) de um valor armazenado.

| Parâmetro | Tipo   | Descrição      |
| --------- | ------ | -------------- |
| key       | string | Chave do valor |

**Retorno:**

- O tamanho aproximado em bytes, ou `0` se a chave não existir.

**Exemplo:**

```typescript
// Verificar tamanho
const size = storage.getSize("largeData");
console.log(
  `Tamanho dos dados: ${size} bytes (${(size / 1024).toFixed(2)} KB)`,
);
```

### subscribe

```typescript
subscribe(key: string, listener: StorageEventListener): () => void
```

Assina alterações em uma chave específica.

| Parâmetro | Tipo                 | Descrição                          |
| --------- | -------------------- | ---------------------------------- |
| key       | string               | Chave a ser monitorada             |
| listener  | StorageEventListener | Função de callback para alterações |

**Tipo do Listener:**

```typescript
type StorageEventListener = (key: string, newValue: any, oldValue: any) => void;
```

**Retorno:**

- Uma função para cancelar a assinatura.

**Exemplo:**

```typescript
// Assinar alterações
const unsubscribe = storage.subscribe("user", (key, newValue, oldValue) => {
  console.log(`${key} mudou:`);
  console.log("Valor anterior:", oldValue);
  console.log("Novo valor:", newValue);
});

// Modificar o valor (acionará o listener)
storage.set("user", { name: "Maria", age: 28 });

// Cancelar a assinatura
unsubscribe();
```

## Tratamento de Erros

A classe `LocalStorage` lida com erros internamente e registra mensagens no console. Em ambientes sem suporte a localStorage, a biblioteca emite avisos apropriados.

```typescript
try {
  const value = storage.get("key");
  // Trabalhar com o valor
} catch (error) {
  console.error("Erro ao acessar o localStorage:", error);
}
```

## Limitações

- O localStorage tem um limite de armazenamento (geralmente 5-10 MB, dependendo do navegador).
- Apenas strings podem ser armazenadas nativamente, por isso a biblioteca serializa/desserializa automaticamente.
- O localStorage é síncrono e pode causar bloqueios se usado com grandes volumes de dados.

## Boas Práticas

1. **Use prefixos significativos** para evitar colisões com outras aplicações.
2. **Defina TTL** para dados temporários para evitar acúmulo de dados obsoletos.
3. **Use compressão** para dados grandes para otimizar o uso do espaço.
4. **Monitore o tamanho** dos dados armazenados para evitar atingir os limites do navegador.
5. **Trate erros** adequadamente, especialmente em ambientes onde o localStorage pode estar desativado.

## Exemplos Completos

### Gerenciamento de Sessão

```typescript
const sessionStorage = new LocalStorage("@myapp:session:");

// Login
function login(username, password) {
  // Simulação de autenticação
  const token = "token-" + Math.random().toString(36).substring(2);

  // Armazenar token com expiração de 1 hora
  sessionStorage.set("token", token, { ttl: 3600000 });

  return token;
}

// Verificar autenticação
function isAuthenticated() {
  return sessionStorage.has("token");
}

// Obter token
function getToken() {
  return sessionStorage.get("token");
}

// Logout
function logout() {
  sessionStorage.remove("token");
}
```

### Preferências do Usuário

```typescript
const prefsStorage = new LocalStorage("@myapp:prefs:");

// Salvar preferências
function savePreferences(prefs) {
  prefsStorage.set("userPrefs", prefs);
}

// Carregar preferências
function loadPreferences() {
  return (
    prefsStorage.get("userPrefs") || {
      theme: "light",
      fontSize: "medium",
      notifications: true,
    }
  );
}

// Atualizar uma preferência específica
function updatePreference(key, value) {
  const prefs = loadPreferences();
  prefs[key] = value;
  savePreferences(prefs);
}

// Monitorar mudanças
prefsStorage.subscribe("userPrefs", (key, newValue) => {
  // Atualizar a interface com as novas preferências
  applyTheme(newValue.theme);
  setFontSize(newValue.fontSize);
});
```

## Próximos Passos

- Explore a classe [JSONStorage](./json-storage.md) para manipulação específica de dados JSON.
- Conheça a classe [LazyStorage](./lazy-storage.md) para trabalhar com grandes conjuntos de dados.
- Veja os [Hooks React](./hooks-react.md) para integração com aplicações React.
