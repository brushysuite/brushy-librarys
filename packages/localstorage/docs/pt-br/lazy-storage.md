# Classe LazyStorage

A classe `LazyStorage` estende a classe `JSONStorage` e fornece suporte para carregamento preguiçoso (lazy loading) de campos grandes em objetos, permitindo armazenar e recuperar eficientemente grandes conjuntos de dados sem sobrecarregar o localStorage ou a memória.

## Importação

```typescript
import { LazyStorage } from "@brushy/localstorage";
```

## Construtor

```typescript
constructor((prefix = "@brushy/lazy:"));
```

Cria uma nova instância de `LazyStorage` com o prefixo especificado.

| Parâmetro | Tipo   | Padrão          | Descrição                                      |
| --------- | ------ | --------------- | ---------------------------------------------- |
| prefix    | string | '@brushy/lazy:' | Prefixo usado para todas as chaves armazenadas |

**Exemplo:**

```typescript
// Usando o prefixo padrão
const defaultLazyStorage = new LazyStorage();

// Usando um prefixo personalizado
const appLazyStorage = new LazyStorage("@myapp:lazy:");
```

## Métodos

### setLazy

```typescript
setLazy<T extends object>(key: string, value: T, options?: LazyStorageOptions): void
```

Armazena um objeto com suporte a campos preguiçosos.

| Parâmetro | Tipo               | Descrição                          |
| --------- | ------------------ | ---------------------------------- |
| key       | string             | Chave para armazenar o valor       |
| value     | T                  | Objeto a ser armazenado            |
| options   | LazyStorageOptions | Opções de armazenamento (opcional) |

**Opções:**

```typescript
interface LazyStorageOptions extends JSONStorageOptions {
  lazyFields?: string[]; // Campos a serem carregados preguiçosamente
  chunkSize?: number; // Tamanho dos chunks para arrays grandes
  compression?: CompressionOptions; // Opções de compressão
  preloadFields?: string[]; // Campos a serem pré-carregados
}
```

**Exemplos:**

```typescript
// Objeto com campos grandes
const userData = {
  id: 123,
  name: "João",
  email: "joao@exemplo.com",
  posts: Array(1000)
    .fill()
    .map((_, i) => ({
      id: i,
      title: `Post ${i}`,
      content: `Conteúdo do post ${i}...`,
    })),
  comments: Array(500)
    .fill()
    .map((_, i) => ({
      id: i,
      text: `Comentário ${i}`,
    })),
};

// Armazenamento básico com campos preguiçosos
lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "comments"], // Estes campos serão carregados sob demanda
});

// Com tamanho de chunk personalizado
lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "comments"],
  chunkSize: 200, // Chunks maiores (padrão é 50)
});

// Com compressão
lazyStorage.setLazy("user", userData, {
  lazyFields: ["posts", "comments"],
  compression: {
    mode: "aggressive", // Modo de compressão: 'auto' ou 'aggressive'
    threshold: 512, // Limiar em bytes para compressão
  },
});
```

### getLazy

```typescript
getLazy<T extends object>(key: string, options?: LazyStorageOptions): T | null
```

Recupera um objeto com suporte a carregamento preguiçoso.

| Parâmetro | Tipo               | Descrição                        |
| --------- | ------------------ | -------------------------------- |
| key       | string             | Chave do objeto a ser recuperado |
| options   | LazyStorageOptions | Opções de recuperação (opcional) |

**Retorno:**

- O objeto armazenado com suporte a carregamento preguiçoso, ou `null` se a chave não existir ou ocorrer um erro.

**Exemplos:**

```typescript
// Recuperar um objeto com campos preguiçosos
const user = lazyStorage.getLazy("user");

// Os campos normais são acessados diretamente
console.log(user.id); // 123
console.log(user.name); // 'João'

// Os campos preguiçosos são carregados apenas quando acessados
console.log(user.posts.length); // 1000 (carrega os posts sob demanda)
console.log(user.posts[0].title); // 'Post 0'

// Com pré-carregamento de campos específicos
const userWithPreload = lazyStorage.getLazy("user", {
  preloadFields: ["comments"], // Pré-carrega os comentários
});

// Com tipagem
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
  console.log(`Usuário: ${typedUser.name}`);
  console.log(`Número de posts: ${typedUser.posts.length}`);
}
```

