import { describe, it, expect, vi } from 'vitest';
import {
    retryWithBackoff,
    sleep,
    debounce,
    throttle,
    validateRequired,
    deepClone,
    generateId,
    formatBytes,
    safeJsonParse,
    safeJsonStringify
} from '../utils';
import { NetworkError, ValidationError } from '../errors';

describe('Service Utils', () => {
    describe('retryWithBackoff', () => {
        it('should succeed on first attempt', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const result = await retryWithBackoff(fn);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValue('success');

            const result = await retryWithBackoff(fn, { maxAttempts: 3, baseDelay: 10 });

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should throw NetworkError after max attempts', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

            await expect(
                retryWithBackoff(fn, { maxAttempts: 2, baseDelay: 10 })
            ).rejects.toThrow(NetworkError);

            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('sleep', () => {
        it('should wait for specified time', async () => {
            const start = Date.now();
            await sleep(50);
            const end = Date.now();

            expect(end - start).toBeGreaterThanOrEqual(45);
        });
    });

    describe('debounce', () => {
        it('should debounce function calls', async () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 50);

            debouncedFn('call1');
            debouncedFn('call2');
            debouncedFn('call3');

            expect(fn).not.toHaveBeenCalled();

            await sleep(60);

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith('call3');
        });
    });

    describe('throttle', () => {
        it('should throttle function calls', async () => {
            const fn = vi.fn();
            const throttledFn = throttle(fn, 50);

            throttledFn('call1');
            throttledFn('call2');
            throttledFn('call3');

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith('call1');

            await sleep(60);

            throttledFn('call4');
            expect(fn).toHaveBeenCalledTimes(2);
            expect(fn).toHaveBeenCalledWith('call4');
        });
    });

    describe('validateRequired', () => {
        it('should pass validation for valid object', () => {
            const obj = { name: 'test', age: 25, email: 'test@example.com' };

            expect(() => validateRequired(obj, ['name', 'age'])).not.toThrow();
        });

        it('should throw ValidationError for missing fields', () => {
            const obj = { name: 'test' };

            expect(() => validateRequired(obj, ['name', 'age', 'email']))
                .toThrow(ValidationError);
        });

        it('should throw ValidationError for null/undefined fields', () => {
            const obj = { name: 'test', age: null, email: undefined };

            expect(() => validateRequired(obj, ['name', 'age', 'email']))
                .toThrow(ValidationError);
        });
    });

    describe('deepClone', () => {
        it('should clone primitive values', () => {
            expect(deepClone(42)).toBe(42);
            expect(deepClone('test')).toBe('test');
            expect(deepClone(true)).toBe(true);
            expect(deepClone(null)).toBe(null);
        });

        it('should clone arrays', () => {
            const original = [1, 2, { nested: 'value' }];
            const cloned = deepClone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[2]).not.toBe(original[2]);
        });

        it('should clone objects', () => {
            const original = {
                name: 'test',
                nested: { value: 42 },
                array: [1, 2, 3]
            };
            const cloned = deepClone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.nested).not.toBe(original.nested);
            expect(cloned.array).not.toBe(original.array);
        });

        it('should clone dates', () => {
            const original = new Date('2023-01-01');
            const cloned = deepClone(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });
    });

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
            expect(id1.length).toBeGreaterThan(0);
        });
    });

    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1048576)).toBe('1 MB');
            expect(formatBytes(1073741824)).toBe('1 GB');
            expect(formatBytes(1536)).toBe('1.5 KB');
        });
    });

    describe('safeJsonParse', () => {
        it('should parse valid JSON', () => {
            const result = safeJsonParse('{"test": "value"}', {});
            expect(result).toEqual({ test: 'value' });
        });

        it('should return fallback for invalid JSON', () => {
            const fallback = { default: 'value' };
            const result = safeJsonParse('invalid json', fallback);
            expect(result).toBe(fallback);
        });
    });

    describe('safeJsonStringify', () => {
        it('should stringify valid objects', () => {
            const result = safeJsonStringify({ test: 'value' });
            expect(result).toBe('{"test":"value"}');
        });

        it('should return fallback for unstringifiable objects', () => {
            const circular: any = {};
            circular.self = circular;

            const result = safeJsonStringify(circular, '{"error": true}');
            expect(result).toBe('{"error": true}');
        });
    });
});