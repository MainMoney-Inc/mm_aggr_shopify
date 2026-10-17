/** In-memory cache for the read-only lookups the checkout widget repeats on every load. */

const DAY_MS = 86_400_000;

/** Milliseconds each cacheable route is kept; routes not listed (fees, deposits, status) are never cached. */
const TTL_MS: Record<string, number> = {
  countries: DAY_MS,
  providers: DAY_MS,
  "checkout-preferences": DAY_MS,
  "amount-limits": 21_600_000,
  "match-provider": 600_000,
};

type Entry = { value: unknown; expiresAt: number };

export class ProxyCache {
  private readonly entries = new Map<string, Entry>();
  private version = 1;

  constructor(private readonly now: () => number = Date.now) {}

  /** Orphans every entry: call when a shop's credentials or merchant configuration change. */
  flush(): void {
    this.version += 1;
    this.entries.clear();
  }

  async remember<T>(
    scope: string,
    route: string,
    query: Record<string, string>,
    load: () => Promise<T>,
  ): Promise<T> {
    const ttl = TTL_MS[route];
    // A match-provider answer with `get_lookup` carries the account holder's name: never keep that.
    const lookup = query.get_lookup === "true" || query.get_lookup === "1";
    if (ttl === undefined || (route === "match-provider" && lookup)) {
      return load();
    }
    const key = `${scope}|${this.version}|${route}|${JSON.stringify(Object.entries(query).sort())}`;
    const hit = this.entries.get(key);
    if (hit !== undefined && hit.expiresAt > this.now()) {
      return hit.value as T;
    }
    const value = await load();
    this.entries.set(key, { value, expiresAt: this.now() + ttl });
    return value;
  }
}
