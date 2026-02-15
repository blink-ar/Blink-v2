/**
 * Utility functions for formatting benefit data
 */

import { Logger } from '../services/base/Logger';

const logger = Logger.getInstance().createServiceLogger('BenefitFormatters');

/**
 * Safely executes a formatting function with error handling
 */
const safeFormat = <T, R>(
    fn: (input: T) => R,
    input: T,
    fallback: R,
    context: string
): R => {
    try {
        return fn(input);
    } catch (error) {
        logger.error(`Error in ${context}`, error as Error, { input });
        return fallback;
    }
};

/**
 * Formats monetary values, percentages, and other value strings
 */
export const formatValue = (value: string): string => {
    return safeFormat(
        (val: string) => {
            if (!val || typeof val !== 'string') return '';

            const trimmedValue = val.trim();
            if (!trimmedValue) return '';

            // Handle percentage values
            if (trimmedValue.includes('%')) {
                const percentMatch = trimmedValue.match(/(\d+(?:\.\d+)?)\s*%/);
                if (percentMatch) {
                    const percent = parseFloat(percentMatch[1]);
                    if (!isNaN(percent)) {
                        return `${percent}%`;
                    }
                }
            }

            // Handle monetary values (Colombian Pesos)
            if (trimmedValue.includes('$') || trimmedValue.toLowerCase().includes('peso')) {
                const numberMatch = trimmedValue.match(/[\d,]+/);
                if (numberMatch) {
                    const number = numberMatch[0].replace(/,/g, '');
                    if (!isNaN(Number(number))) {
                        return `$${Number(number).toLocaleString('en-US')}`;
                    }
                }
            }

            // Handle numeric values with currency indicators
            const numericMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)\s*(cop|pesos?|dollars?|\$)?$/i);
            if (numericMatch) {
                const number = parseFloat(numericMatch[1]);
                const currency = numericMatch[2];
                if (!isNaN(number)) {
                    if (currency && currency.toLowerCase().includes('peso') || currency === 'cop') {
                        return `$${number.toLocaleString('en-US')}`;
                    }
                    if (currency === '$' || currency?.toLowerCase().includes('dollar')) {
                        return `$${number.toLocaleString('en-US')}`;
                    }
                    return number.toLocaleString('en-US');
                }
            }

            return trimmedValue;
        },
        value,
        '',
        'formatValue'
    );
};

/**
 * Formats date strings and validity periods
 */
export const formatValidityPeriod = (validity: string): string => {
    return safeFormat(
        (val: string) => {
            if (!val || typeof val !== 'string') return '';

            const trimmedValidity = val.trim();
            if (!trimmedValidity) return '';

            // Handle date ranges (e.g., "01/01/2024 - 31/12/2024")
            const dateRangeMatch = trimmedValidity.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateRangeMatch) {
                const startDate = formatDate(dateRangeMatch[1]);
                const endDate = formatDate(dateRangeMatch[2]);
                return `${startDate} - ${endDate}`;
            }

            // Handle "del...al" patterns (e.g., "Del 06 de julio de 2024 al 28/06/2025")
            const delAlMatch = trimmedValidity.match(/(del\s+)(.+?)(\s+al\s+)(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (delAlMatch) {
                const prefix = delAlMatch[1]; // "del "
                const startPart = delAlMatch[2]; // could be already formatted date or raw date
                const middle = delAlMatch[3]; // " al "
                const endDateRaw = delAlMatch[4]; // raw end date

                // Check if startPart contains a raw date that needs formatting
                const startDateMatch = startPart.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
                const formattedStartPart = startDateMatch ?
                    startPart.replace(startDateMatch[0], formatDate(startDateMatch[0])) :
                    startPart;

                const endDate = formatDate(endDateRaw);
                return `${prefix}${formattedStartPart}${middle}${endDate}`;
            }

            // Handle "Válido hasta" patterns (e.g., "Válido hasta 31/12/2024", "Promoción válida hasta 30/06/2025")
            const validUntilMatch = trimmedValidity.match(/(válido?a?\s+hasta|promoción\s+válida\s+hasta)\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
            if (validUntilMatch) {
                const date = formatDate(validUntilMatch[2]);
                return `Válido hasta ${date}`;
            }

            // Handle quarterly periods (e.g., "Q1 2024: Enero - Marzo")
            const quarterlyMatch = trimmedValidity.match(/Q\d+\s+\d{4}:\s*(.+)/i);
            if (quarterlyMatch) {
                return trimmedValidity; // Keep original format for quarterly periods
            }

            // Handle single dates anywhere in the text
            const singleDateMatch = trimmedValidity.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
            if (singleDateMatch) {
                const formattedDate = formatDate(singleDateMatch[0]);
                // Replace the date in the original text with the formatted version
                return trimmedValidity.replace(singleDateMatch[0], formattedDate);
            }

            // Handle relative periods (e.g., "30 días", "1 año")
            const periodMatch = trimmedValidity.match(/(\d+)\s*(día|días|mes|meses|año|años)/i);
            if (periodMatch) {
                const number = periodMatch[1];
                const unit = periodMatch[2].toLowerCase();

                if (unit.includes('día')) {
                    return `${number} ${number === '1' ? 'día' : 'días'}`;
                }
                if (unit.includes('mes')) {
                    return `${number} ${number === '1' ? 'mes' : 'meses'}`;
                }
                if (unit.includes('año')) {
                    return `${number} ${number === '1' ? 'año' : 'años'}`;
                }
            }

            // Handle common permanent/indefinite patterns
            const permanentPatterns = [
                /^permanente$/i,
                /^sin\s+fecha\s+de\s+vencimiento$/i,
                /^beneficio\s+permanente/i
            ];

            for (const pattern of permanentPatterns) {
                if (pattern.test(trimmedValidity)) {
                    return 'Beneficio permanente';
                }
            }

            // Return original text for other formats (conditional, spending limits, etc.)
            return trimmedValidity;
        },
        validity,
        '',
        'formatValidityPeriod'
    );
};

/**
 * Formats individual date strings with consistent formatting
 */
const formatDate = (dateStr: string): string => {
    return safeFormat(
        (str: string) => {
            const [day, month, year] = str.split('/');
            const dayNum = Number(day);
            const monthNum = Number(month);
            const yearNum = Number(year);

            // Validate date components
            if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
                return str;
            }

            if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
                return str;
            }

            const date = new Date(yearNum, monthNum - 1, dayNum);

            if (isNaN(date.getTime())) {
                return str; // Return original if invalid
            }

            return date.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        },
        dateStr,
        dateStr,
        'formatDate'
    );
};

