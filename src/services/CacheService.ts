import { AbstractBaseService, Logger, CacheError, StorageError, safeJsonParse, safeJsonStringify } from './base';

/**
 * Cache entry interface with metadata
 */
export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    version: string;
    size: number;
}

/**
 * Cache configuration interface
 */
export interface CacheConfig {
    defaultTtl: number; // Default TTL in milliseconds
    maxSize: number; // Maximum number of entries
    maxStorageSize: number; // Maximum storage size in bytes
    version: string; // Cache version for migration
    cleanupInterval: number; // Cleanup interval in milliseconds
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    oldestEntry: number;
    newestEntry: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
    defaultTtl: 3600000, // 1 hour
    maxSize: 100,
    maxStorageSize: 5 * 1024 * 1024, // 5MB
    version: '1.0.0',
    cleanupInterval: 300000 // 5 minutes
};

/**
 * CacheService provides intelligent caching with TTL, size management, and cleanup
 */
export class CacheService extends AbstractBaseService {
    private config: CacheConfig;
    private logger: Logger;
    private cleanupTimer?: NodeJS.Timeout;
    private stats = {
        hits: 0,
        misses: 0,
        totalRequests: 0
    };

    constructor(config: Partial<CacheConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.logger = new Logger('CacheService');
    }

    getServiceName(): string {
        return 'CacheService';
    }

    protected async onInitialize(): Promise<void> {
        this.logger.info('Initializing CacheService', { config: this.config });

        // Check localStorage availability
        if (!this.isLocalStorageAvailable()) {
            throw new StorageError('localStorage is not available');
        }

        // Migrate cache if version changed
        await this.migrateCache();

        // Start cleanup timer
        this.startCleanupTimer();

        // Initial cleanup (don't check initialization since we're in the process of initializing)
        this.performCleanup();
    }

    protected async onDestroy(): Promise<void> {
        this.logger.info('Destroying CacheService');

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
    }

    /**
     * Set a value in cache with optional TTL
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl: ttl ?? this.config.defaultTtl,
                version: this.config.version,
                size: this.calculateSize(data)
            };

            const serialized = safeJsonStringify(entry);
            if (!serialized) {
                throw new CacheError('Failed to serialize cache entry', { key });
            }

            // Check if we need to make space
            this.ensureSpace(serialized.length);

            localStorage.setItem(this.getCacheKey(key), serialized);

            this.logger.debug('Cache entry set', {
                key,
                size: entry.size,
                ttl: entry.ttl
            });

        } catch (error) {
            if (error instanceof CacheError) {
                throw error;
            }

            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
                throw new StorageError('Storage quota exceeded', { key });
            }

            throw new CacheError('Failed to set cache entry', { key, error: error.message });
        }
    }

    /**
     * Get a value from cache
     */
    get<T>(key: string): T | null {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        this.stats.totalRequests++;

        try {
            const serialized = localStorage.getItem(this.getCacheKey(key));
            if (!serialized) {
                this.stats.misses++;
                return null;
            }

            const entry = safeJsonParse<CacheEntry<T>>(serialized);
            if (!entry) {
                this.logger.warn('Failed to parse cache entry', { key });
                this.remove(key);
                this.stats.misses++;
                return null;
            }

            // Check if entry is valid
            if (!this.isEntryValid(entry)) {
                this.remove(key);
                this.stats.misses++;
                return null;
            }

            this.stats.hits++;
            this.logger.debug('Cache hit', { key });
            return entry.data;

        } catch (error) {
            this.logger.error('Failed to get cache entry', { key, error: error.message });
            this.stats.misses++;
            return null;
        }
    }

    /**
     * Check if a cache entry is valid (not expired)
     */
    isValid(key: string): boolean {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        try {
            const serialized = localStorage.getItem(this.getCacheKey(key));
            if (!serialized) {
                return false;
            }

            const entry = safeJsonParse<CacheEntry>(serialized);
            if (!entry) {
                return false;
            }

            return this.isEntryValid(entry);
        } catch {
            return false;
        }
    }

    /**
     * Remove a cache entry
     */
    remove(key: string): void {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        try {
            localStorage.removeItem(this.getCacheKey(key));
            this.logger.debug('Cache entry removed', { key });
        } catch (error) {
            this.logger.error('Failed to remove cache entry', { key, error: error.message });
        }
    }

    /**
     * Clear cache entries matching a pattern
     */
    clear(pattern?: string): void {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        try {
            const keys = this.getCacheKeys();
            let removedCount = 0;

            for (const key of keys) {
                const cacheKey = key.replace(this.getCachePrefix(), '');

                if (!pattern || this.matchesPattern(cacheKey, pattern)) {
                    localStorage.removeItem(key);
                    removedCount++;
                }
            }

            this.logger.info('Cache cleared', { pattern, removedCount });
        } catch (error) {
            throw new CacheError('Failed to clear cache', { pattern, error: error.message });
        }
    }

