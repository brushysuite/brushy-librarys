# Documentação do @brushy/di

O `@brushy/di` é um sistema de injeção de dependências poderoso e flexível para aplicações JavaScript/TypeScript, com suporte especial para React.

## Índice

- [Documentação do @brushy/di](#documentação-do-uggydi)
  - [Índice](#índice)
  - [Introdução](#introdução)
  - [Instalação](#instalação)
  - [Conceitos Básicos](#conceitos-básicos)
  - [API de Referência](#api-de-referência)
    - [Container](#container)
    - [Hooks React](#hooks-react)
    - [Injeção de Componentes](#injeção-de-componentes)
    - [Funções Utilitárias](#funções-utilitárias)
    - [Utilitários para Servidor](#utilitários-para-servidor)
  - [Guias Avançados](#guias-avançados)
    - [Boas Práticas](#boas-práticas)
  - [Exemplos](#exemplos)

## Introdução

O `@brushy/di` foi projetado para facilitar a gestão de dependências em aplicações modernas, permitindo:

- Injeção de dependências com tipagem forte
- Gerenciamento de ciclo de vida de instâncias (singleton, transient, scoped)
- Suporte a componentes React
- Resolução assíncrona de dependências
- Monitoramento e observabilidade
- Cache inteligente de promessas

## Instalação

```bash
npm install @brushy/di
# ou
yarn add @brushy/di
# ou
pnpm add @brushy/di
```

## Conceitos Básicos

O sistema de DI (Dependency Injection) é baseado em alguns conceitos fundamentais:

- **Container**: Armazena e gerencia as dependências
- **Token**: Identificador único para cada dependência
- **Provider**: Configuração que define como uma dependência deve ser criada
- **Lifecycle**: Define o ciclo de vida de uma instância (singleton, transient, scoped)

## API de Referência

### [Container](./container.md)

O Container é o componente central do sistema de injeção de dependências. Ele é responsável por registrar, resolver e gerenciar o ciclo de vida das dependências.

### [Hooks React](./react-hooks.md)

Hooks React para facilitar a injeção de dependências em componentes funcionais, incluindo `useInject` e `useLazyInject`.

### [Injeção de Componentes](./component-injection.md)

Funcionalidades específicas para injeção de componentes React, permitindo a criação de sistemas de UI modulares e extensíveis.

### [Funções Utilitárias](./utilities.md)

Funções utilitárias para facilitar o uso do sistema de injeção de dependências em diferentes contextos.

### [Utilitários para Servidor](./server.md)

Utilitários específicos para gerenciar a injeção de dependências no lado do servidor, especialmente útil em aplicações Node.js e frameworks como Next.js, Express, NestJS, etc.

## Guias Avançados

### [Boas Práticas](./best-practices.md)

Guia de boas práticas para utilizar o `@brushy/di` de forma eficiente e organizada.

## Exemplos

Confira os exemplos completos em cada seção da documentação para ver como utilizar o `@brushy/di` em diferentes cenários.
Consulte os guias específicos para mais detalhes sobre cada conceito.
