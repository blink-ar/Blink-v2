import { Business, BankBenefit, Category } from '../types';
import { AbstractBaseService, Logger, ValidationError } from './base';

/**
 * Raw API response interfaces
 */
export interface BenefitResponse {
    _id: { $oid: string };
    id: string;
    beneficios: Array<{
        tipo: string;
        cuando: string;
        valor: string;
        cuota: { $numberInt: string };
        tope: string;
        claseDeBeneficio: string;
        casuistica: { descripcion: string };
        condicion: string;
        requisitos: string[];
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

export interface AllBenefits {
    [key: string]: BenefitResponse[];
}

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
    isValid: boolean;
    data?: T;
    errors: string[];
}

/**
 * Color assignment configuration
 */
interface ColorConfig {
    colors: string[];
    bankColorMap: Map<string, string>;
}

/**
 * Data transformation utilities service
 * Handles API response validation, transformation, and data consistency
 */
export class DataTransformationService extends AbstractBaseService {
    private logger: Logger;
    private colorConfig: ColorConfig;

    constructor() {
        super();
        this.logger = Logger.getInstance('DataTransformationService');
        this.colorConfig = this.initializeColorConfig();
    }

    getServiceName(): string {
        return 'DataTransformationService';
    }

    protected async onInitialize(): Promise<void> {
        this.logger.info('Initializing DataTransformationService');
    }

    protected async onDestroy(): Promise<void> {
        this.logger.info('Destroying DataTransformationService');
    }