    /**
     * Get cache size information
     */
    getSize(): { entries: number; bytes: number } {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        try {
            const keys = this.getCacheKeys();
            let totalBytes = 0;

            for (const key of keys) {
                const value = localStorage.getItem(key);
                if (value) {
                    totalBytes += new Blob([value]).size;
                }
            }

            return {
                entries: keys.length,
                bytes: totalBytes
            };
        } catch (error) {
            this.logger.error('Failed to calculate cache size', { error: error.message });
            return { entries: 0, bytes: 0 };
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        const size = this.getSize();
        const entries = this.getAllEntries();

        const timestamps = entries.map(e => e.timestamp).filter(Boolean);

        return {
            totalEntries: size.entries,
            totalSize: size.bytes,
            hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
            missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0,
            oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
        };
    }

    /**
     * Cleanup expired entries and enforce size limits
     */
    cleanup(): void {
        this.ensureInitialized();
        this.ensureNotDestroyed();
        this.performCleanup();
    }

    /**
     * Internal cleanup method that doesn't check initialization state
     */
    private performCleanup(): void {
        try {
            const keys = this.getCacheKeys();
            const entries: Array<{ key: string; entry: CacheEntry; fullKey: string }> = [];
            let removedExpired = 0;

            // First pass: remove expired entries and collect valid ones
            for (const fullKey of keys) {
                const serialized = localStorage.getItem(fullKey);
                if (!serialized) continue;

                const entry = safeJsonParse<CacheEntry>(serialized);
                if (!entry) {
                    localStorage.removeItem(fullKey);
                    continue;
                }

                if (!this.isEntryValid(entry)) {
                    localStorage.removeItem(fullKey);
                    removedExpired++;
                } else {
                    const key = fullKey.replace(this.getCachePrefix(), '');
                    entries.push({ key, entry, fullKey });
                }
            }

            // Second pass: enforce size limits
            let removedForSize = 0;
            if (entries.length > this.config.maxSize) {
                // Sort by timestamp (oldest first)
                entries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);

                const toRemove = entries.length - this.config.maxSize;
                for (let i = 0; i < toRemove; i++) {
                    localStorage.removeItem(entries[i].fullKey);
                    removedForSize++;
                }
            }

            if (removedExpired > 0 || removedForSize > 0) {
                this.logger.info('Cache cleanup completed', {
                    removedExpired,
                    removedForSize,
                    remaining: entries.length - removedForSize
                });
            }
        } catch (error) {
            this.logger.error('Cache cleanup failed', { error: error.message });
        }
    }

    // Private helper methods

    private getCacheKey(key: string): string {
        return `${this.getCachePrefix()}${key}`;
    }

    private getCachePrefix(): string {
        return `blink_cache_v${this.config.version}_`;
    }

    private getCacheKeys(): string[] {
        const prefix = this.getCachePrefix();
        const keys: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }

        return keys;
    }

    private getAllEntries(): CacheEntry[] {
        const keys = this.getCacheKeys();
        const entries: CacheEntry[] = [];

        for (const key of keys) {
            const serialized = localStorage.getItem(key);
            if (serialized) {
                const entry = safeJsonParse<CacheEntry>(serialized);
                if (entry) {
                    entries.push(entry);
                }
            }
        }

        return entries;
    }

    private isEntryValid(entry: CacheEntry): boolean {
        // Check version compatibility
        if (entry.version !== this.config.version) {
            return false;
        }

        // Check TTL
        const now = Date.now();
        const age = now - entry.timestamp;
        return age < entry.ttl;
    }

    private calculateSize(data: any): number {
        try {
            const serialized = safeJsonStringify(data);
            return serialized ? new Blob([serialized]).size : 0;
        } catch {
            return 0;
        }
    }

    private ensureSpace(requiredBytes: number): void {
        const currentSize = this.getSize();

        if (currentSize.bytes + requiredBytes > this.config.maxStorageSize) {
            // Remove oldest entries until we have enough space
            const entries = this.getAllEntries()
                .map(entry => ({
                    entry,
                    key: this.findKeyForEntry(entry)
                }))
                .filter(item => item.key)
                .sort((a, b) => a.entry.timestamp - b.entry.timestamp);

            let freedBytes = 0;
            for (const { key } of entries) {
                if (freedBytes >= requiredBytes) break;

                const serialized = localStorage.getItem(this.getCacheKey(key!));
                if (serialized) {
                    freedBytes += new Blob([serialized]).size;
                    this.remove(key!);
                }
            }
        }
    }

    private findKeyForEntry(targetEntry: CacheEntry): string | null {
        const keys = this.getCacheKeys();

        for (const fullKey of keys) {
            const serialized = localStorage.getItem(fullKey);
            if (serialized) {
                const entry = safeJsonParse<CacheEntry>(serialized);
                if (entry && entry.timestamp === targetEntry.timestamp) {
                    return fullKey.replace(this.getCachePrefix(), '');
                }
            }
        }

        return null;
    }

    private handleQuotaExceeded(): void {
        this.logger.warn('Storage quota exceeded, performing aggressive cleanup');

        // Remove 50% of entries, starting with oldest
        const entries = this.getAllEntries()
            .map(entry => ({
                entry,
                key: this.findKeyForEntry(entry)
            }))
            .filter(item => item.key)
            .sort((a, b) => a.entry.timestamp - b.entry.timestamp);

        const toRemove = Math.ceil(entries.length * 0.5);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
            this.remove(entries[i].key!);
        }
    }

    private matchesPattern(key: string, pattern: string): boolean {
        // Simple pattern matching with wildcards
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
    }

    private isLocalStorageAvailable(): boolean {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }

    private async migrateCache(): Promise<void> {
        // Check if we need to migrate from a previous version
        const currentVersion = localStorage.getItem('blink_cache_version');

        if (currentVersion && currentVersion !== this.config.version) {
            this.logger.info('Migrating cache from version', {
                from: currentVersion,
                to: this.config.version
            });

            // For now, just clear old cache on version change
            // In the future, we could implement more sophisticated migration
            this.clear();
        }

        localStorage.setItem('blink_cache_version', this.config.version);
    }
}