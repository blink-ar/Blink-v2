import { describe, it, expect } from 'vitest';
import {
    parseDayAvailabilityEnhanced,
    getPatternConfidence,
    type DayAvailability,
    type PatternMatch
} from '../dayAvailabilityParser';

describe('Enhanced Day Availability Parser', () => {
    describe('parseDayAvailabilityEnhanced', () => {
        describe('restriction language patterns', () => {
            it('should parse "válido solo fines de semana" with high confidence', () => {
                const result = parseDayAvailabilityEnhanced('válido solo fines de semana');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.availability.monday).toBe(false);
                expect(result!.match.pattern).toBe('weekendRestriction');
                expect(result!.match.confidence).toBeGreaterThan(0.8);
                expect(result!.match.isRestriction).toBe(true);
                expect(result!.match.isNegation).toBe(false);
            });

            it('should parse "aplicable únicamente sábados y domingos"', () => {
                const result = parseDayAvailabilityEnhanced('aplicable únicamente sábados y domingos');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.availability.friday).toBe(false);
                expect(result!.match.isRestriction).toBe(true);
            });

            it('should parse "válido solo días hábiles"', () => {
                const result = parseDayAvailabilityEnhanced('válido solo días hábiles');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.saturday).toBe(false);
                expect(result!.availability.sunday).toBe(false);
                expect(result!.match.pattern).toBe('weekdayRestriction');
                expect(result!.match.isRestriction).toBe(true);
            });

            it('should parse "aplicable únicamente lunes a viernes"', () => {
                const result = parseDayAvailabilityEnhanced('aplicable únicamente lunes a viernes');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.saturday).toBe(false);
                expect(result!.match.isRestriction).toBe(true);
            });

            it('should handle text without accents', () => {
                const result = parseDayAvailabilityEnhanced('valido solo dias habiles');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.saturday).toBe(false);
            });

            it('should parse "únicamente válido fines de semana"', () => {
                const result = parseDayAvailabilityEnhanced('únicamente válido fines de semana');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.availability.monday).toBe(false);
                expect(result!.match.isRestriction).toBe(true);
            });
        });

        describe('negation and exclusion patterns', () => {
            it('should parse "no válido domingos"', () => {
                const result = parseDayAvailabilityEnhanced('no válido domingos');
                expect(result).not.toBeNull();
                expect(result!.availability.sunday).toBe(false);
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.allDays).toBe(false);
                expect(result!.match.isNegation).toBe(true);
            });

            it('should parse "excepto domingo"', () => {
                const result = parseDayAvailabilityEnhanced('excepto domingo');
                expect(result).not.toBeNull();
                expect(result!.availability.sunday).toBe(false);
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.allDays).toBe(false);
                expect(result!.match.pattern).toBe('exceptDay');
                expect(result!.match.isNegation).toBe(true);
            });

            it('should parse "no válido sábados"', () => {
                const result = parseDayAvailabilityEnhanced('no válido sábados');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(false);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.match.isNegation).toBe(true);
            });

            it('should parse "excepto lunes y martes"', () => {
                const result = parseDayAvailabilityEnhanced('excepto lunes y martes');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(false);
                expect(result!.availability.tuesday).toBe(false);
                expect(result!.availability.wednesday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.match.isNegation).toBe(true);
            });

            it('should handle "sin validez" patterns', () => {
                const result = parseDayAvailabilityEnhanced('sin validez domingos');
                expect(result).not.toBeNull();
                expect(result!.availability.sunday).toBe(false);
                expect(result!.availability.monday).toBe(true);
                expect(result!.match.isNegation).toBe(true);
            });
        });

        describe('time-based day range patterns', () => {
            it('should parse "lunes a viernes de 9 a 17hs"', () => {
                const result = parseDayAvailabilityEnhanced('lunes a viernes de 9 a 17hs');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.saturday).toBe(false);
                expect(result!.match.pattern).toBe('timeBasedRange');
            });

            it('should parse "sábado a domingo de 10 a 20hs"', () => {
                const result = parseDayAvailabilityEnhanced('sábado a domingo de 10 a 20hs');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.availability.friday).toBe(false);
                expect(result!.match.pattern).toBe('timeBasedRange');
            });

            it('should parse "miércoles a viernes de 14 a 18hs"', () => {
                const result = parseDayAvailabilityEnhanced('miércoles a viernes de 14 a 18hs');
                expect(result).not.toBeNull();
                expect(result!.availability.wednesday).toBe(true);
                expect(result!.availability.thursday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.tuesday).toBe(false);
                expect(result!.availability.saturday).toBe(false);
            });

            it('should handle wrap-around ranges like "viernes a domingo de 12 a 24hs"', () => {
                const result = parseDayAvailabilityEnhanced('viernes a domingo de 12 a 24hs');
                expect(result).not.toBeNull();
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
                expect(result!.availability.thursday).toBe(false);
                expect(result!.availability.monday).toBe(false);
            });
        });

        describe('confidence scoring', () => {
            it('should assign high confidence to restriction patterns', () => {
                const result = parseDayAvailabilityEnhanced('válido solo fines de semana');
                expect(result!.match.confidence).toBeGreaterThan(0.85);
            });

            it('should assign medium confidence to context patterns', () => {
                const result = parseDayAvailabilityEnhanced('fines de semana');
                expect(result!.match.confidence).toBeGreaterThanOrEqual(0.6);
                expect(result!.match.confidence).toBeLessThan(0.85);
            });

            it('should boost confidence for multiple restriction indicators', () => {
                const result1 = parseDayAvailabilityEnhanced('válido solo fines de semana');
                const result2 = parseDayAvailabilityEnhanced('aplicable únicamente válido solo fines de semana');
                expect(result2!.match.confidence).toBeGreaterThanOrEqual(result1!.match.confidence);
            });

            it('should reduce confidence for very long text', () => {
                const shortText = 'válido solo fines de semana';
                const longText = 'Este beneficio es válido solo fines de semana en restaurantes participantes de la cadena durante los meses de verano con condiciones especiales';

                const result1 = parseDayAvailabilityEnhanced(shortText);
                const result2 = parseDayAvailabilityEnhanced(longText);

                expect(result2!.match.confidence).toBeLessThan(result1!.match.confidence);
            });
        });

        describe('pattern priority and precedence', () => {
            it('should prioritize restriction patterns over general patterns', () => {
                const result = parseDayAvailabilityEnhanced('válido solo lunes aunque dice todos los días');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.tuesday).toBe(false);
                expect(result!.match.isRestriction).toBe(true);
            });

            it('should prioritize negation patterns over positive patterns', () => {
                const result = parseDayAvailabilityEnhanced('todos los días excepto domingo');
                expect(result).not.toBeNull();
                expect(result!.availability.sunday).toBe(false);
                expect(result!.availability.monday).toBe(true);
                expect(result!.match.isNegation).toBe(true);
            });

            it('should handle complex mixed patterns', () => {
                const result = parseDayAvailabilityEnhanced('válido únicamente días hábiles excepto miércoles');
                expect(result).not.toBeNull();
                // Should detect the restriction first
                expect(result!.match.isRestriction).toBe(true);
            });
        });

        describe('edge cases and error handling', () => {
            it('should handle empty input gracefully', () => {
                const result = parseDayAvailabilityEnhanced('');
                expect(result).toBeNull();
            });

            it('should handle undefined input gracefully', () => {
                const result = parseDayAvailabilityEnhanced(undefined);
                expect(result).toBeNull();
            });

            it('should handle whitespace-only input', () => {
                const result = parseDayAvailabilityEnhanced('   ');
                expect(result).toBeNull();
            });

            it('should handle text with no day patterns', () => {
                const result = parseDayAvailabilityEnhanced('descuento del 10% en compras');
                expect(result).toBeNull();
            });

            it('should handle malformed day names gracefully', () => {
                const result = parseDayAvailabilityEnhanced('válido solo lunnes y maartes');
                // Should not crash, might not match but should return null gracefully
                expect(() => result).not.toThrow();
            });

            it('should be case insensitive', () => {
                const result = parseDayAvailabilityEnhanced('VÁLIDO SOLO FINES DE SEMANA');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
            });

            it('should handle mixed case', () => {
                const result = parseDayAvailabilityEnhanced('Válido Solo Fines De Semana');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
            });
        });

        describe('backward compatibility', () => {
            it('should still parse basic patterns without enhanced features', () => {
                const result = parseDayAvailabilityEnhanced('lunes a viernes');
                expect(result).not.toBeNull();
                expect(result!.availability.monday).toBe(true);
                expect(result!.availability.friday).toBe(true);
                expect(result!.availability.saturday).toBe(false);
            });

            it('should still parse weekend patterns', () => {
                const result = parseDayAvailabilityEnhanced('fines de semana');
                expect(result).not.toBeNull();
                expect(result!.availability.saturday).toBe(true);
                expect(result!.availability.sunday).toBe(true);
            });

            it('should still parse all days patterns', () => {
                const result = parseDayAvailabilityEnhanced('todos los días');
                expect(result).not.toBeNull();
                expect(result!.availability.allDays).toBe(true);
            });
        });
    });

    describe('getPatternConfidence', () => {
        it('should return confidence score for valid patterns', () => {
            const confidence = getPatternConfidence('válido solo fines de semana');
            expect(confidence).toBeGreaterThan(0);
            expect(confidence).toBeLessThanOrEqual(1);
        });

        it('should return 0 for invalid patterns', () => {
            const confidence = getPatternConfidence('no day patterns here');
            expect(confidence).toBe(0);
        });

        it('should return 0 for empty input', () => {
            const confidence = getPatternConfidence('');
            expect(confidence).toBe(0);
        });

        it('should return 0 for undefined input', () => {
            const confidence = getPatternConfidence(undefined);
            expect(confidence).toBe(0);
        });
    });
});