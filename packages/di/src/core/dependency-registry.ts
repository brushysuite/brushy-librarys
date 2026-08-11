import { ProviderConfig, Token } from "../lib/@types";

/**
 * Manages provider registration — single responsibility, no side effects.
 */
export class DependencyRegistry {
  private readonly providers = new Map<Token, ProviderConfig>();

  register<T>(token: Token, config: ProviderConfig<T>): void {
    this.providers.set(token, config);
  }

  getProvider(token: Token): ProviderConfig | undefined {
    return this.providers.get(token);
  }

  has(token: Token): boolean {
    return this.providers.has(token);
  }

  getAllProviders(): Array<{ token: Token; config: ProviderConfig }> {
    const result: Array<{ token: Token; config: ProviderConfig }> = [];
    for (const [token, config] of this.providers) {
      result.push({ token, config });
    }
    return result;
  }

  getAllTokens(): Token[] {
    return [...this.providers.keys()];
  }
}
