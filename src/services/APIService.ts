import { AbstractBaseService, Logger, NetworkError, ValidationError } from './base';
import { CacheService } from './CacheService';
import { HTTPClient } from './HTTPClient';
import { Business, BankBenefit } from '../types';
import { mockBusinesses } from '../data/mockData';

/**
 * Raw API response interfaces
 */
interface BenefitResponse {
    _id: { $oid: string };
    id: string;
    beneficios: Array<{
        tipo?: string;
        cuando?: string;
        valor?: string;
        cuota?: { $numberInt: string };
        tope?: string;
        claseDeBeneficio?: string;
        casuistica?: { descripcion: string };
        condicion?: string;
        requisitos?: string[];
        usos?: string[];
        textoAplicacion?: string;
    }>;
    cabecera: string;
    destacado: boolean;
    details: {
        beneficio: {
            titulo: string;
            rubros: { id: number; nombre: string }[];
            subtitulo: string;
            imagen: string;
            vigencia: string;
            subcabecera: string;
            cabecera: string;
        };
    };
}

interface AllBenefits {
    [key: string]: BenefitResponse[];
}

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

            const response = await this.httpClient.get<AllBenefits>('/api/benefits');

            if (!response.data) {
                throw new ValidationError('API response is empty');
            }

            // Transform and validate the data
            const businesses = this.transformAPIResponse(response.data);

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

    private transformAPIResponse(data: AllBenefits): Business[] {
        try {
            this.logger.debug('Transforming API response', {
                banks: Object.keys(data).length
            });

            const businessMap = new Map<string, Business>();

            // Iterate through each bank's benefits
            Object.entries(data).forEach(([bankKey, benefits]) => {
                if (!Array.isArray(benefits)) {
                    this.logger.warn('Invalid benefits data for bank', { bankKey });
                    return;
                }

                benefits.forEach((benefit) => {
                    try {
                        const transformedBusiness = this.transformBenefit(bankKey, benefit);
                        if (transformedBusiness) {
                            const { business, bankBenefit } = transformedBusiness;

                            if (!businessMap.has(business.id)) {
                                businessMap.set(business.id, business);
                            }

                            // Add the bank benefit to the existing business
                            const existingBusiness = businessMap.get(business.id)!;
                            existingBusiness.benefits.push(bankBenefit);
                        }
                    } catch (error) {
                        this.logger.warn('Error transforming benefit', {
                            bankKey,
                            benefitId: benefit.id,
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                });
            });

            const businesses = Array.from(businessMap.values());

            // Validate the transformed data
            this.validateBusinesses(businesses);

            return businesses;

        } catch (error) {
            this.logger.error('Error transforming API response', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new ValidationError('Failed to transform API response data');
        }
    }

    private transformBenefit(bankKey: string, benefit: BenefitResponse): { business: Business; bankBenefit: BankBenefit } | null {
        // Validate required fields
        if (!benefit.details?.beneficio?.titulo) {
            this.logger.warn('Benefit missing required titulo field', { benefitId: benefit.id });
            return null;
        }

        const titulo = benefit.details.beneficio.titulo;
        const category = benefit.details.beneficio.rubros?.[0]?.nombre || 'otros';
        const description = benefit.cabecera || 'No description available';
        const bankName = this.formatBankName(bankKey);

        // Create business object
        const business: Business = {
            id: this.generateBusinessId(titulo),
            name: titulo,
            category: this.validateCategory(category),
            description: this.sanitizeText(description),
            rating: 5, // Default rating
            location: 'Multiple locations',
            image: this.validateImageUrl(benefit.details.beneficio.imagen),
            benefits: [],
            lastUpdated: Date.now()
        };

        // Create bank benefit
        const firstBenefit = benefit.beneficios?.[0];
        const rewardRate = firstBenefit?.valor || 'N/A';
        const benefitDescription =
            firstBenefit?.casuistica?.descripcion ||
            benefit.details.beneficio.subtitulo ||
            'Benefit available';

        // Extract all fields from beneficios array, handling missing or empty values
        const bankBenefit: BankBenefit = {
            bankName,
            cardName: 'Credit Card',
            benefit: this.sanitizeText(benefitDescription),
            rewardRate: this.sanitizeText(rewardRate),
            color: this.assignBankColor(bankName),
            icon: 'CreditCard',
            // Extract all new fields from the first beneficio, with fallbacks
            tipo: firstBenefit?.tipo || undefined,
            cuando: firstBenefit?.cuando || undefined,
            valor: firstBenefit?.valor || undefined,
            tope: firstBenefit?.tope || undefined,
            claseDeBeneficio: firstBenefit?.claseDeBeneficio || undefined,
            condicion: firstBenefit?.condicion || undefined,
            requisitos: firstBenefit?.requisitos && firstBenefit.requisitos.length > 0
                ? firstBenefit.requisitos.filter(req => req && req.trim() !== '')
                : undefined,
            usos: firstBenefit?.usos && firstBenefit.usos.length > 0
                ? firstBenefit.usos.filter(uso => uso && uso.trim() !== '')
                : undefined,
            textoAplicacion: firstBenefit?.textoAplicacion || undefined,
        };

        return { business, bankBenefit };
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
        this.logger.info('Using fallback mock data');
        return mockBusinesses.map(business => ({
            ...business,
            lastUpdated: Date.now()
        }));
    }

    private generateBusinessId(titulo: string): string {
        return titulo.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    private validateCategory(category: string): string {
        const validCategories = [
            'gastronomia', 'moda', 'entretenimiento', 'otros', 'deportes',
            'regalos', 'viajes', 'automotores', 'belleza', 'jugueterias',
            'hogar', 'electro', 'shopping'
        ];

        const normalizedCategory = category.toLowerCase();
        return validCategories.includes(normalizedCategory) ? normalizedCategory : 'otros';
    }

    private validateImageUrl(url?: string): string {
        const defaultImage = 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400';

        if (!url) return defaultImage;

        try {
            new URL(url);
            return url;
        } catch {
            this.logger.warn('Invalid image URL, using default', { url });
            return defaultImage;
        }
    }

    private sanitizeText(text: string): string {
        if (typeof text !== 'string') return '';

        return text
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 500); // Limit length
    }

    private formatBankName(bankKey: string): string {
        // Handle specific BBVA case
        if (bankKey.includes('BBVA')) {
            return 'BBVA';
        }

        return bankKey
            .replace(/_GO$/, '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    private assignBankColor(bankName: string): string {
        // Simple hash-based color assignment for consistency
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
            'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
        ];

        let hash = 0;
        for (let i = 0; i < bankName.length; i++) {
            hash = ((hash << 5) - hash + bankName.charCodeAt(i)) & 0xffffffff;
        }

        return colors[Math.abs(hash) % colors.length];
    }
}