# Classe JSONStorage

A classe `JSONStorage` estende a classe `LocalStorage` e fornece métodos específicos para trabalhar com dados JSON, incluindo operações de atualização parcial, mesclagem de arrays e validação de esquemas.

## Importação

```typescript
import { JSONStorage } from "@brushy/localstorage";
```

## Construtor

```typescript
constructor((prefix = "@brushy/json:"));
```

Cria uma nova instância de `JSONStorage` com o prefixo especificado.

| Parâmetro | Tipo   | Padrão          | Descrição                                      |
| --------- | ------ | --------------- | ---------------------------------------------- |
| prefix    | string | '@brushy/json:' | Prefixo usado para todas as chaves armazenadas |

**Exemplo:**

```typescript
// Usando o prefixo padrão
const defaultJsonStorage = new JSONStorage();

// Usando um prefixo personalizado
const appJsonStorage = new JSONStorage("@myapp:json:");
```

## Métodos

### setJSON

```typescript
setJSON<T>(key: string, value: T, options?: JSONStorageOptions): void
```

Armazena um valor JSON no localStorage.

| Parâmetro | Tipo               | Descrição                          |
| --------- | ------------------ | ---------------------------------- |
| key       | string             | Chave para armazenar o valor       |
| value     | T                  | Valor a ser armazenado             |
| options   | JSONStorageOptions | Opções de armazenamento (opcional) |

**Opções:**

```typescript
interface JSONStorageOptions extends StorageOptions {
  // Herda ttl e compress de StorageOptions
}
```

**Exemplos:**

```typescript
// Armazenamento básico
jsonStorage.setJSON("config", { theme: "dark", fontSize: 16 });

// Com TTL (expira após 1 dia)
jsonStorage.setJSON("userPrefs", { notifications: true }, { ttl: 86400000 });

// Com compressão
jsonStorage.setJSON("largeConfig", complexObject, { compress: true });
```

### getJSON

```typescript
getJSON<T>(key: string): T | null
```

Recupera um valor JSON do localStorage.

| Parâmetro | Tipo   | Descrição                       |
| --------- | ------ | ------------------------------- |
| key       | string | Chave do valor a ser recuperado |

**Retorno:**

- O valor JSON armazenado, ou `null` se a chave não existir, o valor tiver expirado ou não for um JSON válido.

**Exemplos:**

```typescript
// Recuperar um valor
const config = jsonStorage.getJSON("config");
if (config) {
  console.log(`Tema: ${config.theme}, Tamanho da fonte: ${config.fontSize}`);
}

// Com tipagem
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

Atualiza parcialmente um valor JSON existente, mesclando as atualizações com o valor atual.

| Parâmetro | Tipo       | Descrição                                      |
| --------- | ---------- | ---------------------------------------------- |
| key       | string     | Chave do valor a ser atualizado                |
| updates   | Partial<T> | Objeto com as propriedades a serem atualizadas |

**Retorno:**

- O valor JSON atualizado, ou `null` se a chave não existir ou ocorrer um erro.

**Exemplos:**

```typescript
// Atualizar parcialmente um objeto
jsonStorage.setJSON("config", {
  theme: "light",
  fontSize: 14,
  notifications: true,
});

// Atualizar apenas o tema e o tamanho da fonte
const updatedConfig = jsonStorage.updateJSON("config", {
  theme: "dark",
  fontSize: 16,
});
// Resultado: { theme: 'dark', fontSize: 16, notifications: true }

// Com tipagem
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

Mescla um array com um array existente, removendo duplicatas.

| Parâmetro | Tipo   | Descrição                                     |
| --------- | ------ | --------------------------------------------- |
| key       | string | Chave do array a ser mesclado                 |
| items     | T[]    | Itens a serem mesclados com o array existente |

**Retorno:**

- O array mesclado, ou `null` se a chave não existir ou ocorrer um erro.

**Exemplos:**

```typescript
// Criar um array inicial
jsonStorage.setJSON("tags", ["javascript", "typescript"]);

// Mesclar com novos itens
const mergedTags = jsonStorage.mergeArrays("tags", ["react", "typescript"]);
// Resultado: ['javascript', 'typescript', 'react']

// Mesclar com mais itens
jsonStorage.mergeArrays("tags", ["node", "express"]);
// Resultado: ['javascript', 'typescript', 'react', 'node', 'express']

// Com tipagem
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

Verifica se uma string é um JSON válido.

| Parâmetro | Tipo   | Descrição             |
| --------- | ------ | --------------------- |
| value     | string | String a ser validada |

**Retorno:**

- `true` se a string for um JSON válido, `false` caso contrário.

**Exemplos:**

```typescript
// Verificar se uma string é um JSON válido
const validJson = '{"name":"João","age":30}';
const invalidJson = '{name:"João",age:30}';

