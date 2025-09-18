import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';
import {
    formatValue,
    formatValidityPeriod,
    processArrayField,
    processTextField,
    hasValidContent,
    formatBenefitType,
    formatUsageType,
} from '../benefitFormatters';

describe('benefitFormatters', () => {
    describe('formatValue', () => {
        it('should format percentage values correctly', () => {
            expect(formatValue('5%')).toBe('5%');
            expect(formatValue('2.5%')).toBe('2.5%');
            expect(formatValue('10 %')).toBe('10%');
            expect(formatValue('15% de descuento')).toBe('15%');
        });

        it('should format monetary values correctly', () => {
            expect(formatValue('$50000')).toBe('$50,000');
            expect(formatValue('100000 pesos')).toBe('$100,000');
            expect(formatValue('$1,500,000')).toBe('$1,500,000');
        });

        it('should handle numeric values with currency indicators', () => {
            expect(formatValue('50000 cop')).toBe('$50,000');
            expect(formatValue('100 dollars')).toBe('$100');
            expect(formatValue('1500')).toBe('1,500');
        });

        it('should return original value for non-numeric strings', () => {
            expect(formatValue('Unlimited')).toBe('Unlimited');
            expect(formatValue('No limit')).toBe('No limit');
        });

        it('should handle empty or invalid values', () => {
            expect(formatValue('')).toBe('');
            expect(formatValue('   ')).toBe('');
            expect(formatValue(null as any)).toBe('');
            expect(formatValue(undefined as any)).toBe('');
        });
    });

    describe('formatValidityPeriod', () => {
        it('should format date ranges correctly', () => {
            expect(formatValidityPeriod('01/01/2024 - 31/12/2024')).toContain('2024');
        });

        it('should format single dates correctly', () => {
            expect(formatValidityPeriod('15/06/2024')).toContain('2024');
        });

        it('should format relative periods correctly', () => {
            expect(formatValidityPeriod('30 días')).toBe('30 días');
            expect(formatValidityPeriod('1 día')).toBe('1 día');
            expect(formatValidityPeriod('12 meses')).toBe('12 meses');
            expect(formatValidityPeriod('1 mes')).toBe('1 mes');
            expect(formatValidityPeriod('2 años')).toBe('2 años');
            expect(formatValidityPeriod('1 año')).toBe('1 año');
        });

        it('should format "Válido hasta" patterns correctly', () => {
            expect(formatValidityPeriod('Válido hasta 31/12/2024')).toContain('Válido hasta');
            expect(formatValidityPeriod('Promoción válida hasta 30/06/2025')).toContain('Válido hasta');
        });

        it('should format "del...al" patterns correctly', () => {
            expect(formatValidityPeriod('Del 06 de julio de 2024 al 28/06/2025')).toBe('Del 06 de julio de 2024 al 28 de junio de 2025');
            expect(formatValidityPeriod('del 01/01/2024 al 31/12/2024')).toBe('del 01 de enero de 2024 al 31 de diciembre de 2024');
            expect(formatValidityPeriod('Del 15/03/2024 al 20/09/2024')).toBe('Del 15 de marzo de 2024 al 20 de septiembre de 2024');
        });

        it('should handle quarterly periods', () => {
            expect(formatValidityPeriod('Q1 2024: Enero - Marzo')).toBe('Q1 2024: Enero - Marzo');
        });

        it('should format permanent patterns correctly', () => {
            expect(formatValidityPeriod('Permanente')).toBe('Beneficio permanente');
            expect(formatValidityPeriod('Sin fecha de vencimiento')).toBe('Beneficio permanente');
            expect(formatValidityPeriod('Beneficio permanente para portadores de tarjeta')).toBe('Beneficio permanente');
        });

        it('should return original value for unrecognized formats', () => {
            expect(formatValidityPeriod('Permanent')).toBe('Permanent');
            expect(formatValidityPeriod('Until further notice')).toBe('Until further notice');
            expect(formatValidityPeriod('Mientras mantengas Amazon Prime activo')).toBe('Mientras mantengas Amazon Prime activo');
            expect(formatValidityPeriod('Hasta $6,000 en compras anuales')).toBe('Hasta $6,000 en compras anuales');
        });

        it('should handle empty or invalid values', () => {
            expect(formatValidityPeriod('')).toBe('');
            expect(formatValidityPeriod('   ')).toBe('');
            expect(formatValidityPeriod(null as any)).toBe('');
            expect(formatValidityPeriod(undefined as any)).toBe('');
        });
    });

    describe('processArrayField', () => {
        it('should filter out empty and null values', () => {
            const input = ['Valid requirement', '', null, '  ', 'Another requirement', undefined];
            const result = processArrayField(input as any);
            expect(result).toEqual(['Valid requirement', 'Another requirement']);
        });

        it('should trim whitespace from values', () => {
            const input = ['  Requirement 1  ', '\tRequirement 2\n'];
            const result = processArrayField(input);
            expect(result).toEqual(['Requirement 1', 'Requirement 2']);
        });

        it('should handle non-array inputs', () => {
            expect(processArrayField(null)).toEqual([]);
            expect(processArrayField(undefined)).toEqual([]);
            expect(processArrayField('not an array' as any)).toEqual([]);
        });

        it('should handle empty arrays', () => {
            expect(processArrayField([])).toEqual([]);
        });
    });

    describe('processTextField', () => {
        it('should normalize line breaks', () => {
            const input = 'Line 1\r\nLine 2\rLine 3\nLine 4';
            const result = processTextField(input);
            expect(result).toBe('Line 1\nLine 2\nLine 3\nLine 4');
        });

        it('should remove excessive whitespace', () => {
            const input = 'Text   with    multiple     spaces';
            const result = processTextField(input);
            expect(result).toBe('Text with multiple spaces');
        });

        it('should handle multiple line breaks', () => {
            const input = 'Paragraph 1\n\n\n\nParagraph 2';
            const result = processTextField(input);
            expect(result).toBe('Paragraph 1\n\nParagraph 2');
        });

        it('should trim leading and trailing whitespace', () => {
            const input = '   Text with spaces   ';
            const result = processTextField(input);
            expect(result).toBe('Text with spaces');
        });

        it('should handle empty or invalid values', () => {
            expect(processTextField('')).toBe('');
            expect(processTextField('   ')).toBe('');
            expect(processTextField(null)).toBe('');
            expect(processTextField(undefined)).toBe('');
        });
    });

    describe('hasValidContent', () => {
        it('should return true for valid strings', () => {
            expect(hasValidContent('Valid content')).toBe(true);
            expect(hasValidContent('  Valid  ')).toBe(true);
        });

        it('should return false for empty or whitespace strings', () => {
            expect(hasValidContent('')).toBe(false);
            expect(hasValidContent('   ')).toBe(false);
        });

        it('should return true for arrays with valid content', () => {
            expect(hasValidContent(['item1', 'item2'])).toBe(true);
            expect(hasValidContent(['', 'valid item'])).toBe(true);
        });

        it('should return false for arrays without valid content', () => {
            expect(hasValidContent([])).toBe(false);
            expect(hasValidContent(['', '   '])).toBe(false);
        });

        it('should return false for null and undefined', () => {
            expect(hasValidContent(null)).toBe(false);
            expect(hasValidContent(undefined)).toBe(false);
        });

        it('should return true for other truthy values', () => {
            expect(hasValidContent(123)).toBe(true);
            expect(hasValidContent(true)).toBe(true);
        });
    });

    describe('formatBenefitType', () => {
        it('should capitalize words correctly', () => {
            expect(formatBenefitType('cashback')).toBe('Cashback');
            expect(formatBenefitType('travel rewards')).toBe('Travel Rewards');
            expect(formatBenefitType('DINING DISCOUNT')).toBe('Dining Discount');
        });

        it('should handle empty or invalid values', () => {
            expect(formatBenefitType('')).toBe('');
            expect(formatBenefitType('   ')).toBe('');
            expect(formatBenefitType(null as any)).toBe('');
            expect(formatBenefitType(undefined as any)).toBe('');
        });
    });

    describe('formatUsageType', () => {
        it('should format usage types correctly', () => {
            expect(formatUsageType('online_shopping')).toBe('Online Shopping');
            expect(formatUsageType('in-store')).toBe('In Store');
            expect(formatUsageType('RESTAURANT_DINING')).toBe('Restaurant Dining');
        });

        it('should handle empty or invalid values', () => {
            expect(formatUsageType('')).toBe('');
            expect(formatUsageType('   ')).toBe('');
            expect(formatUsageType(null as any)).toBe('');
            expect(formatUsageType(undefined as any)).toBe('');
        });
    });
});