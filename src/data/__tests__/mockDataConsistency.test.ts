import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockBusinesses } from '../mockData';
import { MockDataGenerator, generateConsistentMockData } from '../mockDataGenerator';
import { DataTransformationService } from '../../services/DataTransformationService';
import { Business, BankBenefit, Category } from '../../types';

describe('Mock Data Consistency', () => {
    let transformationService: DataTransformationService;
    let mockDataGenerator: MockDataGenerator;

    beforeEach(async () => {
        transformationService = new DataTransformationService();
        await transformationService.initialize();

        mockDataGenerator = new MockDataGenerator();
        await mockDataGenerator.initialize();
    });

    afterEach(async () => {
        await transformationService.destroy();
        await mockDataGenerator.destroy();
    });

    describe('mockBusinesses structure validation', () => {
        it('should have valid structure for all businesses', () => {
            mockBusinesses.forEach((business, index) => {
                const validation = transformationService.validateBusiness(business);
                expect(validation.isValid, `Business at index ${index} should be valid: ${validation.errors.join(', ')}`).toBe(true);
            });
        });

        it('should use valid categories only', () => {
            const validCategories: Category[] = [
                'gastronomia', 'moda', 'entretenimiento', 'otros', 'deportes',
                'regalos', 'viajes', 'automotores', 'belleza', 'jugueterias',
                'hogar', 'electro', 'shopping'
            ];

            mockBusinesses.forEach((business, index) => {
                expect(validCategories.includes(business.category as Category),
                    `Business at index ${index} has invalid category: ${business.category}`).toBe(true);
            });
        });

        it('should have consistent ID format', () => {
            const idPattern = /^[a-z0-9-]+$/;

            mockBusinesses.forEach((business, index) => {
                expect(business.id, `Business at index ${index} should have valid ID format`).toMatch(idPattern);
                expect(business.id.length, `Business at index ${index} ID should not be too long`).toBeLessThanOrEqual(50);
            });
        });

        it('should have all enhanced fields', () => {
            mockBusinesses.forEach((business, index) => {
                expect(business.lastUpdated, `Business at index ${index} should have lastUpdated`).toBeDefined();
                expect(typeof business.lastUpdated, `Business at index ${index} lastUpdated should be number`).toBe('number');

                expect(business.isFavorite, `Business at index ${index} should have isFavorite`).toBeDefined();
                expect(typeof business.isFavorite, `Business at index ${index} isFavorite should be boolean`).toBe('boolean');

                expect(business.imageLoaded, `Business at index ${index} should have imageLoaded`).toBeDefined();
                expect(typeof business.imageLoaded, `Business at index ${index} imageLoaded should be boolean`).toBe('boolean');
            });
        });

        it('should have valid benefit structure', () => {
            mockBusinesses.forEach((business, index) => {
                business.benefits.forEach((benefit, benefitIndex) => {
                    const validation = transformationService.validateBankBenefit(benefit);
                    expect(validation.isValid,
                        `Business ${index}, benefit ${benefitIndex} should be valid: ${validation.errors.join(', ')}`).toBe(true);
                });
            });
        });

        it('should have consistent color format', () => {
            const colorPattern = /^bg-\w+-\d+$/;

            mockBusinesses.forEach((business, index) => {
                business.benefits.forEach((benefit, benefitIndex) => {
                    expect(benefit.color,
                        `Business ${index}, benefit ${benefitIndex} should have valid color format`).toMatch(colorPattern);
                });
            });
        });
    });

    describe('MockDataGenerator consistency', () => {
        it('should generate data with same structure as static mock data', async () => {
            const generatedData = await generateConsistentMockData();

            // Validate structure consistency
            generatedData.forEach((business, index) => {
                const validation = transformationService.validateBusiness(business);
                expect(validation.isValid, `Generated business at index ${index} should be valid: ${validation.errors.join(', ')}`).toBe(true);
            });
        });

        it('should generate consistent colors for same banks', async () => {
            const generatedData = await generateConsistentMockData();
            const bankColorMap = new Map<string, string>();

            // Collect all bank-color mappings
            generatedData.forEach(business => {
                business.benefits.forEach(benefit => {
                    if (bankColorMap.has(benefit.bankName)) {
                        expect(bankColorMap.get(benefit.bankName),
                            `Bank ${benefit.bankName} should have consistent color`).toBe(benefit.color);
                    } else {
                        bankColorMap.set(benefit.bankName, benefit.color);
                    }
                });
            });
        });

        it('should generate valid business IDs', async () => {
            const generatedData = await generateConsistentMockData();
            const idPattern = /^[a-z0-9-]+$/;

            generatedData.forEach((business, index) => {
                expect(business.id, `Generated business at index ${index} should have valid ID`).toMatch(idPattern);
                expect(business.id.length, `Generated business at index ${index} ID should not be too long`).toBeLessThanOrEqual(50);
            });
        });

        it('should use only valid categories', async () => {
            const generatedData = await generateConsistentMockData();
            const validCategories: Category[] = [
                'gastronomia', 'moda', 'entretenimiento', 'otros', 'deportes',
                'regalos', 'viajes', 'automotores', 'belleza', 'jugueterias',
                'hogar', 'electro', 'shopping'
            ];

            generatedData.forEach((business, index) => {
                expect(validCategories.includes(business.category as Category),
                    `Generated business at index ${index} has invalid category: ${business.category}`).toBe(true);
            });
        });
    });

    describe('Data transformation consistency', () => {
        it('should produce same structure as mock data when transforming API response', () => {
            // Create a mock API response that should produce similar structure
            const mockAPIResponse = {
                'CHASE_BANK': [{
                    _id: { $oid: '123' },
                    id: 'test-benefit',
                    beneficios: [{
                        tipo: 'descuento',
                        cuando: 'siempre',
                        valor: '5%',
                        cuota: { $numberInt: '1' },
                        tope: 'sin tope',
                        claseDeBeneficio: 'descuento',
                        casuistica: { descripcion: 'Descuento en compras' },
                        condicion: 'ninguna',
                        requisitos: []
                    }],
                    cabecera: 'Test business description',
                    destacado: true,
                    details: {
                        beneficio: {
                            titulo: 'Test Business',
                            rubros: [{ id: 1, nombre: 'gastronomia' }],
                            subtitulo: 'Test subtitle',
                            imagen: 'https://example.com/image.jpg',
                            vigencia: '2024-12-31',
                            subcabecera: 'Sub',
                            cabecera: 'Header'
                        }
                    }
                }]
            };

            const result = transformationService.transformAPIResponse(mockAPIResponse);
            expect(result.isValid).toBe(true);
            expect(result.data).toBeDefined();

            const transformedBusiness = result.data![0];

            // Verify it has the same structure as mock businesses
            expect(transformedBusiness).toHaveProperty('id');
            expect(transformedBusiness).toHaveProperty('name');
            expect(transformedBusiness).toHaveProperty('category');
            expect(transformedBusiness).toHaveProperty('description');
            expect(transformedBusiness).toHaveProperty('rating');
            expect(transformedBusiness).toHaveProperty('location');
            expect(transformedBusiness).toHaveProperty('image');
            expect(transformedBusiness).toHaveProperty('benefits');
            expect(transformedBusiness).toHaveProperty('lastUpdated');

            // Verify benefit structure
            expect(Array.isArray(transformedBusiness.benefits)).toBe(true);
            if (transformedBusiness.benefits.length > 0) {
                const benefit = transformedBusiness.benefits[0];
                expect(benefit).toHaveProperty('bankName');
                expect(benefit).toHaveProperty('cardName');
                expect(benefit).toHaveProperty('benefit');
                expect(benefit).toHaveProperty('rewardRate');
                expect(benefit).toHaveProperty('color');
                expect(benefit).toHaveProperty('icon');
            }
        });

        it('should handle fallback values consistently', () => {
            const fallbacks = transformationService.generateFallbackValues('Test Business', 'gastronomia', 'Test description');

            expect(fallbacks.name).toBe('Test Business');
            expect(fallbacks.description).toBe('Test description');
            expect(fallbacks.rating).toBe(4.0);
            expect(fallbacks.location).toBe('Multiple locations');
            expect(fallbacks.benefit).toBe('Special offer available');
            expect(fallbacks.rewardRate).toBe('Contact for details');
        });
    });

    describe('Color assignment consistency', () => {
        it('should assign same colors to same banks across different data sources', () => {
            // Test with transformation service
            const color1 = transformationService.assignConsistentColor('Chase');
            const color2 = transformationService.assignConsistentColor('Chase');
            expect(color1).toBe(color2);

            // Reset and test with mock data generator
            transformationService.resetColorAssignments();
            mockDataGenerator.resetColorAssignments();

            const generatorColor1 = transformationService.assignConsistentColor('Chase');
            const generatorColor2 = transformationService.assignConsistentColor('Chase');
            expect(generatorColor1).toBe(generatorColor2);
            expect(generatorColor1).toBe(color1); // Should be same as before reset due to deterministic algorithm
        });

        it('should use valid Tailwind color classes', () => {
            const validColorPattern = /^bg-(blue|green|purple|red|yellow|indigo|pink|teal|orange|cyan|lime|rose)-\d+$/;

            const testBanks = ['Chase', 'Capital One', 'American Express', 'BBVA', 'Santander'];
            testBanks.forEach(bank => {
                const color = transformationService.assignConsistentColor(bank);
                expect(color, `Color for ${bank} should be valid Tailwind class`).toMatch(validColorPattern);
            });
        });
    });

    describe('Data type consistency', () => {
        it('should have consistent data types across all businesses', () => {
            const allBusinesses = [...mockBusinesses];

            allBusinesses.forEach((business, index) => {
                expect(typeof business.id, `Business ${index} id should be string`).toBe('string');
                expect(typeof business.name, `Business ${index} name should be string`).toBe('string');
                expect(typeof business.category, `Business ${index} category should be string`).toBe('string');
                expect(typeof business.description, `Business ${index} description should be string`).toBe('string');
                expect(typeof business.rating, `Business ${index} rating should be number`).toBe('number');
                expect(typeof business.location, `Business ${index} location should be string`).toBe('string');
                expect(typeof business.image, `Business ${index} image should be string`).toBe('string');
                expect(Array.isArray(business.benefits), `Business ${index} benefits should be array`).toBe(true);

                // Check optional enhanced fields
                if (business.lastUpdated !== undefined) {
                    expect(typeof business.lastUpdated, `Business ${index} lastUpdated should be number`).toBe('number');
                }
                if (business.isFavorite !== undefined) {
                    expect(typeof business.isFavorite, `Business ${index} isFavorite should be boolean`).toBe('boolean');
                }
                if (business.imageLoaded !== undefined) {
                    expect(typeof business.imageLoaded, `Business ${index} imageLoaded should be boolean`).toBe('boolean');
                }
            });
        });

        it('should have consistent benefit data types', () => {
            const allBusinesses = [...mockBusinesses];

            allBusinesses.forEach((business, businessIndex) => {
                business.benefits.forEach((benefit, benefitIndex) => {
                    expect(typeof benefit.bankName, `Business ${businessIndex}, benefit ${benefitIndex} bankName should be string`).toBe('string');
                    expect(typeof benefit.cardName, `Business ${businessIndex}, benefit ${benefitIndex} cardName should be string`).toBe('string');
                    expect(typeof benefit.benefit, `Business ${businessIndex}, benefit ${benefitIndex} benefit should be string`).toBe('string');
                    expect(typeof benefit.rewardRate, `Business ${businessIndex}, benefit ${benefitIndex} rewardRate should be string`).toBe('string');
                    expect(typeof benefit.color, `Business ${businessIndex}, benefit ${benefitIndex} color should be string`).toBe('string');
                    expect(typeof benefit.icon, `Business ${businessIndex}, benefit ${benefitIndex} icon should be string`).toBe('string');
                });
            });
        });
    });
});