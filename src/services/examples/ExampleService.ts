import { AbstractBaseService, Logger, ILogger, ValidationError } from '../base';

/**
 * Example service demonstrating how to use the base service infrastructure
 */
export class ExampleService extends AbstractBaseService {
    private logger: ILogger;
    private data: Record<string, any> = {};

    constructor() {
        super();
        this.logger = Logger.getInstance().createServiceLogger(this.getServiceName());
    }

    getServiceName(): string {
        return 'ExampleService';
    }

    protected async onInitialize(): Promise<void> {
        this.logger.info('Initializing ExampleService');
        // Perform initialization tasks here
        this.data = {};
    }

    protected async onDestroy(): Promise<void> {
        this.logger.info('Destroying ExampleService');
        // Clean up resources here
        this.data = {};
    }

    /**
     * Example method that demonstrates error handling and logging
     */
    async processData(key: string, value: any): Promise<void> {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        if (!key || typeof key !== 'string') {
            throw new ValidationError('Key must be a non-empty string', { key });
        }

        this.logger.debug('Processing data', { key, value });

        try {
            // Simulate some processing
            this.data[key] = value;
            this.logger.info('Data processed successfully', { key });
        } catch (error) {
            this.logger.error('Failed to process data', error as Error, { key, value });
            throw error;
        }
    }

    /**
     * Get processed data
     */
    getData(key: string): any {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        return this.data[key];
    }

    /**
     * Get all data
     */
    getAllData(): Record<string, any> {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        return { ...this.data };
    }
}