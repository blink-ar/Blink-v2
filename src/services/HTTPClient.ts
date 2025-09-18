import { AbstractBaseService, Logger, NetworkError, retryWithBackoff, DEFAULT_RETRY_CONFIG, type RetryConfig } from './base';

/**
 * HTTP request configuration
 */
export interface HTTPRequestConfig {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    signal?: AbortSignal;
}

/**
 * HTTP response interface
 */
export interface HTTPResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
    url: string;
}

/**
 * Connection status type
 */
export type ConnectionStatus = 'online' | 'offline' | 'slow';

/**
 * Request cache entry for deduplication
 */
interface RequestCacheEntry {
    promise: Promise<HTTPResponse>;
    timestamp: number;
}

/**
 * HTTP client configuration
 */
export interface HTTPClientConfig {
    baseURL?: string;
    timeout?: number;
    retryConfig?: Partial<RetryConfig>;
    defaultHeaders?: Record<string, string>;
    slowConnectionThreshold?: number; // ms
    requestDeduplicationTTL?: number; // ms
}

/**
 * Default HTTP client configuration
 */
const DEFAULT_HTTP_CONFIG: Required<HTTPClientConfig> = {
    baseURL: '',
    timeout: 30000, // 30 seconds
    retryConfig: DEFAULT_RETRY_CONFIG,
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    slowConnectionThreshold: 3000, // 3 seconds
    requestDeduplicationTTL: 5000 // 5 seconds
};

/**
 * HTTPClient provides robust HTTP communication with retry logic, 
 * request deduplication, and connection monitoring
 */
export class HTTPClient extends AbstractBaseService {
    private config: Required<HTTPClientConfig>;
    private logger: Logger;
    private connectionStatus: ConnectionStatus = 'online';
    private requestCache = new Map<string, RequestCacheEntry>();
    private connectionListeners = new Set<(status: ConnectionStatus) => void>();
    private networkEventListeners: (() => void)[] = [];

    constructor(config: HTTPClientConfig = {}) {
        super();
        this.config = { ...DEFAULT_HTTP_CONFIG, ...config };
        this.logger = new Logger('HTTPClient');
    }

    getServiceName(): string {
        return 'HTTPClient';
    }

    protected async onInitialize(): Promise<void> {
        this.logger.info('Initializing HTTPClient', { config: this.config });

        // Set up network event listeners
        this.setupNetworkMonitoring();

        // Initial connection status check
        this.updateConnectionStatus();
    }

    protected async onDestroy(): Promise<void> {
        this.logger.info('Destroying HTTPClient');

        // Clean up event listeners
        this.cleanupNetworkMonitoring();

        // Clear request cache
        this.requestCache.clear();

        // Clear connection listeners
        this.connectionListeners.clear();
    }

    /**
     * Make an HTTP request with retry logic and deduplication
     */
    async request<T = any>(url: string, config: HTTPRequestConfig = {}): Promise<HTTPResponse<T>> {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        const fullUrl = this.buildURL(url);
        const requestKey = this.generateRequestKey(fullUrl, config);

        // Check for duplicate request
        const cachedRequest = this.requestCache.get(requestKey);
        if (cachedRequest && this.isRequestCacheValid(cachedRequest)) {
            this.logger.debug('Using cached request', { url: fullUrl });
            return cachedRequest.promise as Promise<HTTPResponse<T>>;
        }

        // Create new request with retry logic
        const requestPromise = this.executeRequestWithRetry<T>(fullUrl, config);

        // Cache the request for deduplication
        this.requestCache.set(requestKey, {
            promise: requestPromise,
            timestamp: Date.now()
        });

        try {
            const response = await requestPromise;
            return response;
        } finally {
            // Clean up cache entry after request completes
            setTimeout(() => {
                this.requestCache.delete(requestKey);
            }, this.config.requestDeduplicationTTL);
        }
    }

