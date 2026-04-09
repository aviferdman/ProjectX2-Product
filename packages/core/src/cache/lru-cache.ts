/**
 * LRU (Least Recently Used) Cache with TTL support.
 *
 * A high-performance, generic cache implementation for memoizing expensive
 * computations, caching API responses, and reducing redundant work across
 * the Crewspace framework.
 *
 * @packageDocumentation
 */

/** Configuration options for the LRU cache. */
export interface LRUCacheConfig {
  /** Maximum number of entries the cache can hold. */
  maxSize: number;
  /** Default time-to-live in milliseconds. 0 means no expiration. */
  defaultTTL?: number;
  /** Called when an entry is evicted from the cache. */
  onEvict?: <T>(key: string, value: T) => void;
}

/** A single cached entry with metadata. */
interface CacheNode<T> {
  key: string;
  value: T;
  expiresAt: number | null;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

/** Statistics about cache usage. */
export interface CacheStats {
  /** Current number of entries in the cache. */
  size: number;
  /** Maximum allowed entries. */
  maxSize: number;
  /** Total cache hits since creation or last reset. */
  hits: number;
  /** Total cache misses since creation or last reset. */
  misses: number;
  /** Hit rate as a fraction (0–1). */
  hitRate: number;
  /** Total number of evictions. */
  evictions: number;
}

/**
 * A generic LRU cache with optional TTL support.
 *
 * Entries are evicted in LRU order when capacity is exceeded.
 * Optionally supports per-entry and default TTL-based expiration.
 */
export class LRUCache<T = unknown> {
  private readonly map = new Map<string, CacheNode<T>>();
  private head: CacheNode<T> | null = null;
  private tail: CacheNode<T> | null = null;
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly onEvict?: <V>(key: string, value: V) => void;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(config: LRUCacheConfig) {
    if (config.maxSize < 1) {
      throw new Error('LRUCache maxSize must be at least 1');
    }
    this.maxSize = config.maxSize;
    this.defaultTTL = config.defaultTTL ?? 0;
    this.onEvict = config.onEvict;
  }

  /** Retrieve a value from the cache. Returns `undefined` on miss or expiry. */
  get(key: string): T | undefined {
    const node = this.map.get(key);
    if (!node) {
      this.misses++;
      return undefined;
    }
    if (this.isExpired(node)) {
      this.removeNode(node);
      this.map.delete(key);
      this.misses++;
      return undefined;
    }
    this.moveToHead(node);
    this.hits++;
    return node.value;
  }

  /** Check whether the cache contains a non-expired entry for `key`. */
  has(key: string): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    if (this.isExpired(node)) {
      this.removeNode(node);
      this.map.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Insert or update a cache entry.
   *
   * @param key   - Cache key.
   * @param value - Value to store.
   * @param ttl   - Optional TTL in ms (overrides default).
   */
  set(key: string, value: T, ttl?: number): void {
    const existingNode = this.map.get(key);
    const resolvedTTL = ttl ?? this.defaultTTL;
    const expiresAt = resolvedTTL > 0 ? Date.now() + resolvedTTL : null;

    if (existingNode) {
      existingNode.value = value;
      existingNode.expiresAt = expiresAt;
      this.moveToHead(existingNode);
      return;
    }

    const node: CacheNode<T> = { key, value, expiresAt, prev: null, next: null };
    this.map.set(key, node);
    this.addToHead(node);

    if (this.map.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /** Remove an entry from the cache. Returns `true` if the entry existed. */
  delete(key: string): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    this.removeNode(node);
    this.map.delete(key);
    return true;
  }

  /** Remove all entries from the cache. */
  clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  /** Current number of entries (including potentially expired ones not yet pruned). */
  get size(): number {
    return this.map.size;
  }

  /** Return all non-expired keys in MRU-first order. */
  keys(): string[] {
    const result: string[] = [];
    let node = this.head;
    while (node) {
      if (!this.isExpired(node)) {
        result.push(node.key);
      }
      node = node.next;
    }
    return result;
  }

  /** Return cache performance statistics. */
  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.map.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
      evictions: this.evictions,
    };
  }

  /** Reset hit/miss/eviction counters. */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /** Remove all expired entries. Returns the number of entries pruned. */
  prune(): number {
    let pruned = 0;
    const now = Date.now();
    for (const [key, node] of this.map) {
      if (node.expiresAt !== null && now >= node.expiresAt) {
        this.removeNode(node);
        this.map.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  // --- Doubly-linked list operations ---

  private addToHead(node: CacheNode<T>): void {
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
  }

  private moveToHead(node: CacheNode<T>): void {
    if (node === this.head) return;
    this.removeNode(node);
    this.addToHead(node);
  }

  private evictLRU(): void {
    if (!this.tail) return;
    const evicted = this.tail;
    this.removeNode(evicted);
    this.map.delete(evicted.key);
    this.evictions++;
    if (this.onEvict) {
      this.onEvict(evicted.key, evicted.value);
    }
  }

  private isExpired(node: CacheNode<T>): boolean {
    return node.expiresAt !== null && Date.now() >= node.expiresAt;
  }
}
