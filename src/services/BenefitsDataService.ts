import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { fetchAllBusinessesComplete } from './api';
import { getRawBenefits as getRawBenefitsFromAPI } from './rawBenefitsApi';

/**
 * Simple cache implementation using localStorage
 */
class SimpleCache {
    private prefix = 'benefits_cache_';

    set(key: string, data: unknown, ttl: number): void {
        const item = {
            data,
            timestamp: Date.now(),
            ttl
        };
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }

    get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            const now = Date.now();

            if (now - parsed.timestamp > parsed.ttl) {
                localStorage.removeItem(this.prefix + key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.warn('Failed to get cached data:', error);
            return null;
        }
    }

    clear(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    isValid(key: string): boolean {
        return this.get(key) !== null;
    }

    getStats() {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
            let totalSize = 0;
            let oldestEntry = Date.now();
            let newestEntry = 0;

            cacheKeys.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    totalSize += item.length;
                    try {
                        const parsed = JSON.parse(item);
                        if (parsed.timestamp) {
                            oldestEntry = Math.min(oldestEntry, parsed.timestamp);
                            newestEntry = Math.max(newestEntry, parsed.timestamp);
                        }
                    } catch {
                        // ignore parsing errors
                    }
                }
            });

            return {
                totalEntries: cacheKeys.length,
                totalSize,
                hitRate: 0.8, // Mock value
                missRate: 0.2, // Mock value
                oldestEntry: oldestEntry === Date.now() ? 0 : oldestEntry,
                newestEntry
            };
        } catch {
            return {
                totalEntries: 0,
                totalSize: 0,
                hitRate: 0,
                missRate: 0,
                oldestEntry: 0,
                newestEntry: 0
            };
        }
    }
}

/**
 * Centralized Benefits Data Service with intelligent caching
 * 
 * This service provides a single source of truth for benefits data,
 * preventing unnecessary refetches when navigating between pages.
 */
export class BenefitsDataService {
    private static instance: BenefitsDataService;
    private cache: SimpleCache;
    private initialized = false;

    // Cache keys
    private static readonly CACHE_KEYS = {
        ALL_BUSINESSES: 'all_businesses',
        RAW_BENEFITS: 'raw_benefits',
        FEATURED_BENEFITS: 'featured_benefits'
    } as const;

    // Cache TTL (Time To Live) - 30 minutes
    private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    private constructor() {
        this.cache = new SimpleCache();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): BenefitsDataService {
        if (!BenefitsDataService.instance) {
            BenefitsDataService.instance = new BenefitsDataService();
        }
        return BenefitsDataService.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
    }

