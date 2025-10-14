import { describe, it, expect } from 'vitest';
import {
    parseMultiFieldDayAvailability,
    parseDayAvailabilityFromBenefit,
    type BenefitDayInfo,
    type DayAvailability
} from '../dayAvailabilityParser';

describe('Multi-Field Day Availability Parser', () => {
    describe('parseMultiFieldDayAvailability', () => {
        describe('single field parsing', () => {
            it('should parse day information from condicion field only', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'válido solo fines de semana'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
                expect(result!.monday).toBe(false);
            });

            it('should parse day information from cuando field only', () => {
                const benefitInfo: BenefitDayInfo = {
                    cuando: 'lunes a viernes'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.friday).toBe(true);
                expect(result!.saturday).toBe(false);
            });

            it('should parse day information from requisitos array', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: ['aplicable únicamente sábados y domingos', 'mínimo $1000']
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
                expect(result!.friday).toBe(false);
            });

            it('should parse day information from textoAplicacion field', () => {
                const benefitInfo: BenefitDayInfo = {
                    textoAplicacion: 'válido todos los días hábiles'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.friday).toBe(true);
                expect(result!.saturday).toBe(false);
            });
        });

        describe('field priority system', () => {
            it('should prioritize condicion over cuando field', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'válido solo fines de semana',
                    cuando: 'todos los días'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
                expect(result!.monday).toBe(false); // Should not include weekdays from 'cuando'
            });

            it('should prioritize requisitos over cuando field', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: ['aplicable únicamente días hábiles'],
                    cuando: 'fines de semana'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.friday).toBe(true);
                expect(result!.saturday).toBe(false); // Should not include weekends from 'cuando'
            });

            it('should prioritize condicion over requisitos', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'válido solo sábados',
                    requisitos: ['aplicable todos los días']
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(false);
                expect(result!.monday).toBe(false);
            });

            it('should use cuando field when higher priority fields have no day info', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'mínimo $500',
                    requisitos: ['tarjeta activa'],
                    cuando: 'lunes a viernes'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.friday).toBe(true);
                expect(result!.saturday).toBe(false);
            });
        });

        describe('multiple field combinations', () => {
            it('should handle compatible day information from multiple fields', () => {
                const benefitInfo: BenefitDayInfo = {
                    cuando: 'días hábiles',
                    requisitos: ['válido lunes a viernes']
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.friday).toBe(true);
                expect(result!.saturday).toBe(false);
            });

            it('should handle conflicting day information by using most restrictive', () => {
                const benefitInfo: BenefitDayInfo = {
                    cuando: 'todos los días',
                    condicion: 'válido solo fines de semana'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
                expect(result!.monday).toBe(false); // More restrictive wins
            });

            it('should merge multiple requisitos with day information', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: [
                        'válido lunes y martes',
                        'aplicable miércoles',
                        'no relacionado con días'
                    ]
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.tuesday).toBe(true);
                expect(result!.wednesday).toBe(true);
                expect(result!.thursday).toBe(false);
            });
        });

        describe('restriction and negation handling', () => {
            it('should handle restriction patterns across fields', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'aplicable únicamente',
                    cuando: 'fines de semana'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
                expect(result!.friday).toBe(false);
            });

            it('should handle negation patterns in requisitos', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: ['excepto domingos'],
                    cuando: 'todos los días'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.sunday).toBe(false);
                expect(result!.monday).toBe(true);
                expect(result!.saturday).toBe(true);
            });
        });

        describe('performance optimizations', () => {
            it('should skip fields without day keywords', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'descuento del 20%',
                    requisitos: ['compra mínima $100', 'tarjeta vigente'],
                    cuando: 'fines de semana',
                    textoAplicacion: 'presentar tarjeta en caja'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
                expect(result!.monday).toBe(false);
            });

            it('should handle empty requisitos array', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: [],
                    cuando: 'lunes a viernes'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.friday).toBe(true);
            });

            it('should handle requisitos with non-string elements', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: ['válido sábados', null as any, undefined as any, '', 'domingos'],
                    cuando: 'todos los días'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
            });
        });

        describe('error handling and graceful degradation', () => {
            it('should return null for empty benefit info', () => {
                const benefitInfo: BenefitDayInfo = {};
                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).toBeNull();
            });

            it('should return null when no fields contain day information', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'descuento 15%',
                    requisitos: ['compra mínima'],
                    textoAplicacion: 'presentar documento'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).toBeNull();
            });

            it('should handle malformed field data gracefully', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: null as any,
                    requisitos: 'not an array' as any,
                    cuando: undefined,
                    textoAplicacion: 123 as any
                };

                expect(() => parseMultiFieldDayAvailability(benefitInfo)).not.toThrow();
                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).toBeNull();
            });

            it('should continue processing other fields when one field fails', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'válido solo fines de semana',
                    requisitos: null as any, // This should not break the parsing
                    cuando: 'lunes a viernes'
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true);
            });
        });

        describe('confidence-based selection', () => {
            it('should prefer higher confidence results', () => {
                const benefitInfo: BenefitDayInfo = {
                    condicion: 'válido solo fines de semana', // High confidence restriction
                    cuando: 'sábados' // Lower confidence, less specific
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.saturday).toBe(true);
                expect(result!.sunday).toBe(true); // Should include both weekend days from higher confidence result
            });

            it('should merge results with similar confidence levels', () => {
                const benefitInfo: BenefitDayInfo = {
                    requisitos: ['válido lunes'], // High confidence
                    cuando: 'válido martes' // Similar confidence
                };

                const result = parseMultiFieldDayAvailability(benefitInfo);
                expect(result).not.toBeNull();
                expect(result!.monday).toBe(true);
                expect(result!.tuesday).toBe(true);
            });
        });
    });

    describe('parseDayAvailabilityFromBenefit', () => {
        it('should parse day information from a complete BankBenefit object', () => {
            const benefit = {
                bankName: 'Test Bank',
                cardName: 'Test Card',
                benefit: 'Test Benefit',
                rewardRate: '10%',
                color: '#000000',
                icon: 'test-icon',
                condicion: 'válido solo fines de semana',
                cuando: 'todos los días',
                requisitos: ['tarjeta activa'],
                textoAplicacion: 'presentar en caja'
            };

            const result = parseDayAvailabilityFromBenefit(benefit);
            expect(result).not.toBeNull();
            expect(result!.saturday).toBe(true);
            expect(result!.sunday).toBe(true);
            expect(result!.monday).toBe(false);
        });

        it('should handle benefit objects with only cuando field', () => {
            const benefit = {
                bankName: 'Test Bank',
                cardName: 'Test Card',
                benefit: 'Test Benefit',
                cuando: 'lunes a viernes'
            };

            const result = parseDayAvailabilityFromBenefit(benefit);
            expect(result).not.toBeNull();
            expect(result!.monday).toBe(true);
            expect(result!.friday).toBe(true);
            expect(result!.saturday).toBe(false);
        });

        it('should return null for benefit objects without day information', () => {
            const benefit = {
                bankName: 'Test Bank',
                cardName: 'Test Card',
                benefit: 'Test Benefit',
                rewardRate: '5%'
            };

            const result = parseDayAvailabilityFromBenefit(benefit);
            expect(result).toBeNull();
        });

        it('should handle null or undefined benefit objects gracefully', () => {
            expect(() => parseDayAvailabilityFromBenefit(null)).not.toThrow();
            expect(() => parseDayAvailabilityFromBenefit(undefined)).not.toThrow();

            expect(parseDayAvailabilityFromBenefit(null)).toBeNull();
            expect(parseDayAvailabilityFromBenefit(undefined)).toBeNull();
        });

        it('should fallback to single-field parsing when multi-field parsing fails', () => {
            const benefit = {
                cuando: 'fines de semana',
                condicion: null,
                requisitos: 'malformed' as unknown
            };

            const result = parseDayAvailabilityFromBenefit(benefit);
            expect(result).not.toBeNull();
            expect(result!.saturday).toBe(true);
            expect(result!.sunday).toBe(true);
        });

        it('should handle benefits with complex requisitos arrays', () => {
            const benefit = {
                requisitos: [
                    'válido solo lunes y martes',
                    'compra mínima $500',
                    'aplicable miércoles a viernes',
                    'tarjeta vigente'
                ],
                cuando: 'todos los días'
            };

            const result = parseDayAvailabilityFromBenefit(benefit);
            expect(result).not.toBeNull();
            expect(result!.monday).toBe(true);
            expect(result!.tuesday).toBe(true);
            expect(result!.wednesday).toBe(true);
            expect(result!.friday).toBe(true);
        });
    });

    describe('backward compatibility', () => {
        it('should maintain compatibility with existing single-field parsing', () => {
            const benefitInfo: BenefitDayInfo = {
                cuando: 'lunes a viernes'
            };

            const multiFieldResult = parseMultiFieldDayAvailability(benefitInfo);

            // Should produce the same result as single-field parsing
            expect(multiFieldResult).not.toBeNull();
            expect(multiFieldResult!.monday).toBe(true);
            expect(multiFieldResult!.friday).toBe(true);
            expect(multiFieldResult!.saturday).toBe(false);
        });

        it('should work with benefits that only have cuando field', () => {
            const benefit = {
                cuando: 'fines de semana'
            };

            const result = parseDayAvailabilityFromBenefit(benefit);
            expect(result).not.toBeNull();
            expect(result!.saturday).toBe(true);
            expect(result!.sunday).toBe(true);
        });

        it('should handle "todos los martes" pattern in multi-field context', () => {
            const benefitInfo: BenefitDayInfo = {
                condicion: 'todos los martes',
                cuando: 'todos los días'
            };

            const result = parseMultiFieldDayAvailability(benefitInfo);
            expect(result).not.toBeNull();
            expect(result!.tuesday).toBe(true);
            expect(result!.monday).toBe(false);
            expect(result!.wednesday).toBe(false);
            expect(result!.thursday).toBe(false);
            expect(result!.friday).toBe(false);
            expect(result!.saturday).toBe(false);
            expect(result!.sunday).toBe(false);
            expect(result!.allDays).toBe(false);
        });

        it('should handle "todos los martes" in requisitos array', () => {
            const benefitInfo: BenefitDayInfo = {
                requisitos: ['todos los martes', 'compra mínima $100']
            };

            const result = parseMultiFieldDayAvailability(benefitInfo);
            expect(result).not.toBeNull();
            expect(result!.tuesday).toBe(true);
            expect(result!.monday).toBe(false);
            expect(result!.wednesday).toBe(false);
            expect(result!.thursday).toBe(false);
            expect(result!.friday).toBe(false);
            expect(result!.saturday).toBe(false);
            expect(result!.sunday).toBe(false);
            expect(result!.allDays).toBe(false);
        });
    });
});