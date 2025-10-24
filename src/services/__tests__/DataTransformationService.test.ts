import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataTransformationService, BenefitResponse, AllBenefits } from '../DataTransformationService';
import { Business, BankBenefit } from '../../types';

describe('DataTransformationService', () => {
    let service: DataTransformationService;

    beforeEach(async () => {
        service = new DataTransformationService();
        await service.initialize();
        service.resetColorAssignments();
    });

    afterEach(async () => {
        await service.destroy();
    });

    describe('transformAPIResponse', () => {
        it('should transform valid API response to businesses', () => {
            const mockAPIResponse: AllBenefits = {
                'BANCO_TEST': [
                    {
                        _id: { $oid: '123' },
                        id: 'test-benefit-1',
                        beneficios: [{
                            tipo: 'descuento',
                            cuando: 'siempre',
                            valor: '10%',
                            cuota: { $numberInt: '1' },
                            tope: 'sin tope',
                            claseDeBeneficio: 'descuento',
                            casuistica: { descripcion: 'Descuento en todas las compras' },
                            condicion: 'ninguna',
                            requisitos: []
                        }],
                        cabecera: 'Restaurante de prueba',
                        destacado: true,
                        details: {
                            beneficio: {
                                titulo: 'Test Restaurant',
                                rubros: [{ id: 1, nombre: 'gastronomia' }],
                                subtitulo: 'Comida deliciosa',
                                imagen: 'https://example.com/image.jpg',
                                vigencia: '2024-12-31',
                                subcabecera: 'Subcabecera',
                                cabecera: 'Cabecera'
                            }
                        }
                    }
                ]
            };

            const result = service.transformAPIResponse(mockAPIResponse);

            expect(result.isValid).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(1);
            expect(result.errors).toHaveLength(0);

            const business = result.data![0];
            expect(business.name).toBe('Test Restaurant');
            expect(business.category).toBe('gastronomia');
            expect(business.benefits).toHaveLength(1);
            expect(business.benefits[0].bankName).toBe('Banco Test');
        });

        it('should handle empty API response', () => {
            const result = service.transformAPIResponse({});

            expect(result.isValid).toBe(true);
            expect(result.data).toEqual([]);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle invalid benefits data', () => {
            const mockAPIResponse: AllBenefits = {
                'INVALID_BANK': 'not an array' as any
            };

            const result = service.transformAPIResponse(mockAPIResponse);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Invalid benefits data for bank');
        });

        it('should aggregate benefits for the same business', () => {
            const mockAPIResponse: AllBenefits = {
                'BANCO_A': [{
                    _id: { $oid: '123' },
                    id: 'benefit-1',
                    beneficios: [{ tipo: 'descuento', cuando: 'siempre', valor: '5%', cuota: { $numberInt: '1' }, tope: 'sin tope', claseDeBeneficio: 'descuento', casuistica: { descripcion: 'Descuento A' }, condicion: 'ninguna', requisitos: [] }],
                    cabecera: 'Test Business',
                    destacado: true,
                    details: { beneficio: { titulo: 'Same Business', rubros: [{ id: 1, nombre: 'gastronomia' }], subtitulo: 'Test', imagen: 'https://example.com/image.jpg', vigencia: '2024-12-31', subcabecera: 'Sub', cabecera: 'Header' } }
                }],
                'BANCO_B': [{
                    _id: { $oid: '456' },
                    id: 'benefit-2',
                    beneficios: [{ tipo: 'descuento', cuando: 'siempre', valor: '10%', cuota: { $numberInt: '1' }, tope: 'sin tope', claseDeBeneficio: 'descuento', casuistica: { descripcion: 'Descuento B' }, condicion: 'ninguna', requisitos: [] }],
                    cabecera: 'Test Business',
                    destacado: true,
                    details: { beneficio: { titulo: 'Same Business', rubros: [{ id: 1, nombre: 'gastronomia' }], subtitulo: 'Test', imagen: 'https://example.com/image.jpg', vigencia: '2024-12-31', subcabecera: 'Sub', cabecera: 'Header' } }
                }]
            };

            const result = service.transformAPIResponse(mockAPIResponse);

            expect(result.isValid).toBe(true);
            expect(result.data!.length).toBe(1);
            expect(result.data![0].benefits).toHaveLength(2);
            expect(result.data![0].benefits[0].bankName).toBe('Banco A');
            expect(result.data![0].benefits[1].bankName).toBe('Banco B');
        });
    });

    describe('transformBenefit', () => {
        const validBenefit: BenefitResponse = {
            _id: { $oid: '123' },
            id: 'test-benefit',
            beneficios: [{
                tipo: 'descuento',
                cuando: 'siempre',
                valor: '15%',
                cuota: { $numberInt: '1' },
                tope: 'sin tope',
                claseDeBeneficio: 'descuento',
                casuistica: { descripcion: 'Descuento especial' },
                condicion: 'ninguna',
                requisitos: []
            }],
            cabecera: 'Descripción del negocio',
            destacado: true,
            details: {
                beneficio: {
                    titulo: 'Test Business',
                    rubros: [{ id: 1, nombre: 'moda' }],
                    subtitulo: 'Ropa de calidad',
                    imagen: 'https://example.com/valid-image.jpg',
                    vigencia: '2024-12-31',
                    subcabecera: 'Subcabecera',
                    cabecera: 'Cabecera'
                }
            }
        };

        it('should transform valid benefit correctly', () => {
            const result = service.transformBenefit('BANCO_TEST', validBenefit);

            expect(result.isValid).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.errors).toHaveLength(0);

            const { business, bankBenefit } = result.data!;
            expect(business.name).toBe('Test Business');
            expect(business.category).toBe('moda');
            expect(business.description).toBe('Descripción del negocio');
            expect(business.rating).toBe(4.0);
            expect(business.image).toBe('https://example.com/valid-image.jpg');

            expect(bankBenefit.bankName).toBe('Banco Test');
            expect(bankBenefit.benefit).toBe('Descuento especial');
            expect(bankBenefit.rewardRate).toBe('15%');
            expect(bankBenefit.color).toMatch(/^bg-\w+-\d+$/);
        });

        it('should handle missing titulo', () => {
            const invalidBenefit = {
                ...validBenefit,
                details: {
                    beneficio: {
                        ...validBenefit.details.beneficio,
                        titulo: ''
                    }
                }
            };

            const result = service.transformBenefit('BANCO_TEST', invalidBenefit);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Benefit missing required titulo field');
        });

        it('should use fallback values for missing data', () => {
            const minimalBenefit: BenefitResponse = {
                _id: { $oid: '123' },
                id: 'minimal',
                beneficios: [],
                cabecera: '',
                destacado: false,
                details: {
                    beneficio: {
                        titulo: 'Minimal Business',
                        rubros: [],
                        subtitulo: '',
                        imagen: '',
                        vigencia: '',
                        subcabecera: '',
                        cabecera: ''
                    }
                }
            };

            const result = service.transformBenefit('BANCO_TEST', minimalBenefit);

            expect(result.isValid).toBe(true);
            const { business, bankBenefit } = result.data!;

            expect(business.category).toBe('otros'); // fallback category
            expect(business.description).toBe('Business in otros category'); // fallback description
            expect(business.rating).toBe(4.0); // fallback rating
            expect(Array.isArray(business.location)).toBe(true); // location should be array
            expect(bankBenefit.rewardRate).toBe('N/A'); // default reward rate when no beneficios
        });

        it('should validate and normalize invalid category', () => {
            const benefitWithInvalidCategory = {
                ...validBenefit,
                details: {
                    beneficio: {
                        ...validBenefit.details.beneficio,
                        rubros: [{ id: 1, nombre: 'invalid-category' }]
                    }
                }
            };

            const result = service.transformBenefit('BANCO_TEST', benefitWithInvalidCategory);

            expect(result.isValid).toBe(true);
            expect(result.data!.business.category).toBe('otros');
        });

        it('should handle invalid image URL', () => {
            const benefitWithInvalidImage = {
                ...validBenefit,
                details: {
                    beneficio: {
                        ...validBenefit.details.beneficio,
                        imagen: 'not-a-valid-url'
                    }
                }
            };

            const result = service.transformBenefit('BANCO_TEST', benefitWithInvalidImage);

            expect(result.isValid).toBe(true);
            expect(result.data!.business.image).toBe('https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400');
        });
    });

    describe('validateBusiness', () => {
        const validBusiness: Business = {
            id: 'test-business',
            name: 'Test Business',
            category: 'gastronomia',
            description: 'A test business',
            rating: 4.5,
            location: [{
                lat: 0,
                lng: 0,
                formattedAddress: 'Test Location',
                source: 'address' as const,
                provider: 'google' as const,
                confidence: 1.0,
                raw: 'Test Location',
                updatedAt: new Date().toISOString()
            }],
            image: 'https://example.com/image.jpg',
            benefits: []
        };

        it('should validate correct business', () => {
            const result = service.validateBusiness(validBusiness);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject business with missing id', () => {
            const invalidBusiness = { ...validBusiness, id: '' };
            const result = service.validateBusiness(invalidBusiness);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing or invalid id');
        });

        it('should reject business with invalid rating', () => {
            const invalidBusiness = { ...validBusiness, rating: 6 };
            const result = service.validateBusiness(invalidBusiness);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid rating (must be number between 0-5)');
        });

        it('should reject business with invalid benefits array', () => {
            const invalidBusiness = { ...validBusiness, benefits: 'not an array' as any };
            const result = service.validateBusiness(invalidBusiness);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Benefits must be an array');
        });
    });

    describe('validateBankBenefit', () => {
        const validBenefit: BankBenefit = {
            bankName: 'Test Bank',
            cardName: 'Test Card',
            benefit: 'Test benefit',
            rewardRate: '5%',
            color: 'bg-blue-500',
            icon: 'CreditCard'
        };

        it('should validate correct bank benefit', () => {
            const result = service.validateBankBenefit(validBenefit);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject benefit with missing fields', () => {
            const invalidBenefit = { ...validBenefit, bankName: '' };
            const result = service.validateBankBenefit(invalidBenefit);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing or invalid bankName');
        });
    });

    describe('assignConsistentColor', () => {
        it('should assign consistent colors to same bank', () => {
            const color1 = service.assignConsistentColor('Test Bank');
            const color2 = service.assignConsistentColor('Test Bank');

            expect(color1).toBe(color2);
        });

        it('should assign different colors to different banks', () => {
            const color1 = service.assignConsistentColor('Bank A');
            const color2 = service.assignConsistentColor('Bank B');

            // While not guaranteed to be different due to hash collisions,
            // it's very likely they will be different
            expect(color1).toMatch(/^bg-\w+-\d+$/);
            expect(color2).toMatch(/^bg-\w+-\d+$/);
        });

        it('should maintain color assignments across service instances', () => {
            const color1 = service.assignConsistentColor('Persistent Bank');
            const assignments = service.getColorAssignments();

            expect(assignments.get('Persistent Bank')).toBe(color1);
        });

        it('should reset color assignments when requested', () => {
            service.assignConsistentColor('Test Bank');
            expect(service.getColorAssignments().size).toBe(1);

            service.resetColorAssignments();
            expect(service.getColorAssignments().size).toBe(0);
        });
    });

    describe('generateFallbackValues', () => {
        it('should generate appropriate fallback values', () => {
            const fallbacks = service.generateFallbackValues('Test Business', 'gastronomia', 'Test description');

            expect(fallbacks.name).toBe('Test Business');
            expect(fallbacks.description).toBe('Test description');
            expect(fallbacks.rating).toBe(4.0);
            expect(fallbacks.location).toBe('Multiple locations');
            expect(fallbacks.benefit).toBe('Special offer available');
            expect(fallbacks.rewardRate).toBe('Contact for details');
        });

        it('should handle empty inputs', () => {
            const fallbacks = service.generateFallbackValues('', '', '');

            expect(fallbacks.name).toBe('Unknown Business');
            expect(fallbacks.description).toBe('Business in  category');
            expect(fallbacks.rating).toBe(4.0);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle malformed API response gracefully', () => {
            const malformedResponse = {
                'BANK_1': [
                    {
                        // Missing required fields
                        id: 'incomplete'
                    } as any
                ]
            };

            const result = service.transformAPIResponse(malformedResponse);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should sanitize text input properly', () => {
            const benefitWithUnsafeText: BenefitResponse = {
                _id: { $oid: '123' },
                id: 'unsafe-text',
                beneficios: [{
                    tipo: 'descuento',
                    cuando: 'siempre',
                    valor: '<script>alert("xss")</script>',
                    cuota: { $numberInt: '1' },
                    tope: 'sin tope',
                    claseDeBeneficio: 'descuento',
                    casuistica: { descripcion: 'Safe   text   with   spaces' },
                    condicion: 'ninguna',
                    requisitos: []
                }],
                cabecera: 'Business   with   extra   spaces',
                destacado: true,
                details: {
                    beneficio: {
                        titulo: 'Safe Business',
                        rubros: [{ id: 1, nombre: 'gastronomia' }],
                        subtitulo: 'Clean subtitle',
                        imagen: 'https://example.com/image.jpg',
                        vigencia: '2024-12-31',
                        subcabecera: 'Sub',
                        cabecera: 'Header'
                    }
                }
            };

            const result = service.transformBenefit('TEST_BANK', benefitWithUnsafeText);

            expect(result.isValid).toBe(true);
            const { business, bankBenefit } = result.data!;

            expect(business.description).toBe('Business with extra spaces');
            expect(bankBenefit.benefit).toBe('Safe text with spaces');
            expect(bankBenefit.rewardRate).toBe('scriptalert("xss")/script');
        });

        it('should handle very long text inputs', () => {
            const longText = 'a'.repeat(1000);
            const benefitWithLongText: BenefitResponse = {
                _id: { $oid: '123' },
                id: 'long-text',
                beneficios: [{
                    tipo: 'descuento',
                    cuando: 'siempre',
                    valor: '10%',
                    cuota: { $numberInt: '1' },
                    tope: 'sin tope',
                    claseDeBeneficio: 'descuento',
                    casuistica: { descripcion: longText },
                    condicion: 'ninguna',
                    requisitos: []
                }],
                cabecera: longText,
                destacado: true,
                details: {
                    beneficio: {
                        titulo: 'Long Text Business',
                        rubros: [{ id: 1, nombre: 'gastronomia' }],
                        subtitulo: 'Subtitle',
                        imagen: 'https://example.com/image.jpg',
                        vigencia: '2024-12-31',
                        subcabecera: 'Sub',
                        cabecera: 'Header'
                    }
                }
            };

            const result = service.transformBenefit('TEST_BANK', benefitWithLongText);

            expect(result.isValid).toBe(true);
            const { business, bankBenefit } = result.data!;

            expect(business.description.length).toBeLessThanOrEqual(500);
            expect(bankBenefit.benefit.length).toBeLessThanOrEqual(500);
        });
    });
});