    /**
     * GET request
     */
    async get<T = any>(url: string, config: Omit<HTTPRequestConfig, 'method' | 'body'> = {}): Promise<HTTPResponse<T>> {
        return this.request<T>(url, { ...config, method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T = any>(url: string, data?: any, config: Omit<HTTPRequestConfig, 'method'> = {}): Promise<HTTPResponse<T>> {
        return this.request<T>(url, { ...config, method: 'POST', body: data });
    }

    /**
     * PUT request
     */
    async put<T = any>(url: string, data?: any, config: Omit<HTTPRequestConfig, 'method'> = {}): Promise<HTTPResponse<T>> {
        return this.request<T>(url, { ...config, method: 'PUT', body: data });
    }

    /**
     * DELETE request
     */
    async delete<T = any>(url: string, config: Omit<HTTPRequestConfig, 'method' | 'body'> = {}): Promise<HTTPResponse<T>> {
        return this.request<T>(url, { ...config, method: 'DELETE' });
    }

    /**
     * PATCH request
     */
    async patch<T = any>(url: string, data?: any, config: Omit<HTTPRequestConfig, 'method'> = {}): Promise<HTTPResponse<T>> {
        return this.request<T>(url, { ...config, method: 'PATCH', body: data });
    }

    /**
     * Get current connection status
     */
    getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    /**
     * Add connection status change listener
     */
    onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
        this.connectionListeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    /**
     * Check if currently online
     */
    isOnline(): boolean {
        return this.connectionStatus !== 'offline';
    }

    /**
     * Clear request cache
     */
    clearRequestCache(): void {
        this.requestCache.clear();
        this.logger.debug('Request cache cleared');
    }

    // Private methods

    private async executeRequestWithRetry<T>(url: string, config: HTTPRequestConfig): Promise<HTTPResponse<T>> {
        const retryConfig = { ...this.config.retryConfig };

        if (config.retries !== undefined) {
            retryConfig.maxAttempts = config.retries + 1;
        }
        if (config.retryDelay !== undefined) {
            retryConfig.initialDelay = config.retryDelay;
        }

        return retryWithBackoff(
            () => this.executeRequest<T>(url, config),
            retryConfig,
            (error, attempt) => {
                this.logger.warn('Request failed, retrying', {
                    url,
                    attempt,
                    error: error.message,
                    nextRetryIn: retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1)
                });

                // Update connection status on network errors
                if (error instanceof NetworkError) {
                    this.updateConnectionStatus();
                }
            }
        );
    }

    private async executeRequest<T>(url: string, config: HTTPRequestConfig): Promise<HTTPResponse<T>> {
        const startTime = Date.now();

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, config.timeout || this.config.timeout);

            // Combine signals if provided
            let signal = controller.signal;
            if (config.signal) {
                // Create a combined signal
                const combinedController = new AbortController();
                const abortHandler = () => combinedController.abort();

                controller.signal.addEventListener('abort', abortHandler);
                config.signal.addEventListener('abort', abortHandler);

                signal = combinedController.signal;
            }

            // Prepare request options
            const requestOptions: RequestInit = {
                method: config.method || 'GET',
                headers: {
                    ...this.config.defaultHeaders,
                    ...config.headers
                },
                signal
            };

            // Add body if present
            if (config.body !== undefined) {
                if (typeof config.body === 'object' && config.body !== null) {
                    requestOptions.body = JSON.stringify(config.body);
                } else {
                    requestOptions.body = config.body;
                }
            }

            this.logger.debug('Making HTTP request', {
                url,
                method: requestOptions.method,
                headers: requestOptions.headers
            });

            // Make the request
            const response = await fetch(url, requestOptions);

            clearTimeout(timeoutId);

            const duration = Date.now() - startTime;

            // Update connection status based on response time
            this.updateConnectionStatusFromDuration(duration);

            // Check if response is ok
            if (!response.ok) {
                throw new NetworkError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    {
                        status: response.status,
                        statusText: response.statusText,
                        url,
                        duration
                    }
                );
            }

            // Parse response data
            let data: T;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text() as unknown as T;
            }