console.log(jsonStorage.isValidJSON(validJson)); // true
console.log(jsonStorage.isValidJSON(invalidJson)); // false

// Uso prático
function processUserInput(input: string) {
  if (jsonStorage.isValidJSON(input)) {
    const data = JSON.parse(input);
    jsonStorage.setJSON("userInput", data);
  } else {
    console.error("Entrada inválida. Forneça um JSON válido.");
  }
}
```

### getJSONSchema

```typescript
getJSONSchema(key: string): object | null
```

Gera um esquema JSON simplificado para o valor armazenado.

| Parâmetro | Tipo   | Descrição      |
| --------- | ------ | -------------- |
| key       | string | Chave do valor |

**Retorno:**

- Um objeto representando o esquema do valor, ou `null` se a chave não existir ou ocorrer um erro.

**Exemplos:**

```typescript
// Armazenar um objeto complexo
jsonStorage.setJSON("user", {
  name: "Maria",
  age: 28,
  address: {
    street: "Rua Principal",
    number: 123,
    city: "São Paulo",
  },
  hobbies: ["leitura", "natação"],
});

// Obter o esquema
const schema = jsonStorage.getJSONSchema("user");
/* Resultado aproximado:
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

## Herança de LocalStorage

A classe `JSONStorage` herda todos os métodos da classe `LocalStorage`, incluindo:

- `set<T>(key: string, value: T, options?: StorageOptions): void`
- `get<T>(key: string): T | null`
- `remove(key: string): void`
- `has(key: string): boolean`
- `clear(): void`
- `getTTL(key: string): number | null`
- `getSize(key: string): number`
- `subscribe(key: string, listener: StorageEventListener): () => void`

Consulte a [documentação da classe LocalStorage](./localstorage.md) para mais detalhes sobre esses métodos.

## Tratamento de Erros

A classe `JSONStorage` lida com erros internamente e registra mensagens no console.

```typescript
try {
  const data = jsonStorage.getJSON("key");
  // Trabalhar com os dados
} catch (error) {
  console.error("Erro ao acessar dados JSON:", error);
}
```

## Boas Práticas

1. **Use `updateJSON` em vez de `setJSON`** para atualizações parciais, para evitar sobrescrever dados existentes.
2. **Use `mergeArrays` para coleções** para manter a integridade dos dados e evitar duplicatas.
3. **Verifique o esquema** com `getJSONSchema` para entender a estrutura dos dados armazenados.
4. **Valide entradas externas** com `isValidJSON` antes de processá-las.
5. **Use tipagem genérica** para garantir a segurança de tipos em tempo de desenvolvimento.

## Exemplos Completos

### Gerenciamento de Configurações

```typescript
const configStorage = new JSONStorage("@myapp:config:");

// Configuração padrão
const defaultConfig = {
  theme: "light",
  fontSize: 14,
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  language: "pt-BR",
};

// Inicializar configuração
function initConfig() {
  if (!configStorage.has("app")) {
    configStorage.setJSON("app", defaultConfig);
  }
  return configStorage.getJSON("app");
}

// Obter configuração
function getConfig() {
  return configStorage.getJSON("app") || defaultConfig;
}

// Atualizar configuração
function updateConfig(updates) {
  return configStorage.updateJSON("app", updates);
}

// Resetar para padrão
function resetConfig() {
  configStorage.setJSON("app", defaultConfig);
  return defaultConfig;
}

// Uso
const config = initConfig();
updateConfig({ theme: "dark" });
updateConfig({ notifications: { push: false } });
```

### Gerenciamento de Tags

```typescript
const tagsStorage = new JSONStorage("@myapp:tags:");

// Adicionar tags
function addTags(newTags: string[]) {
  // Se não existir, cria um array vazio
  if (!tagsStorage.has("userTags")) {
    tagsStorage.setJSON("userTags", []);
  }

  // Mescla com as tags existentes
  return tagsStorage.mergeArrays("userTags", newTags);
}

// Remover uma tag
function removeTag(tag: string) {
  const tags = tagsStorage.getJSON<string[]>("userTags");
  if (!tags) return null;

  const updatedTags = tags.filter((t) => t !== tag);
  tagsStorage.setJSON("userTags", updatedTags);

  return updatedTags;
}

// Obter todas as tags
function getAllTags() {
  return tagsStorage.getJSON<string[]>("userTags") || [];
}

// Uso
addTags(["javascript", "react"]);
addTags(["typescript", "node"]);
removeTag("react");
console.log(getAllTags()); // ['javascript', 'typescript', 'node']
```

## Próximos Passos

- Explore a classe [LazyStorage](./lazy-storage.md) para trabalhar com grandes conjuntos de dados.
- Veja os [Hooks React](./hooks-react.md) para integração com aplicações React.
- Consulte os [Exemplos Avançados](./exemplos-avancados.md) para casos de uso mais complexos.
