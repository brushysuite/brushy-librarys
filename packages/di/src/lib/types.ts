/**
 * Represents a unique identifier for a dependency within the dependency injection system.
 * Tokens can be either strings or symbols, allowing for flexible and unique identification of dependencies.
 */
export type Token = string | symbol;

/**
 * Defines the lifecycle management strategy for a dependency instance.
 * - **singleton**: A single instance is created and reused across the application.
 * - **transient**: A new instance is created each time the dependency is resolved.
 * - **scoped**: An instance is created per scope, typically per HTTP request in web applications.
 */
export type Lifecycle = "singleton" | "transient" | "scoped";
