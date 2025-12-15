import { Business, BankBenefit, Category } from '../types';
import { DataTransformationService } from '../services/DataTransformationService';

/**
 * Mock data generator that creates consistent data using the same transformation logic
 * as the API response transformer
 */
export class MockDataGenerator {
    private transformationService: DataTransformationService;

    constructor() {
        this.transformationService = new DataTransformationService();
    }

    async initialize(): Promise<void> {
        await this.transformationService.initialize();
    }

    async destroy(): Promise<void> {
        await this.transformationService.destroy();
    }

    /**
     * Generate mock businesses with consistent structure and data
     */
    generateMockBusinesses(): Business[] {
        const mockBusinessData = [
            {
                name: "Starbucks Coffee",
                category: "gastronomia" as Category,
                description: "Global coffeehouse chain known for premium coffee and cozy atmosphere",
                rating: 4.5,
                image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Chase", benefit: "Earn 3x points on dining", rewardRate: "3x points" },
                    { bankName: "Capital One", benefit: "Earn 4% cash back on dining", rewardRate: "4% cash back" },
                    { bankName: "American Express", benefit: "Earn 4x points at restaurants", rewardRate: "4x points" }
                ]
            },
            {
                name: "Shell Gas Station",
                category: "automotores" as Category,
                description: "Leading fuel retailer with convenient locations nationwide",
                rating: 4.2,
                image: "https://images.pexels.com/photos/33488/gasoline-gas-station-refuel-gas.jpg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Chase", benefit: "Rotating 5% categories include gas", rewardRate: "5% quarterly" },
                    { bankName: "Citi", benefit: "Earn 5% on gas purchases", rewardRate: "5% cash back" }
                ]
            },
            {
                name: "Target",
                category: "shopping" as Category,
                description: "Popular retail chain offering everything from groceries to home goods",
                rating: 4.3,
                image: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Target", benefit: "5% off every purchase", rewardRate: "5% discount" },
                    { bankName: "Chase", benefit: "Earn 1.5% on all purchases", rewardRate: "1.5% cash back" }
                ]
            },
            {
                name: "Whole Foods Market",
                category: "gastronomia" as Category,
                description: "Premium grocery chain specializing in organic and natural foods",
                rating: 4.4,
                image: "https://images.pexels.com/photos/1435752/pexels-photo-1435752.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Amazon", benefit: "5% back at Whole Foods for Prime members", rewardRate: "5% cash back" },
                    { bankName: "American Express", benefit: "Earn 6% on supermarkets", rewardRate: "6% cash back" }
                ]
            },
            {
                name: "Netflix",
                category: "entretenimiento" as Category,
                description: "Leading streaming entertainment service with original content",
                rating: 4.1,
                image: "https://images.pexels.com/photos/265685/pexels-photo-265685.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Chase", benefit: "Earn 3x points on streaming", rewardRate: "3x points" },
                    { bankName: "American Express", benefit: "Earn 1.5% on all purchases", rewardRate: "1.5% cash back" }
                ]
            },
            {
                name: "Hilton Hotels",
                category: "viajes" as Category,
                description: "Global hospitality company with luxury and business hotels",
                rating: 4.6,
                image: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Hilton", benefit: "Earn 7x points at Hilton properties", rewardRate: "7x points" },
                    { bankName: "Chase", benefit: "Earn 2x points on travel", rewardRate: "2x points" },
                    { bankName: "Capital One", benefit: "Earn 2x miles on all purchases", rewardRate: "2x miles" }
                ]
            },
            {
                name: "Zara",
                category: "moda" as Category,
                description: "International fashion retailer offering trendy clothing and accessories",
                rating: 4.0,
                image: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "BBVA", benefit: "10% discount on fashion purchases", rewardRate: "10% discount" },
                    { bankName: "Santander", benefit: "Earn 2x points on clothing", rewardRate: "2x points" }
                ]
            },
            {
                name: "Fitness First",
                category: "deportes" as Category,
                description: "Premium fitness center with state-of-the-art equipment and classes",
                rating: 4.3,
                image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Banco Nación", benefit: "15% discount on monthly memberships", rewardRate: "15% discount" },
                    { bankName: "Galicia", benefit: "Cashback on fitness expenses", rewardRate: "5% cashback" }
                ]
            },
            {
                name: "IKEA",
                category: "hogar" as Category,
                description: "Swedish furniture retailer known for affordable home furnishing solutions",
                rating: 4.2,
                image: "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Macro", benefit: "Special financing on home purchases", rewardRate: "0% interest" },
                    { bankName: "HSBC", benefit: "Earn points on home improvement", rewardRate: "3x points" }
                ]
            },
            {
                name: "Sephora",
                category: "belleza" as Category,
                description: "Beauty retailer offering cosmetics, skincare, and fragrance products",
                rating: 4.4,
                image: "https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=400",
                bankBenefits: [
                    { bankName: "Itaú", benefit: "Beauty rewards program", rewardRate: "4x points" },
                    { bankName: "Patagonia", benefit: "Monthly beauty discounts", rewardRate: "8% discount" }
                ]
            }
        ];

        return mockBusinessData.map((data, index) => {
            // Generate consistent business ID
            const businessId = this.generateBusinessId(data.name);

            // Create bank benefits with consistent colors
            const benefits: BankBenefit[] = data.bankBenefits.map(bankBenefit => ({
                bankName: bankBenefit.bankName,
                cardName: this.generateCardName(bankBenefit.bankName),
                benefit: bankBenefit.benefit,
                rewardRate: bankBenefit.rewardRate,
                color: this.transformationService.assignConsistentColor(bankBenefit.bankName),
                icon: 'CreditCard'
            }));

            // Create business with all required fields
            const business: Business = {
                id: businessId,
                name: data.name,
                category: data.category,
                description: data.description,
                rating: data.rating,
                location: 'Multiple locations',
                image: data.image,
                benefits,
                // Enhanced fields for new functionality
                lastUpdated: Date.now() - Math.floor(Math.random() * 3600000), // Random time within last hour
                imageLoaded: true
            };

            return business;
        });
    }

    /**
     * Generate business ID using the same algorithm as DataTransformationService
     */
    private generateBusinessId(name: string): string {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) || 'unknown-business';
    }

    /**
     * Generate card name using similar logic as DataTransformationService
     */
    private generateCardName(bankName: string): string {
        const cardTypes = ['Credit Card', 'Rewards Card', 'Premium Card', 'Business Card'];

        // Simple hash to consistently assign card type
        let hash = 0;
        for (let i = 0; i < bankName.length; i++) {
            hash = ((hash << 5) - hash + bankName.charCodeAt(i)) & 0xffffffff;
        }

        return cardTypes[Math.abs(hash) % cardTypes.length];
    }

    /**
     * Reset color assignments (useful for testing)
     */
    resetColorAssignments(): void {
        this.transformationService.resetColorAssignments();
    }

    /**
     * Get current color assignments
     */
    getColorAssignments(): Map<string, string> {
        return this.transformationService.getColorAssignments();
    }
}

// Create singleton instance for consistent color assignments
let mockDataGeneratorInstance: MockDataGenerator | null = null;

/**
 * Get or create the mock data generator instance
 */
export async function getMockDataGenerator(): Promise<MockDataGenerator> {
    if (!mockDataGeneratorInstance) {
        mockDataGeneratorInstance = new MockDataGenerator();
        await mockDataGeneratorInstance.initialize();
    }
    return mockDataGeneratorInstance;
}

/**
 * Generate mock businesses using the consistent data generator
 */
export async function generateConsistentMockData(): Promise<Business[]> {
    const generator = await getMockDataGenerator();
    return generator.generateMockBusinesses();
}