    /**
     * Get all businesses with caching
     */
    public async getAllBusinesses(forceRefresh = false): Promise<Business[]> {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = BenefitsDataService.CACHE_KEYS.ALL_BUSINESSES;

        // Check cache first (unless force refresh is requested)
        if (!forceRefresh) {
            const cachedData = this.cache.get<Business[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        try {
            const businesses = await fetchAllBusinessesComplete();

            // Cache the data
            this.cache.set(cacheKey, businesses, BenefitsDataService.CACHE_TTL);

            return businesses;
        } catch (error) {
            // Try to return stale cached data as fallback
            const staleData = this.cache.get<Business[]>(cacheKey);
            if (staleData) {
                return staleData;
            }

            // If no cached data and it's a CORS error, provide minimal fallback
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const fallbackData: Business[] = [
                    {
                        id: 'demo-business-1',
                        name: 'Demo Restaurant',
                        category: 'gastronomia',
                        description: 'Demo business for testing cache functionality',
                        rating: 4.5,
                        location: [{
                            lat: -33.4489,
                            lng: -70.6693,
                            formattedAddress: 'Santiago, Chile',
                            source: 'address' as const,
                            provider: 'google' as const,
                            confidence: 1.0,
                            raw: 'Santiago, Chile',
                            updatedAt: new Date().toISOString()
                        }],
                        image: 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400',
                        benefits: [{
                            bankName: 'Demo Bank',
                            cardName: 'Demo Card',
                            benefit: '20% de descuento en comidas',
                            rewardRate: '20%',
                            color: 'bg-blue-500',
                            icon: 'CreditCard'
                        }]
                    }
                ];

                // Cache the fallback data temporarily (5 minutes)
                this.cache.set(cacheKey, fallbackData, 5 * 60 * 1000);
                return fallbackData;
            }

            throw error;
        }
    }

    /**
     * Get raw benefits with caching
     */
    public async getRawBenefits(options: {
        limit?: number;
        offset?: number;
        fetchAll?: boolean;
        filters?: Record<string, string>;
        forceRefresh?: boolean;
    } = {}): Promise<RawMongoBenefit[]> {
        if (!this.initialized) {
            await this.initialize();
        }

        const { forceRefresh = false, ...apiOptions } = options;

        // Create cache key based on options
        const cacheKey = `${BenefitsDataService.CACHE_KEYS.RAW_BENEFITS}_${JSON.stringify(apiOptions)}`;

        // Check cache first (unless force refresh is requested)
        if (!forceRefresh) {
            const cachedData = this.cache.get<RawMongoBenefit[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        try {
            const benefits = await getRawBenefitsFromAPI(apiOptions);

            // Cache the data
            this.cache.set(cacheKey, benefits, BenefitsDataService.CACHE_TTL);

            return benefits;
        } catch (error) {
            // Try to return stale cached data as fallback
            const staleData = this.cache.get<RawMongoBenefit[]>(cacheKey);
            if (staleData) {
                return staleData;
            }

            // If no cached data and it's a CORS error, provide minimal fallback
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const fallbackData: RawMongoBenefit[] = [
                    {
                        _id: { $oid: 'demo-benefit-1' },
                        bank: 'Demo Bank',
                        network: 'Demo Network',
                        benefitTitle: 'Demo Benefit - 20% off meals',
                        discountPercentage: 20,
                        merchant: {
                            name: 'Demo Restaurant',
                            type: 'restaurant'
                        },
                        categories: ['gastronomia'],
                        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                        online: false,
                        cardTypes: [{
                            name: 'Demo Credit Card',
                            category: 'credit',
                            mode: 'physical'
                        }],
                        termsAndConditions: 'Demo terms and conditions',
                        link: 'https://example.com',
                        description: 'Demo benefit for testing cache functionality',
                        locations: [],
                        originalId: { $oid: 'demo-original-1' },
                        sourceCollection: 'demo',
                        processedAt: { $date: new Date().toISOString() },
                        processingStatus: 'processed',
                        validUntil: '2024-12-31'
                    }
                ];

                // Cache the fallback data temporarily (5 minutes)
                this.cache.set(cacheKey, fallbackData, 5 * 60 * 1000);
                return fallbackData;
            }

            throw error;
        }
    }

    /**
     * Get featured benefits (first 10 raw benefits) with caching
     */
    public async getFeaturedBenefits(forceRefresh = false): Promise<RawMongoBenefit[]> {
        if (!this.initialized) {
            await this.initialize();
        }

        const cacheKey = BenefitsDataService.CACHE_KEYS.FEATURED_BENEFITS;

        // Check cache first (unless force refresh is requested)
        if (!forceRefresh) {
            const cachedData = this.cache.get<RawMongoBenefit[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        try {
            const benefits = await this.getRawBenefits({ limit: 10, forceRefresh });

            // Cache the featured benefits separately for faster access
            this.cache.set(cacheKey, benefits, BenefitsDataService.CACHE_TTL);

            return benefits;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Refresh all cached data
     */
    public async refreshAllData(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Refresh all main data sources in parallel
            await Promise.all([
                this.getAllBusinesses(true),
                this.getFeaturedBenefits(true)
            ]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Clear all cached data
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Check if data is cached
     */
    public isDataCached(dataType: 'businesses' | 'featured_benefits'): boolean {
        const cacheKey = dataType === 'businesses'
            ? BenefitsDataService.CACHE_KEYS.ALL_BUSINESSES
            : BenefitsDataService.CACHE_KEYS.FEATURED_BENEFITS;

        return this.cache.isValid(cacheKey);
    }

    /**
     * Preload data in the background
     */
    public async preloadData(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }

        // Don't await these - let them run in background
        this.getAllBusinesses().catch(() => {
            // Silent fail for background preload
        });

        this.getFeaturedBenefits().catch(() => {
            // Silent fail for background preload
        });
    }
}

// Export function to get singleton instance (lazy initialization)
export function getBenefitsDataService(): BenefitsDataService {
    return BenefitsDataService.getInstance();
}