/**
 * Processes and filters array fields (requisitos, usos)
 */
export const processArrayField = (items: string[] | undefined | null): string[] => {
    return safeFormat(
        (arr: string[] | undefined | null) => {
            if (!Array.isArray(arr)) return [];

            return arr
                .filter(item => {
                    try {
                        return item && typeof item === 'string' && item.trim().length > 0;
                    } catch {
                        return false;
                    }
                })
                .map(item => {
                    try {
                        return item.trim();
                    } catch {
                        return String(item || '').trim();
                    }
                })
                .filter(item => item.length > 0);
        },
        items,
        [],
        'processArrayField'
    );
};

/**
 * Processes and formats text fields, preserving line breaks
 */
export const processTextField = (text: string | undefined | null): string => {
    return safeFormat(
        (txt: string | undefined | null) => {
            if (!txt || typeof txt !== 'string') return '';

            const trimmedText = txt.trim();
            if (!trimmedText) return '';

            // Normalize line breaks and remove excessive whitespace
            return trimmedText
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple line breaks with double
                .replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
        },
        text,
        '',
        'processTextField'
    );
};

/**
 * Checks if a field has valid content
 */
export const hasValidContent = (value: any): boolean => {
    return safeFormat(
        (val: any) => {
            if (val === null || val === undefined) return false;

            if (typeof val === 'string') {
                return val.trim().length > 0;
            }

            if (Array.isArray(val)) {
                return val.some(item => {
                    try {
                        return item && typeof item === 'string' && item.trim().length > 0;
                    } catch {
                        return false;
                    }
                });
            }

            return Boolean(val);
        },
        value,
        false,
        'hasValidContent'
    );
};

/**
 * Formats benefit type and class for display
 */
export const formatBenefitType = (type: string): string => {
    return safeFormat(
        (t: string) => {
            if (!t || typeof t !== 'string') return '';

            const trimmedType = t.trim();
            if (!trimmedType) return '';

            // Capitalize first letter of each word
            return trimmedType
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        },
        type,
        '',
        'formatBenefitType'
    );
};

/**
 * Formats usage types for display as tags
 */
export const formatUsageType = (usage: string): string => {
    return safeFormat(
        (u: string) => {
            if (!u || typeof u !== 'string') return '';

            const trimmedUsage = u.trim();
            if (!trimmedUsage) return '';

            // Clean up and format usage type
            return trimmedUsage
                .replace(/[_-]/g, ' ')
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        },
        usage,
        '',
        'formatUsageType'
    );
};

/**
 * Formats the benefit value (discount or installments) for display
 */
export const formatBenefitValue = (discountPercentage: number | null | undefined, installments: number | null | undefined): string => {
    return safeFormat(
        (data: { discount: number | null | undefined, inst: number | null | undefined }) => {
            const { discount, inst } = data;

            // If discount is greater than 0, show discount
            if (discount && discount > 0) {
                return `${discount}% OFF`;
            }

            // If discount is 0 or null/undefined, but installments exist and are greater than 0
            if (inst && inst > 0) {
                return `${inst} cuotas`;
            }

            // Fallback if neither discount nor installments are available
            return '';
        },
        { discount: discountPercentage, inst: installments },
        '',
        'formatBenefitValue'
    );
};