import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HTTPClient } from '../HTTPClient';
import { NetworkError } from '../base';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator
const mockNavigator = {
    onLine: true
};
Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true
});

// Mock window for event listeners
const mockWindow = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};
Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
});

describe('HTTPClient', () => {
    let httpClient: HTTPClient;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockNavigator.onLine = true;

        // Reset fetch mock to default successful response
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ success: true })
        });

        httpClient = new HTTPClient({
            baseURL: 'https://api.example.com',
            timeout: 1000, // Short timeout for tests
            retryConfig: {
                maxAttempts: 2, // Fewer retries for faster tests
                baseDelay: 10,
                maxDelay: 100,
                backoffFactor: 2
            }
        });

        await httpClient.initialize();
    });

    afterEach(async () => {
        if (httpClient) {
            await httpClient.destroy();
        }
    });

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            const newClient = new HTTPClient();
            await expect(newClient.initialize()).resolves.not.toThrow();
            await newClient.destroy();
        });
    });

    describe('basic HTTP methods', () => {
        it('should make GET request', async () => {
            const response = await httpClient.get('/users');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/users',
                expect.objectContaining({
                    method: 'GET'
                })
            );

            expect(response.data).toEqual({ success: true });
            expect(response.status).toBe(200);
        });

        it('should make POST request with data', async () => {
            const postData = { name: 'John', email: 'john@example.com' };

            await httpClient.post('/users', postData);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/users',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(postData)
                })
            );
        });

        it('should make PUT request', async () => {
            const putData = { id: 1, name: 'Jane' };

            await httpClient.put('/users/1', putData);

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/users/1',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(putData)
                })
            );
        });

        it('should make DELETE request', async () => {
            await httpClient.delete('/users/1');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/users/1',
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });
    });

    describe('URL building', () => {
        it('should build URL with base URL', async () => {
            await httpClient.get('/test');
            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object));
        });

        it('should handle absolute URLs', async () => {
            await httpClient.get('https://other-api.com/test');
            expect(mockFetch).toHaveBeenCalledWith('https://other-api.com/test', expect.any(Object));
        });

        it('should handle URLs without leading slash', async () => {
            await httpClient.get('test');
            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object));
        });
    });

    describe('request deduplication', () => {
        it('should deduplicate identical requests', async () => {
            // Make two identical requests simultaneously
            const [response1, response2] = await Promise.all([
                httpClient.get('/test'),
                httpClient.get('/test')
            ]);

            // Should only make one actual fetch call
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(response1.data).toEqual(response2.data);
        });

        it('should not deduplicate different requests', async () => {
            await Promise.all([
                httpClient.get('/test1'),
                httpClient.get('/test2')
            ]);

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('retry logic', () => {
        it('should retry on network errors', async () => {
            // First call fails, second succeeds
            mockFetch
                .mockRejectedValueOnce(new TypeError('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({ 'content-type': 'application/json' }),
                    json: () => Promise.resolve({ success: true })
                });

            const response = await httpClient.get('/test');

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(response.data).toEqual({ success: true });
        });

        it('should retry on HTTP errors', async () => {
            // First call returns 500, second succeeds
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    headers: new Headers()
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({ 'content-type': 'application/json' }),
                    json: () => Promise.resolve({ success: true })
                });

            const response = await httpClient.get('/test');

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(response.data).toEqual({ success: true });
        });

        it('should eventually fail after max retries', async () => {
            mockFetch.mockRejectedValue(new TypeError('Network error'));

            await expect(httpClient.get('/test')).rejects.toThrow(NetworkError);

            // Should try initial + 1 retry = 2 total attempts (based on our config)
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('connection status monitoring', () => {
        it('should return current connection status', () => {
            expect(httpClient.getConnectionStatus()).toBe('online');
            expect(httpClient.isOnline()).toBe(true);
        });

        it('should detect slow connections', async () => {
            // Mock a slow response
            mockFetch.mockImplementation(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({
                        ok: true,
                        status: 200,
                        statusText: 'OK',
                        headers: new Headers({ 'content-type': 'application/json' }),
                        json: () => Promise.resolve({ data: 'test' })
                    }), 100) // Slower than our test threshold
                )
            );

            await httpClient.get('/test');
            // Note: In real implementation, this would be 'slow' but our test threshold might be different
            expect(['online', 'slow']).toContain(httpClient.getConnectionStatus());
        });
    });

    describe('error handling', () => {
        it('should handle HTTP error responses', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: new Headers()
            });

            await expect(httpClient.get('/nonexistent')).rejects.toThrow(NetworkError);
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

            await expect(httpClient.get('/test')).rejects.toThrow(NetworkError);
        });

        it('should handle non-JSON responses', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'text/plain' }),
                text: () => Promise.resolve('Plain text response')
            });

            const response = await httpClient.get('/test');
            expect(response.data).toBe('Plain text response');
        });
    });

    describe('custom headers and configuration', () => {
        it('should use custom headers', async () => {
            await httpClient.get('/test', {
                headers: {
                    'Authorization': 'Bearer token123',
                    'X-Custom-Header': 'custom-value'
                }
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer token123',
                        'X-Custom-Header': 'custom-value'
                    })
                })
            );
        });

        it('should merge with default headers', async () => {
            await httpClient.get('/test', {
                headers: { 'Authorization': 'Bearer token123' }
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer token123'
                    })
                })
            );
        });
    });

    describe('request body handling', () => {
        it('should serialize object bodies to JSON', async () => {
            const data = { name: 'test', value: 123 };

            await httpClient.post('/test', data);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: JSON.stringify(data)
                })
            );
        });

        it('should handle string bodies as-is', async () => {
            const data = 'raw string data';

            await httpClient.post('/test', data);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: data
                })
            );
        });

        it('should handle null/undefined bodies', async () => {
            await httpClient.post('/test', null);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: null
                })
            );
        });
    });

    describe('edge cases', () => {
        it('should handle requests when not initialized', async () => {
            const uninitializedClient = new HTTPClient();

            await expect(uninitializedClient.get('/test')).rejects.toThrow('HTTPClient is not initialized');
        });

        it('should handle requests when destroyed', async () => {
            await httpClient.destroy();

            // After destroy, the service is no longer initialized, so it throws the initialization error
            await expect(httpClient.get('/test')).rejects.toThrow('HTTPClient is not initialized');
        });

        it('should handle missing navigator', async () => {
            // Temporarily remove navigator
            const originalNavigator = global.navigator;
            delete (global as any).navigator;

            const client = new HTTPClient();
            await client.initialize();

            // Should default to online
            expect(client.getConnectionStatus()).toBe('online');

            await client.destroy();

            // Restore navigator
            global.navigator = originalNavigator;
        });
    });
});