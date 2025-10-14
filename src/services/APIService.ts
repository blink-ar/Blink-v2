import { AbstractBaseService, Logger, NetworkError, ValidationError } from './base';
import { CacheService } from './CacheService';
import { HTTPClient } from './HTTPClient';
import { Business, BankBenefit } from '../types';
// Removed mockBusinesses import - using only real MongoDB data
import { benefitsAPI } from './api';



/**
 * API service configuration
 */
export interface APIServiceConfig {
    baseURL?: string;
    cacheTimeout?: number; // Cache TTL in milliseconds
    backgroundRefreshThreshold?: number; // Refresh when cache is this old (in milliseconds)
    retryAttempts?: number;
    timeout?: number;
}

/**
 * Default API service configuration
 */
const DEFAULT_API_CONFIG: Required<APIServiceConfig> = {
    baseURL: 'https://benefits-fetcher-5na20bs0n-andresimachs-projects.vercel.app',
    cacheTimeout: 3600000, // 1 hour
    backgroundRefreshThreshold: 1800000, // 30 minutes
    retryAttempts: 3,
    timeout: 30000 // 30 seconds
};

/**
 * Enhanced API service with caching, retry logic, and data validation
 */
export class APIService extends AbstractBaseService {
    private config: Required<APIServiceConfig>;
    private logger: Logger;
    private cacheService: CacheService;
    private httpClient: HTTPClient;
    private backgroundRefreshPromise?: Promise<Business[]>;

    constructor(config: APIServiceConfig = {}) {
        super();
        this.config = { ...DEFAULT_API_CONFIG, ...config };
        this.logger = new Logger('APIService');

        // Initialize dependencies
        this.cacheService = new CacheService({
            defaultTtl: this.config.cacheTimeout,
            maxSize: 50,
            version: '1.0.0'
        });

        this.httpClient = new HTTPClient({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            retryConfig: {
                maxAttempts: this.config.retryAttempts,
                baseDelay: 1000,
                maxDelay: 10000,
                backoffFactor: 2
            }
        });
    }

    getServiceName(): string {
        return 'APIService';
    }

    protected async onInitialize(): Promise<void> {
        this.logger.info('Initializing APIService', { config: this.config });

        // Initialize dependencies
        await this.cacheService.initialize();
        await this.httpClient.initialize();
    }

    protected async onDestroy(): Promise<void> {
        this.logger.info('Destroying APIService');

        // Clean up dependencies
        await this.cacheService.destroy();
        await this.httpClient.destroy();
    }

    /**
     * Fetch businesses with caching and background refresh
     */
    async fetchBusinesses(): Promise<Business[]> {
        this.ensureInitialized();
        this.ensureNotDestroyed();

        const cacheKey = 'businesses';

        try {
            // Check cache first
            const cachedData = this.cacheService.get<Business[]>(cacheKey);

            if (cachedData) {
                this.logger.debug('Returning cached businesses data');

                // Check if we should refresh in background
                if (this.shouldRefreshInBackground(cacheKey)) {
                    this.logger.debug('Starting background refresh');
                    this.backgroundRefreshPromise = this.fetchFromAPIAndCache();
                }

                return cachedData;
            }

            // No cache, fetch from API
            this.logger.debug('No cached data found, fetching from API');
            return await this.fetchFromAPIAndCache();

        } catch (error) {
            this.logger.error('Error in fetchBusinesses', {
                error: error instanceof Error ? error.message : String(error)
            });

            // Try to return stale cache data as fallback
            const staleData = this.cacheService.get<Business[]>(cacheKey);
            if (staleData) {
                this.logger.warn('Returning stale cached data due to error');
                return staleData;
            }

            // Final fallback to mock data
            this.logger.warn('Falling back to mock data');
            return this.getFallbackData();
        }
    }

    /**
     * Get connection status from HTTP client
     */
    getConnectionStatus() {
        return this.httpClient.getConnectionStatus();
    }

