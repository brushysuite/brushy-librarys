# @brushy/di Documentation

`@brushy/di` is a powerful and flexible dependency injection system for JavaScript/TypeScript applications, with special support for React.

## Table of Contents

- [@brushy/di Documentation](#brushydi-documentation)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Basic Concepts](#basic-concepts)
  - [API Reference](#api-reference)
    - [Container](#container)
    - [React Hooks](#react-hooks)
    - [Component Injection](#component-injection)
    - [Utility Functions](#utility-functions)
    - [Server Utilities](#server-utilities)
  - [Advanced Guides](#advanced-guides)
    - [Best Practices](#best-practices)
  - [Examples](#examples)

## Introduction

`@brushy/di` is designed to facilitate dependency management in modern applications, enabling:

- Strongly typed dependency injection
- Instance lifecycle management (singleton, transient, scoped)
- React component support
- Asynchronous dependency resolution
- Monitoring and observability
- Smart promise caching

## Installation

```bash
npm install @brushy/di
# or
yarn add @brushy/di
# or
pnpm add @brushy/di
```

## Basic Concepts

The DI (Dependency Injection) system is based on some fundamental concepts:

- **Container**: Stores and manages dependencies
- **Token**: Unique identifier for each dependency
- **Provider**: Configuration that defines how a dependency should be created
- **Lifecycle**: Defines the lifecycle of an instance (singleton, transient, scoped)

## API Reference

### [Container](./container.md)

The Container is the central component of the dependency injection system. It is responsible for registering, resolving, and managing the lifecycle of dependencies.

### [React Hooks](./react-hooks.md)

React hooks to facilitate dependency injection in functional components, including `useInject` and `useLazyInject`.

### [Component Injection](./component-injection.md)

Specific functionalities for React component injection, enabling the creation of modular and extensible UI systems.

### [Utility Functions](./utilities.md)

Utility functions to facilitate the use of the dependency injection system in different contexts.

### [Server Utilities](./server.md)

Specific utilities for managing dependency injection on the server side, especially useful in Node.js applications and frameworks like Next.js, Express, NestJS, etc.

## Advanced Guides

### [Best Practices](./best-practices.md)

Best practices guide for using `@brushy/di` efficiently and in an organized way.

## Examples

Check out the complete examples in each section of the documentation to see how to use `@brushy/di` in different scenarios.
Consult the specific guides for more details about each concept.
