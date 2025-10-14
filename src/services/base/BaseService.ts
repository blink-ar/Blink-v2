/**
 * Base service interface that all services should implement
 */
export interface BaseService {
    /**
     * Initialize the service
     */
    initialize(): Promise<void> | void;

    /**
     * Clean up resources when service is destroyed
     */
    destroy(): Promise<void> | void;

    /**
     * Get service name for logging and debugging
     */
    getServiceName(): string;
}

/**
 * Abstract base class for services with common functionality
 */
export abstract class AbstractBaseService implements BaseService {
    protected initialized = false;
    protected destroyed = false;

    abstract getServiceName(): string;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        await this.onInitialize();
        this.initialized = true;
    }

    async destroy(): Promise<void> {
        if (this.destroyed) {
            return;
        }

        await this.onDestroy();
        this.destroyed = true;
        this.initialized = false;
    }

    protected abstract onInitialize(): Promise<void> | void;
    protected abstract onDestroy(): Promise<void> | void;

    protected ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error(`${this.getServiceName()} is not initialized`);
        }
    }

    protected ensureNotDestroyed(): void {
        if (this.destroyed) {
            throw new Error(`${this.getServiceName()} has been destroyed`);
        }
    }
}