            this.logger.debug('HTTP request successful', {
                url,
                status: response.status,
                duration
            });

            return {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                url
            };

        } catch (error) {
            const duration = Date.now() - startTime;

            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new NetworkError('Request timeout', {
                    url,
                    timeout: config.timeout || this.config.timeout,
                    duration
                });
            }

            if (error instanceof TypeError && error.message.includes('fetch')) {
                // Network error (offline, DNS failure, etc.)
                this.updateConnectionStatus();
                throw new NetworkError('Network request failed', {
                    url,
                    originalError: error.message,
                    duration
                });
            }

            // Re-throw NetworkError as-is
            if (error instanceof NetworkError) {
                throw error;
            }

            // Wrap other errors
            throw new NetworkError('Request failed', {
                url,
                originalError: error instanceof Error ? error.message : String(error),
                duration
            });
        }
    }

    private buildURL(url: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        const baseURL = this.config.baseURL.endsWith('/')
            ? this.config.baseURL.slice(0, -1)
            : this.config.baseURL;
        const path = url.startsWith('/') ? url : `/${url}`;

        return `${baseURL}${path}`;
    }

    private generateRequestKey(url: string, config: HTTPRequestConfig): string {
        const method = config.method || 'GET';
        const headers = JSON.stringify(config.headers || {});
        const body = config.body ? JSON.stringify(config.body) : '';

        return `${method}:${url}:${headers}:${body}`;
    }

    private isRequestCacheValid(entry: RequestCacheEntry): boolean {
        const age = Date.now() - entry.timestamp;
        return age < this.config.requestDeduplicationTTL;
    }

    private setupNetworkMonitoring(): void {
        if (typeof window !== 'undefined' && 'navigator' in window) {
            const onlineHandler = () => {
                this.logger.info('Network connection restored');
                this.updateConnectionStatus();
            };

            const offlineHandler = () => {
                this.logger.warn('Network connection lost');
                this.updateConnectionStatus();
            };

            window.addEventListener('online', onlineHandler);
            window.addEventListener('offline', offlineHandler);

            this.networkEventListeners.push(
                () => window.removeEventListener('online', onlineHandler),
                () => window.removeEventListener('offline', offlineHandler)
            );
        }
    }

    private cleanupNetworkMonitoring(): void {
        this.networkEventListeners.forEach(cleanup => cleanup());
        this.networkEventListeners = [];
    }

    private updateConnectionStatus(): void {
        const wasOnline = this.connectionStatus !== 'offline';

        if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
            this.connectionStatus = navigator.onLine ? 'online' : 'offline';
        } else {
            // Fallback: assume online if we can't detect
            this.connectionStatus = 'online';
        }

        const isOnline = this.connectionStatus !== 'offline';

        if (wasOnline !== isOnline) {
            this.logger.info('Connection status changed', { status: this.connectionStatus });
            this.notifyConnectionListeners();
        }
    }

    private updateConnectionStatusFromDuration(duration: number): void {
        const previousStatus = this.connectionStatus;

        if (duration > this.config.slowConnectionThreshold) {
            this.connectionStatus = 'slow';
        } else if (this.connectionStatus === 'slow') {
            // Only upgrade from slow to online, not from offline
            this.connectionStatus = 'online';
        }

        if (previousStatus !== this.connectionStatus) {
            this.logger.debug('Connection status updated from response time', {
                duration,
                status: this.connectionStatus
            });
            this.notifyConnectionListeners();
        }
    }

    private notifyConnectionListeners(): void {
        this.connectionListeners.forEach(listener => {
            try {
                listener(this.connectionStatus);
            } catch (error) {
                this.logger.error('Error in connection status listener', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
}