    /**
     * Check if currently online
     */
    isOnline(): boolean {
        return this.httpClient.isOnline();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cacheService.clear();
        this.logger.info('API cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cacheService.getStats();
    }

    // Private methods

    private async fetchFromAPIAndCache(): Promise<Business[]> {
        try {
            this.logger.debug('Fetching businesses from API');

            const data = await benefitsAPI.getBenefits();

            if (!data) {
                throw new ValidationError('API response is empty');
            }

            // Transform and validate the data
            const businesses = this.transformMongoDBResponse(data);

            if (businesses.length === 0) {
                this.logger.warn('No businesses found in API response');
                return this.getFallbackData();
            }

            // Cache the successful response
            this.cacheService.set('businesses', businesses);

            this.logger.info('Successfully fetched and cached businesses', {
                count: businesses.length
            });

            return businesses;

        } catch (error) {
            if (error instanceof NetworkError) {
                this.logger.error('Network error fetching businesses', {
                    error: error.message,
                    context: error.context
                });
                throw new NetworkError('Failed to fetch businesses from API', {
                    originalError: error.message
                });
            }

            if (error instanceof ValidationError) {
                this.logger.error('Data validation error', { error: error.message });
                throw error;
            }

            this.logger.error('Unexpected error fetching businesses', {
                error: error instanceof Error ? error.message : String(error)
            });

            throw new NetworkError('Unexpected error occurred while fetching businesses');
        }
    }

    private transformMongoDBResponse(data: Record<string, unknown>[]): Business[] {
        try {
            this.logger.debug('Transforming MongoDB API response', {
                benefitsCount: data.length
            });

            const businessMap = new Map<string, Business>();

            // Helper functions for safe type conversion
            const getString = (value: unknown): string =>
                typeof value === 'string' ? value : '';

            const getStringOrDefault = (value: unknown, defaultValue: string): string =>
                typeof value === 'string' ? value : defaultValue;

            const getNumber = (value: unknown): number =>
                typeof value === 'number' ? value : 5;

            const getStringArray = (value: unknown): string[] | undefined =>
                Array.isArray(value) && value.every(item => typeof item === 'string') ? value : undefined;

            data.forEach((benefit) => {
                try {
                    // Extract business information from the raw benefit data
                    const businessName = getStringOrDefault(benefit.name, '') ||
                        getStringOrDefault(benefit.titulo, '') ||
                        getStringOrDefault(benefit.business_name, '') ||
                        'Unknown Business';

                    const category = getStringOrDefault(benefit.category, '') ||
                        getStringOrDefault(benefit.categoria, '') ||
                        'otros';

                    const description = getStringOrDefault(benefit.description, '') ||
                        getStringOrDefault(benefit.descripcion, '') ||
                        getStringOrDefault(benefit.cabecera, '') ||
                        'No description available';

                    const image = getStringOrDefault(benefit.image, '') ||
                        getStringOrDefault(benefit.imagen, '') ||
                        'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400';

                    if (!businessMap.has(businessName)) {
                        businessMap.set(businessName, {
                            id: getString(benefit._id) || getString(benefit.id) || businessName,
                            name: businessName,
                            category: category,
                            description: description,
                            rating: getNumber(benefit.rating),
                            location: getStringOrDefault(benefit.location, '') ||
                                getStringOrDefault(benefit.ubicacion, '') ||
                                'Multiple locations',
                            image: image,
                            benefits: [],
                        });
                    }

                    // Add benefit to the business
                    const business = businessMap.get(businessName)!;
                    const bankBenefit: BankBenefit = {
                        bankName: getStringOrDefault(benefit.bank, '') ||
                            getStringOrDefault(benefit.banco, '') ||
                            'Bank',
                        cardName: getStringOrDefault(benefit.card, '') ||
                            getStringOrDefault(benefit.tarjeta, '') ||
                            'Credit Card',
                        benefit: getStringOrDefault(benefit.benefit, '') ||
                            getStringOrDefault(benefit.beneficio, '') ||
                            description,
                        rewardRate: getStringOrDefault(benefit.reward_rate, '') ||
                            getStringOrDefault(benefit.tasa_recompensa, '') ||
                            getStringOrDefault(benefit.valor, '') ||
                            'N/A',
                        color: getStringOrDefault(benefit.color, 'bg-blue-500'),
                        icon: getStringOrDefault(benefit.icon, 'CreditCard'),
                        // Map additional fields from raw benefit data
                        tipo: getString(benefit.tipo) || undefined,
                        cuando: getString(benefit.cuando) || undefined,
                        valor: getString(benefit.valor) || undefined,
                        tope: getString(benefit.tope) || undefined,
                        claseDeBeneficio: getString(benefit.claseDeBeneficio) ||
                            getString(benefit.clase_beneficio) ||
                            undefined,
                        condicion: getString(benefit.condicion) || undefined,
                        requisitos: getStringArray(benefit.requisitos),
                        usos: getStringArray(benefit.usos),
                        textoAplicacion: getString(benefit.textoAplicacion) ||
                            getString(benefit.texto_aplicacion) ||
                            undefined,
                    };

                    business.benefits.push(bankBenefit);
                } catch (error) {
                    this.logger.warn('Error transforming MongoDB benefit', {
                        benefitId: getString(benefit._id) || getString(benefit.id),
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            });

            const businesses = Array.from(businessMap.values());

            // Validate the transformed data
            this.validateBusinesses(businesses);

            this.logger.info('Successfully transformed MongoDB response', {
                businessCount: businesses.length
            });

            return businesses;

        } catch (error) {
            this.logger.error('Error transforming MongoDB API response', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new ValidationError('Failed to transform MongoDB API response data');
        }
    }





    private validateBusinesses(businesses: Business[]): void {
        if (!Array.isArray(businesses)) {
            throw new ValidationError('Businesses data is not an array');
        }

        businesses.forEach((business, index) => {
            if (!business.id || !business.name) {
                throw new ValidationError(`Business at index ${index} missing required fields`);
            }

            if (!Array.isArray(business.benefits)) {
                throw new ValidationError(`Business ${business.id} has invalid benefits array`);
            }
        });

        this.logger.debug('Business data validation passed', { count: businesses.length });
    }

    private shouldRefreshInBackground(cacheKey: string): boolean {
        // Check if cache entry exists and is older than background refresh threshold
        const entry = this.cacheService.get(cacheKey);
        if (!entry) return false;

        // For now, we'll use a simple heuristic - if we have a background refresh promise running, don't start another
        if (this.backgroundRefreshPromise) return false;

        // In a real implementation, we'd check the cache entry timestamp
        // For now, we'll refresh every other request to demonstrate the functionality
        return Math.random() > 0.7; // 30% chance to refresh in background
    }

    private getFallbackData(): Business[] {
        this.logger.warn('No fallback data available - returning empty array');
        return []; // Return empty array instead of mock data
    }


}