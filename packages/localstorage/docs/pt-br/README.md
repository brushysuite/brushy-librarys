# Documentação @brushy/localstorage

Bem-vindo à documentação detalhada da biblioteca @brushy/localstorage. Esta documentação fornece informações completas sobre todas as classes, métodos e hooks disponíveis na biblioteca.

## Índice

- [Conceitos Básicos](./conceitos-basicos.md)
- [Benefícios e Cenários de Uso](./beneficios-e-cenarios.md)
- [Classes Principais](#classes-principais)
  - [LocalStorage](./localstorage.md)
  - [JSONStorage](./json-storage.md)
  - [LazyStorage](./lazy-storage.md)
- [Hooks React](./hooks-react.md)
- [Utilitários](./utilitarios.md)
- [Exemplos Avançados](./exemplos-avancados.md)
- [Migração e Compatibilidade](./migracao.md)
- [FAQ](./faq.md)

## Classes Principais

### LocalStorage

A classe base para armazenamento local com suporte a TTL, compressão e eventos.

```typescript
import { LocalStorage } from "@brushy/localstorage";

const storage = new LocalStorage("@myapp:");
storage.set("key", value, options);
const value = storage.get("key");
```

[Documentação completa da classe LocalStorage](./localstorage.md)

### JSONStorage

Estende a classe LocalStorage com métodos específicos para manipulação de dados JSON.

```typescript
import { JSONStorage } from "@brushy/localstorage";

const jsonStorage = new JSONStorage("@myapp:json:");
jsonStorage.setJSON("config", { theme: "dark" });
jsonStorage.updateJSON("config", { fontSize: 16 });
```

[Documentação completa da classe JSONStorage](./json-storage.md)

### LazyStorage

Estende a classe JSONStorage com suporte a carregamento preguiçoso de campos grandes.

```typescript
import { LazyStorage } from "@brushy/localstorage";

const lazyStorage = new LazyStorage("@myapp:lazy:");
lazyStorage.setLazy("user", userData, { lazyFields: ["posts"] });
const user = lazyStorage.getLazy("user");
```

[Documentação completa da classe LazyStorage](./lazy-storage.md)

## Hooks React

Para uso em aplicações React, a biblioteca fornece hooks que facilitam o uso do armazenamento local.

```typescript
import {
  useStorage,
  useJSONStorage,
  useLazyStorage,
} from "@brushy/localstorage/react";

// Hooks básicos
const [value, setValue, removeValue] = useStorage("key", defaultValue);

// Hooks para JSON
const [data, setData, updateData] = useJSONStorage("key", defaultValue);

// Hooks para lazy loading
const [lazyData, setLazyData] = useLazyStorage("key", defaultValue, options);
```

[Documentação completa dos Hooks React](./hooks-react.md)

## Utilitários

A biblioteca inclui utilitários para compressão, serialização e manipulação de dados.

```typescript
import { TypedCompression } from "@brushy/localstorage";

const compressed = TypedCompression.compressData(data);
const decompressed = TypedCompression.decompressData(compressed);
```

[Documentação completa dos Utilitários](./utilitarios.md)

## Exemplos Avançados

Para casos de uso mais complexos, consulte os exemplos avançados:

- [Gerenciamento de Estado Global](./exemplos-avancados.md#gerenciamento-de-estado-global)
- [Sincronização entre Abas](./exemplos-avancados.md#sincronização-entre-abas)
- [Persistência Offline](./exemplos-avancados.md#persistência-offline)
- [Caching de API](./exemplos-avancados.md#caching-de-api)

[Ver todos os exemplos avançados](./exemplos-avancados.md)

## Migração e Compatibilidade

Informações sobre migração de versões anteriores e compatibilidade com diferentes ambientes.

[Guia de Migração e Compatibilidade](./migracao.md)

## FAQ

Respostas para perguntas frequentes sobre a biblioteca.

[Perguntas Frequentes](./faq.md)