### preload

```typescript
preload(key: string, fields: string[]): void
```

Pré-carrega campos preguiçosos específicos.

| Parâmetro | Tipo     | Descrição                     |
| --------- | -------- | ----------------------------- |
| key       | string   | Chave do objeto               |
| fields    | string[] | Campos a serem pré-carregados |

**Exemplos:**

```typescript
// Pré-carregar campos específicos
lazyStorage.preload("user", ["posts"]);

// Pré-carregar múltiplos campos
lazyStorage.preload("user", ["posts", "comments"]);

// Uso prático: pré-carregar dados antes de exibir uma página
function loadUserProfile(userId) {
  // Pré-carregar os campos que serão exibidos na página
  lazyStorage.preload(`user:${userId}`, ["posts", "followers"]);

  // Recuperar o usuário (os campos já estarão em cache)
  return lazyStorage.getLazy(`user:${userId}`);
}
```

### clearCache

```typescript
clearCache(): void
```

Limpa o cache interno de campos preguiçosos.

**Exemplos:**

```typescript
// Limpar o cache
lazyStorage.clearCache();

// Uso prático: limpar o cache após operações intensivas
function processLargeDataset() {
  const data = lazyStorage.getLazy("largeDataset");

  // Processar os dados...

  // Limpar o cache para liberar memória
  lazyStorage.clearCache();
}
```

## Herança de JSONStorage e LocalStorage

A classe `LazyStorage` herda todos os métodos das classes `JSONStorage` e `LocalStorage`, incluindo:

### De JSONStorage:

- `setJSON<T>(key: string, value: T, options?: JSONStorageOptions): void`
- `getJSON<T>(key: string): T | null`
- `updateJSON<T extends object>(key: string, updates: Partial<T>): T | null`
- `mergeArrays<T>(key: string, items: T[]): T[] | null`
- `isValidJSON(value: string): boolean`
- `getJSONSchema(key: string): object | null`

### De LocalStorage:

- `set<T>(key: string, value: T, options?: StorageOptions): void`
- `get<T>(key: string): T | null`
- `remove(key: string): void`
- `has(key: string): boolean`
- `clear(): void`
- `getTTL(key: string): number | null`
- `getSize(key: string): number`
- `subscribe(key: string, listener: StorageEventListener): () => void`

Consulte a [documentação da classe JSONStorage](./json-storage.md) e [documentação da classe LocalStorage](./localstorage.md) para mais detalhes sobre esses métodos.

## Como Funciona o Carregamento Preguiçoso

A classe `LazyStorage` utiliza proxies JavaScript para interceptar o acesso a propriedades e carregar dados sob demanda:

1. Quando você armazena um objeto com `setLazy`, os campos marcados como preguiçosos são extraídos e armazenados separadamente.
2. Para arrays grandes, os dados são divididos em chunks menores para otimizar o armazenamento.
3. Quando você recupera o objeto com `getLazy`, um proxy é criado para interceptar o acesso às propriedades.
4. Quando um campo preguiçoso é acessado pela primeira vez, os dados são carregados do localStorage e armazenados em cache.
5. Acessos subsequentes ao mesmo campo usam os dados em cache, evitando acessos adicionais ao localStorage.

## Boas Práticas

1. **Identifique campos grandes** que são bons candidatos para carregamento preguiçoso (arrays, objetos aninhados, etc.).
2. **Ajuste o tamanho dos chunks** com base no tamanho típico dos seus dados.
3. **Use pré-carregamento** para campos que provavelmente serão acessados juntos.
4. **Limpe o cache** após operações intensivas para liberar memória.
5. **Combine com compressão** para dados muito grandes.

## Exemplos Completos

### Gerenciamento de Catálogo de Produtos