    /**
     * Transform API response to Business array
     */
    transformAPIResponse(data: AllBenefits): ValidationResult<Business[]> {
        try {
            this.logger.debug('Transforming API response', {
                banks: Object.keys(data).length
            });

            const businessMap = new Map<string, Business>();
            const errors: string[] = [];

            // Iterate through each bank's benefits
            Object.entries(data).forEach(([bankKey, benefits]) => {
                if (!Array.isArray(benefits)) {
                    errors.push(`Invalid benefits data for bank: ${bankKey}`);
                    return;
                }

                benefits.forEach((benefit, index) => {
                    try {
                        const transformResult = this.transformBenefit(bankKey, benefit);
                        if (transformResult.isValid && transformResult.data) {
                            const { business, bankBenefit } = transformResult.data;

                            if (!businessMap.has(business.id)) {
                                businessMap.set(business.id, business);
                            }

                            // Add the bank benefit to the existing business
                            const existingBusiness = businessMap.get(business.id)!;
                            existingBusiness.benefits.push(bankBenefit);
                        } else {
                            errors.push(`Failed to transform benefit ${index} for bank ${bankKey}: ${transformResult.errors.join(', ')}`);
                        }
                    } catch (error) {
                        errors.push(`Error transforming benefit ${index} for bank ${bankKey}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                });
            });

            const businesses = Array.from(businessMap.values());

            // Validate the transformed businesses
            const validationResult = this.validateBusinesses(businesses);
            if (!validationResult.isValid) {
                errors.push(...validationResult.errors);
            }

            return {
                isValid: errors.length === 0,
                data: businesses,
                errors
            };

        } catch (error) {
            const errorMessage = `Error transforming API response: ${error instanceof Error ? error.message : String(error)}`;
            this.logger.error(errorMessage);
            return {
                isValid: false,
                errors: [errorMessage]
            };
        }
    }

    /**
     * Transform a single benefit to business and bank benefit
     */
    transformBenefit(bankKey: string, benefit: BenefitResponse): ValidationResult<{ business: Business; bankBenefit: BankBenefit }> {
        const errors: string[] = [];

        try {
            // Validate required fields
            if (!benefit.details?.beneficio?.titulo) {
                errors.push('Benefit missing required titulo field');
                return { isValid: false, errors };
            }

            const titulo = benefit.details.beneficio.titulo;
            const category = benefit.details.beneficio.rubros?.[0]?.nombre || 'otros';
            const description = benefit.cabecera || '';
            const bankName = this.formatBankName(bankKey);

            // Generate fallback values
            const fallbackValues = this.generateFallbackValues(titulo, category, description);

            // Create business object
            const business: Business = {
                id: this.generateBusinessId(titulo),
                name: this.sanitizeText(titulo) || fallbackValues.name,
                category: this.validateAndNormalizeCategory(category),
                description: this.sanitizeText(description) || fallbackValues.description,
                rating: fallbackValues.rating,
                location: fallbackValues.location,
                image: this.validateImageUrl(benefit.details.beneficio.imagen),
                benefits: [],
                lastUpdated: Date.now()
            };

            // Create bank benefit
            const rewardRate = benefit.beneficios?.[0]?.valor || 'N/A';
            const benefitDescription =
                benefit.beneficios?.[0]?.casuistica?.descripcion ||
                benefit.details.beneficio.subtitulo ||
                'Benefit available';

            const bankBenefit: BankBenefit = {
                bankName,
                cardName: this.generateCardName(bankName),
                benefit: this.sanitizeText(benefitDescription) || fallbackValues.benefit,
                rewardRate: this.sanitizeText(rewardRate) || fallbackValues.rewardRate,
                color: this.assignConsistentColor(bankName),
                icon: 'CreditCard'
            };

            return {
                isValid: true,
                data: { business, bankBenefit },
                errors: []
            };

        } catch (error) {
            const errorMessage = `Error transforming benefit: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMessage);
            return { isValid: false, errors };
        }
    }

    /**
     * Validate array of businesses
     */
    validateBusinesses(businesses: Business[]): ValidationResult<Business[]> {
        const errors: string[] = [];

        if (!Array.isArray(businesses)) {
            errors.push('Businesses data is not an array');
            return { isValid: false, errors };
        }

        businesses.forEach((business, index) => {
            const businessValidation = this.validateBusiness(business);
            if (!businessValidation.isValid) {
                errors.push(`Business at index ${index}: ${businessValidation.errors.join(', ')}`);
            }
        });

        return {
            isValid: errors.length === 0,
            data: businesses,
            errors
        };
    }

    /**
     * Validate a single business object
     */
    validateBusiness(business: Business): ValidationResult<Business> {
        const errors: string[] = [];

        // Required fields validation
        if (!business.id || typeof business.id !== 'string') {
            errors.push('Missing or invalid id');
        }

        if (!business.name || typeof business.name !== 'string') {
            errors.push('Missing or invalid name');
        }

        if (!business.category || typeof business.category !== 'string') {
            errors.push('Missing or invalid category');
        }

        if (typeof business.rating !== 'number' || business.rating < 0 || business.rating > 5) {
            errors.push('Invalid rating (must be number between 0-5)');
        }

        if (!Array.isArray(business.benefits)) {
            errors.push('Benefits must be an array');
        } else {
            business.benefits.forEach((benefit, index) => {
                const benefitValidation = this.validateBankBenefit(benefit);
                if (!benefitValidation.isValid) {
                    errors.push(`Benefit ${index}: ${benefitValidation.errors.join(', ')}`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            data: business,
            errors
        };
    }

    /**
     * Validate a bank benefit object
     */
    validateBankBenefit(benefit: BankBenefit): ValidationResult<BankBenefit> {
        const errors: string[] = [];

        if (!benefit.bankName || typeof benefit.bankName !== 'string') {
            errors.push('Missing or invalid bankName');
        }

        if (!benefit.cardName || typeof benefit.cardName !== 'string') {
            errors.push('Missing or invalid cardName');
        }

        if (!benefit.benefit || typeof benefit.benefit !== 'string') {
            errors.push('Missing or invalid benefit');
        }

        if (!benefit.rewardRate || typeof benefit.rewardRate !== 'string') {
            errors.push('Missing or invalid rewardRate');
        }

        if (!benefit.color || typeof benefit.color !== 'string') {
            errors.push('Missing or invalid color');
        }

        return {
            isValid: errors.length === 0,
            data: benefit,
            errors
        };
    }

    /**
     * Generate fallback values for missing data
     */
    generateFallbackValues(titulo: string, category: string, description: string) {
        return {
            name: titulo || 'Unknown Business',
            description: description || `Business in ${category} category`,
            rating: 4.0, // Default rating
            location: [{
                lat: 0,
                lng: 0,
                formattedAddress: 'Multiple locations',
                source: 'address' as const,
                provider: 'google' as const,
                confidence: 0.5,
                raw: 'Multiple locations',
                updatedAt: new Date().toISOString()
            }],
            benefit: 'Special offer available',
            rewardRate: 'Contact for details'
        };
    }

    /**
     * Consistent color assignment algorithm
     */
    assignConsistentColor(bankName: string): string {
        // Check if we already have a color assigned to this bank
        if (this.colorConfig.bankColorMap.has(bankName)) {
            return this.colorConfig.bankColorMap.get(bankName)!;
        }

        // Generate consistent hash for the bank name
        let hash = 0;
        for (let i = 0; i < bankName.length; i++) {
            hash = ((hash << 5) - hash + bankName.charCodeAt(i)) & 0xffffffff;
        }

        // Select color based on hash
        const colorIndex = Math.abs(hash) % this.colorConfig.colors.length;
        const selectedColor = this.colorConfig.colors[colorIndex];

        // Store the assignment for consistency
        this.colorConfig.bankColorMap.set(bankName, selectedColor);

        return selectedColor;
    }

    /**
     * Reset color assignments (useful for testing)
     */
    resetColorAssignments(): void {
        this.colorConfig.bankColorMap.clear();
    }

    /**
     * Get current color assignments
     */
    getColorAssignments(): Map<string, string> {
        return new Map(this.colorConfig.bankColorMap);
    }

    // Private utility methods

    private initializeColorConfig(): ColorConfig {
        return {
            colors: [
                'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
                'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
                'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
            ],
            bankColorMap: new Map()
        };
    }

    private generateBusinessId(titulo: string): string {
        return titulo.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) || 'unknown-business';
    }

    private validateAndNormalizeCategory(category: string): Category {
        const validCategories: Category[] = [
            'gastronomia', 'moda', 'entretenimiento', 'otros', 'deportes',
            'regalos', 'viajes', 'automotores', 'belleza', 'jugueterias',
            'hogar', 'electro', 'shopping'
        ];

        const normalizedCategory = category.toLowerCase().trim() as Category;
        return validCategories.includes(normalizedCategory) ? normalizedCategory : 'otros';
    }

    private validateImageUrl(url?: string): string {
        const defaultImage = 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400';

        if (!url || typeof url !== 'string') return defaultImage;

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
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 500); // Limit length
    }

    private formatBankName(bankKey: string): string {
        // Handle specific cases
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

    private generateCardName(bankName: string): string {
        // Generate a more specific card name based on bank
        const cardTypes = ['Credit Card', 'Rewards Card', 'Premium Card', 'Business Card'];

        // Simple hash to consistently assign card type
        let hash = 0;
        for (let i = 0; i < bankName.length; i++) {
            hash = ((hash << 5) - hash + bankName.charCodeAt(i)) & 0xffffffff;
        }

        return cardTypes[Math.abs(hash) % cardTypes.length];
    }
}