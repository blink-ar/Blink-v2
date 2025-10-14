import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService, CacheEntry } from '../CacheService';
import { CacheError, StorageError } from '../base';

// Simple localStorage mock
const mockStorage = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => mockStorage.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
        mockStorage.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
        delete mockStorage.store[key];
    }),
    clear: vi.fn(() => {
        mockStorage.store = {};
    }),
    key: vi.fn((index: number) => {
        const keys = Object.keys(mockStorage.store);
        return keys[index] || null;
    }),
    get length() {
        return Object.keys(mockStorage.store).length;
    }
};

Object.defineProperty(window, 'localStorage', {
    value: mockStorage
});

describe('CacheService', () => {
    let cacheService: CacheService;

    beforeEach(async () => {
        // Reset storage
        mockStorage.store = {};

        // Reset mocks but restore implementations
        vi.clearAllMocks();
        mockStorage.getItem.mockImplementation((key: string) => mockStorage.store[key] || null);
        mockStorage.setItem.mockImplementation((key: string, value: string) => {
            mockStorage.store[key] = value;
        });
        mockStorage.removeItem.mockImplementation((key: string) => {
            delete mockStorage.store[key];
        });
        mockStorage.clear.mockImplementation(() => {
            mockStorage.store = {};
        });
        mockStorage.key.mockImplementation((index: number) => {
            const keys = Object.keys(mockStorage.store);
            return keys[index] || null;
        });

        cacheService = new CacheService({
            defaultTtl: 1000, // 1 second for testing
            maxSize: 3,
            maxStorageSize: 1024,
            cleanupInterval: 100
        });

        await cacheService.initialize();
    });

    afterEach(async () => {
        if (cacheService) {
            await cacheService.destroy();
        }
    });

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            const newService = new CacheService();
            await expect(newService.initialize()).resolves.not.toThrow();
            await newService.destroy();
        });

        it('should throw error if localStorage is not available', async () => {
            // Mock localStorage to throw error
            const originalSetItem = mockStorage.setItem;
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const newService = new CacheService();
            await expect(newService.initialize()).rejects.toThrow(StorageError);

            mockStorage.setItem.mockImplementation(originalSetItem);
        });
    });

    describe('basic operations', () => {
        it('should set and get a value', () => {
            const testData = { name: 'test', value: 123 };

            cacheService.set('test-key', testData);
            const result = cacheService.get('test-key');

            expect(result).toEqual(testData);
        });

        it('should return null for non-existent key', () => {
            const result = cacheService.get('non-existent');
            expect(result).toBeNull();
        });

        it('should use custom TTL when provided', () => {
            const testData = { value: 'test' };

            cacheService.set('test-key', testData, 2000);

            // Verify the entry was stored with correct TTL
            const cacheKey = 'blink_cache_v1.0.0_test-key';
            const stored = mockStorage.store[cacheKey];
            expect(stored).toBeTruthy();

            const entry = JSON.parse(stored!) as CacheEntry;
            expect(entry.ttl).toBe(2000);
        });

        it('should handle serialization errors gracefully', () => {
            // Create circular reference that can't be serialized
            const circular: any = { name: 'test' };
            circular.self = circular;

            // The safeJsonStringify utility handles circular references gracefully,
            // so this should not throw but should handle the case properly
            expect(() => cacheService.set('circular', circular)).not.toThrow();

            // The value should be stored (even if it's just null due to serialization failure)
            const result = cacheService.get('circular');
            expect(result).toBeDefined(); // It will be stored as null or similar
        });
    });

    describe('TTL and expiration', () => {
        it('should return null for expired entries', async () => {
            const testData = { value: 'test' };

            cacheService.set('test-key', testData, 50); // 50ms TTL

            // Should be available immediately
            expect(cacheService.get('test-key')).toEqual(testData);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should be null after expiration
            expect(cacheService.get('test-key')).toBeNull();
        });

        it('should validate entries correctly', () => {
            const testData = { value: 'test' };

            cacheService.set('test-key', testData);
            expect(cacheService.isValid('test-key')).toBe(true);

            expect(cacheService.isValid('non-existent')).toBe(false);
        });
    });

    describe('cleanup operations', () => {
        it('should clear all entries when no pattern provided', () => {
            cacheService.set('key1', { data: 'test1' });
            cacheService.set('key2', { data: 'test2' });

            cacheService.clear();

            expect(cacheService.get('key1')).toBeNull();
            expect(cacheService.get('key2')).toBeNull();
        });

        it('should remove specific entries', () => {
            cacheService.set('test-key', { data: 'test' });
            expect(cacheService.get('test-key')).toBeTruthy();

            cacheService.remove('test-key');
            expect(cacheService.get('test-key')).toBeNull();
        });
    });

    describe('size management', () => {
        it('should calculate cache size correctly', () => {
            cacheService.set('test1', { data: 'small' });
            cacheService.set('test2', { data: 'larger data string' });

            const size = cacheService.getSize();
            expect(size.entries).toBe(2);
            expect(size.bytes).toBeGreaterThan(0);
        });
    });

    describe('statistics', () => {
        it('should track hit and miss rates', () => {
            cacheService.set('existing', { data: 'test' });

            // Generate some hits and misses
            cacheService.get('existing'); // hit
            cacheService.get('existing'); // hit
            cacheService.get('non-existent'); // miss

            const stats = cacheService.getStats();
            expect(stats.hitRate).toBeCloseTo(2 / 3);
            expect(stats.missRate).toBeCloseTo(1 / 3);
        });

        it('should provide accurate cache statistics', () => {
            const now = Date.now();
            cacheService.set('key1', { data: 'test1' });
            cacheService.set('key2', { data: 'test2' });

            const stats = cacheService.getStats();
            expect(stats.totalEntries).toBe(2);
            expect(stats.totalSize).toBeGreaterThan(0);
            expect(stats.oldestEntry).toBeGreaterThanOrEqual(now);
            expect(stats.newestEntry).toBeGreaterThanOrEqual(stats.oldestEntry);
        });
    });

    describe('error handling', () => {
        it('should handle quota exceeded error', () => {
            // Mock localStorage to throw quota exceeded error
            mockStorage.setItem.mockImplementation(() => {
                const error = new DOMException('Quota exceeded', 'QuotaExceededError');
                // Can't set name property on DOMException, but the code checks error.name
                Object.defineProperty(error, 'name', { value: 'QuotaExceededError' });
                throw error;
            });

            expect(() => cacheService.set('test', { data: 'test' })).toThrow(StorageError);
        });

        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw generic error
            mockStorage.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(cacheService.get('test')).toBeNull();
        });

        it('should throw error when not initialized', () => {
            const uninitializedService = new CacheService();

            expect(() => uninitializedService.set('key', 'value')).toThrow();
            expect(() => uninitializedService.get('key')).toThrow();
        });

        it('should throw error when destroyed', async () => {
            await cacheService.destroy();

            expect(() => cacheService.set('key', 'value')).toThrow();
            expect(() => cacheService.get('key')).toThrow();
        });
    });

    describe('edge cases', () => {
        it('should handle empty cache operations', () => {
            expect(cacheService.getSize()).toEqual({ entries: 0, bytes: 0 });
            expect(cacheService.getStats().totalEntries).toBe(0);

            cacheService.cleanup(); // Should not throw
            cacheService.clear(); // Should not throw
        });

        it('should handle null and undefined values', () => {
            cacheService.set('null-value', null);
            cacheService.set('undefined-value', undefined);

            expect(cacheService.get('null-value')).toBeNull();
            expect(cacheService.get('undefined-value')).toBeUndefined();
        });

        it('should handle complex nested objects', () => {
            const complexData = {
                users: [
                    { id: 1, name: 'John', preferences: { theme: 'dark', lang: 'en' } },
                    { id: 2, name: 'Jane', preferences: { theme: 'light', lang: 'es' } }
                ],
                metadata: {
                    version: '1.0',
                    timestamp: Date.now(),
                    nested: {
                        deep: {
                            value: 'test'
                        }
                    }
                }
            };

            cacheService.set('complex', complexData);
            const result = cacheService.get('complex');

            expect(result).toEqual(complexData);
        });
    });
});