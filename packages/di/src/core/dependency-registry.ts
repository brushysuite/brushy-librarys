import { Logger } from "./logger";
import { ProviderConfig, Token } from "../lib/@types";

/**
 * Manages the registration of dependencies.
 */
export class DependencyRegistry {
  private providers = new Map<Token, ProviderConfig>();

  register<T>(token: Token, config: ProviderConfig<T>): void {
    this.providers.set(token, config);
    Logger.debug(`Provider registered: ${String(token)}`);
  }

  getProvider(token: Token): ProviderConfig | undefined {
    return this.providers.get(token);
  }

  has(token: Token): boolean {
    return this.providers.has(token);
  }

  /**
   * Returns all registered providers
   */
  getAllProviders(): Array<{ token: Token; config: ProviderConfig }> {
    const result: Array<{ token: Token; config: ProviderConfig }> = [];

    this.providers.forEach((config, token) => {
      result.push({ token, config });
    });

    return result;
  }

  /**
   * Get all registered tokens
   */
  getAllTokens(): Token[] {
    return Array.from(this.providers.keys());
  }
}