```typescript
const productStorage = new LazyStorage("@myapp:products:");

// Armazenar catálogo de produtos
function storeCatalog(catalog) {
  productStorage.setLazy("catalog", catalog, {
    lazyFields: ["items", "categories", "reviews"],
    chunkSize: 100,
    compression: { mode: "auto", threshold: 1024 },
  });
}

// Recuperar catálogo
function getCatalog() {
  return productStorage.getLazy("catalog");
}

// Pré-carregar categorias (para menu de navegação)
function preloadCategories() {
  productStorage.preload("catalog", ["categories"]);
}

// Pré-carregar produtos de uma categoria específica
function preloadCategoryProducts(categoryId) {
  // Supondo que os produtos estão organizados por categoria
  productStorage.preload("catalog", [`items.${categoryId}`]);
}

// Uso
const catalog = {
  metadata: { lastUpdated: new Date(), version: "1.0" },
  categories: Array(50)
    .fill()
    .map((_, i) => ({
      id: i,
      name: `Categoria ${i}`,
    })),
  items: Array(10000)
    .fill()
    .map((_, i) => ({
      id: i,
      name: `Produto ${i}`,
      price: Math.random() * 1000,
      description: `Descrição detalhada do produto ${i}...`,
      categoryId: Math.floor(Math.random() * 50),
    })),
  reviews: Array(5000)
    .fill()
    .map((_, i) => ({
      id: i,
      productId: Math.floor(Math.random() * 10000),
      rating: Math.floor(Math.random() * 5) + 1,
      text: `Avaliação do produto...`,
    })),
};

storeCatalog(catalog);
preloadCategories();

// Acessar o catálogo
const loadedCatalog = getCatalog();
console.log(`Número de categorias: ${loadedCatalog.categories.length}`);
console.log(`Primeira categoria: ${loadedCatalog.categories[0].name}`);

// Os produtos só serão carregados quando acessados
console.log(`Número de produtos: ${loadedCatalog.items.length}`);
```

### Gerenciamento de Feed de Notícias

```typescript
const feedStorage = new LazyStorage("@myapp:feed:");

// Armazenar feed de notícias
function storeFeed(feed) {
  feedStorage.setLazy("newsFeed", feed, {
    lazyFields: ["articles", "comments", "media"],
    chunkSize: 20, // Chunks menores para carregamento mais rápido
  });
}

// Recuperar feed
function getFeed() {
  return feedStorage.getLazy("newsFeed", {
    preloadFields: ["articles"], // Pré-carregar artigos
  });
}

// Carregar comentários para um artigo específico
function loadCommentsForArticle(articleId) {
  const feed = getFeed();
  // Acessar os comentários acionará o carregamento preguiçoso
  return feed.comments.filter((comment) => comment.articleId === articleId);
}

// Limpar cache após navegação
function navigateAway() {
  feedStorage.clearCache();
}

// Uso
const newsFeed = {
  metadata: { lastUpdated: new Date() },
  articles: Array(100)
    .fill()
    .map((_, i) => ({
      id: i,
      title: `Notícia ${i}`,
      summary: `Resumo da notícia ${i}...`,
      content: `Conteúdo completo da notícia ${i}...`.repeat(50),
    })),
  comments: Array(1000)
    .fill()
    .map((_, i) => ({
      id: i,
      articleId: Math.floor(Math.random() * 100),
      author: `Usuário ${i % 50}`,
      text: `Comentário sobre a notícia...`,
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

// Exibir artigos (já pré-carregados)
console.log(`Número de artigos: ${feed.articles.length}`);

// Carregar comentários para o primeiro artigo
const commentsForArticle0 = loadCommentsForArticle(0);
console.log(`Comentários para o artigo 0: ${commentsForArticle0.length}`);

// Limpar cache ao navegar para outra página
navigateAway();
```

## Próximos Passos

- Veja os [Hooks React](./hooks-react.md) para integração com aplicações React, incluindo o hook `useLazyStorage`.
- Consulte os [Exemplos Avançados](./exemplos-avancados.md) para casos de uso mais complexos.
- Explore os [Utilitários](./utilitarios.md) para entender melhor a compressão de dados.
