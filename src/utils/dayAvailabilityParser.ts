/**
 * Day availability parsing utility for Spanish day-related text
 */

export interface DayAvailability {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    allDays: boolean;
    customText?: string;
}

export interface PatternMatch {
    pattern: string;
    confidence: number;
    isRestriction: boolean;
    isNegation: boolean;
}

// Enhanced regex patterns for Spanish day-related text
const DAY_PATTERNS = {
    // Weekend patterns
    weekends: /fines?\s+de\s+semana|sábados?\s+y\s+domingos?|fin\s+de\s+semana|sabados?\s+y\s+domingos?/i,

    // Weekday patterns
    weekdays: /lunes\s+a\s+viernes|días?\s+hábiles?|días?\s+laborables?|dias?\s+habiles?|dias?\s+laborables?/i,

    // All days patterns
    allDays: /todos?\s+los?\s+días?|permanente|siempre|todos?\s+los?\s+dias?/i,

    // Specific day patterns
    specificDays: {
        monday: /lunes?/i,
        tuesday: /martes?/i,
        wednesday: /miércoles?|miercoles?/i,
        thursday: /jueves?/i,
        friday: /viernes?/i,
        saturday: /sábados?|sabados?/i,
        sunday: /domingos?/i,
    },

    // Range patterns (e.g., "lunes a miércoles")
    ranges: {
        mondayToWednesday: /lunes\s+a\s+miércoles|lunes\s+a\s+miercoles/i,
        mondayToThursday: /lunes\s+a\s+jueves/i,
        mondayToFriday: /lunes\s+a\s+viernes/i,
        tuesdayToThursday: /martes\s+a\s+jueves/i,
        wednesdayToFriday: /miércoles\s+a\s+viernes|miercoles\s+a\s+viernes/i,
        thursdayToSunday: /jueves\s+a\s+domingo/i,
        fridayToSunday: /viernes\s+a\s+domingo/i,
        saturdayToSunday: /sábado\s+a\s+domingo|sabado\s+a\s+domingo/i,
    }
};

// Enhanced patterns for restriction language and negation
const ENHANCED_DAY_PATTERNS = {
    // Restriction patterns (high confidence)
    onlyValid: /válido\s+solo|aplicable\s+únicamente|únicamente\s+válido|valido\s+solo|aplicable\s+unicamente|unicamente\s+valido/i,
    notValid: /no\s+válido|no\s+valido|excepto|excluye|sin\s+validez|no\s+aplicable/i,

    // Context patterns (medium confidence)
    weekendOnly: /solo\s+fines?\s+de\s+semana|únicamente\s+fines?\s+de\s+semana|unicamente\s+fines?\s+de\s+semana/i,
    weekdayOnly: /solo\s+días?\s+hábiles?|únicamente\s+días?\s+laborables?|solo\s+dias?\s+habiles?|unicamente\s+dias?\s+laborables?/i,

    // Time-based day patterns (medium confidence)
    dayTimeRange: /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+a\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+de\s+\d+/i,

    // Specific exclusions (high confidence)
    exceptDays: /excepto\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i,

    // Enhanced weekend patterns
    weekendRestriction: /válido\s+solo\s+fines?\s+de\s+semana|aplicable\s+únicamente\s+sábados?\s+y\s+domingos?|valido\s+solo\s+fines?\s+de\s+semana|aplicable\s+unicamente\s+sabados?\s+y\s+domingos?/i,

    // Enhanced weekday patterns  
    weekdayRestriction: /válido\s+solo\s+días?\s+hábiles?|aplicable\s+únicamente\s+lunes\s+a\s+viernes|valido\s+solo\s+dias?\s+habiles?|aplicable\s+unicamente\s+lunes\s+a\s+viernes/i,

    // Todos los patterns with restrictions
    allDaysRestriction: /todos?\s+los?\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i,
};

/**
 * Creates a default DayAvailability object with all days set to false
 */
const createDefaultDayAvailability = (): DayAvailability => ({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    allDays: false,
});

/**
 * Calculates confidence score for pattern matches
 */
const calculateConfidence = (text: string, patternType: string): number => {
    // Base confidence scores by pattern type
    const baseScores = {
        restriction: 0.9,      // "válido solo", "aplicable únicamente"
        negation: 0.85,        // "no válido", "excepto"
        specific: 0.8,         // specific day mentions
        range: 0.75,           // day ranges
        context: 0.7,          // "fines de semana", "días hábiles"
        general: 0.6,          // "todos los días"
        timeRange: 0.65,       // time-based patterns
    };

    let confidence = baseScores[patternType as keyof typeof baseScores] || 0.5;

    // Boost confidence for multiple indicators
    const restrictionWords = (text.match(/válido|valido|aplicable|únicamente|unicamente|solo/gi) || []).length;
    if (restrictionWords > 1) {
        confidence = Math.min(0.98, confidence + 0.03 * (restrictionWords - 1));
    }

    // Reduce confidence for very long text (likely has other context)
    if (text.length > 100) {
        confidence *= 0.9;
    }

    return Math.round(confidence * 100) / 100;
};

/**
 * Detects if text contains negation patterns
 */
const detectNegation = (text: string): boolean => {
    return ENHANCED_DAY_PATTERNS.notValid.test(text) ||
        ENHANCED_DAY_PATTERNS.exceptDays.test(text);
};

/**
 * Detects if text contains restriction language
 */
const detectRestriction = (text: string): boolean => {
    return ENHANCED_DAY_PATTERNS.onlyValid.test(text) ||
        ENHANCED_DAY_PATTERNS.weekendOnly.test(text) ||
        ENHANCED_DAY_PATTERNS.weekdayOnly.test(text) ||
        ENHANCED_DAY_PATTERNS.weekendRestriction.test(text) ||
        ENHANCED_DAY_PATTERNS.weekdayRestriction.test(text);
};

/**
 * Sets weekdays (Monday to Friday) to true
 */
const setWeekdays = (availability: DayAvailability): void => {
    availability.monday = true;
    availability.tuesday = true;
    availability.wednesday = true;
    availability.thursday = true;
    availability.friday = true;
};

/**
 * Sets weekends (Saturday and Sunday) to true
 */
const setWeekends = (availability: DayAvailability): void => {
    availability.saturday = true;
    availability.sunday = true;
};

/**
 * Sets all days to true
 */
const setAllDays = (availability: DayAvailability): void => {
    availability.monday = true;
    availability.tuesday = true;
    availability.wednesday = true;
    availability.thursday = true;
    availability.friday = true;
    availability.saturday = true;
    availability.sunday = true;
    availability.allDays = true;
};

/**
 * Handles enhanced restriction patterns
 */
const handleEnhancedRestrictions = (text: string, availability: DayAvailability): PatternMatch | null => {
    // Check for weekend-only restrictions
    if (ENHANCED_DAY_PATTERNS.weekendRestriction.test(text) ||
        (ENHANCED_DAY_PATTERNS.onlyValid.test(text) && ENHANCED_DAY_PATTERNS.weekendOnly.test(text))) {
        setWeekends(availability);
        return {
            pattern: 'weekendRestriction',
            confidence: calculateConfidence(text, 'restriction'),
            isRestriction: true,
            isNegation: false
        };
    }

    // Check for weekday-only restrictions
    if (ENHANCED_DAY_PATTERNS.weekdayRestriction.test(text) ||
        (ENHANCED_DAY_PATTERNS.onlyValid.test(text) && ENHANCED_DAY_PATTERNS.weekdayOnly.test(text))) {
        setWeekdays(availability);
        return {
            pattern: 'weekdayRestriction',
            confidence: calculateConfidence(text, 'restriction'),
            isRestriction: true,
            isNegation: false
        };
    }

    // Check for "todos los [day]" patterns
    const allDaysMatch = text.match(ENHANCED_DAY_PATTERNS.allDaysRestriction);
    if (allDaysMatch) {
        const dayName = allDaysMatch[1].toLowerCase();
        const dayMap: { [key: string]: keyof Omit<DayAvailability, 'allDays' | 'customText'> } = {
            'lunes': 'monday',
            'martes': 'tuesday',
            'miércoles': 'wednesday',
            'miercoles': 'wednesday',
            'jueves': 'thursday',
            'viernes': 'friday',
            'sábado': 'saturday',
            'sabado': 'saturday',
            'domingo': 'sunday'
        };

        const dayKey = dayMap[dayName];
        if (dayKey) {
            availability[dayKey] = true;
            return {
                pattern: 'allDaysSpecific',
                confidence: calculateConfidence(text, 'specific'),
                isRestriction: true,
                isNegation: false
            };
        }
    }

    // Check for "válido solo [specific day]" patterns
    if (ENHANCED_DAY_PATTERNS.onlyValid.test(text)) {
        // Look for specific days mentioned after restriction words
        const dayMatches = [];
        for (const [day, pattern] of Object.entries(DAY_PATTERNS.specificDays)) {
            if (pattern.test(text)) {
                dayMatches.push(day);
            }
        }

        if (dayMatches.length > 0) {
            // Only enable the mentioned days
            const dayMap: { [key: string]: keyof Omit<DayAvailability, 'allDays' | 'customText'> } = {
                'monday': 'monday',
                'tuesday': 'tuesday',
                'wednesday': 'wednesday',
                'thursday': 'thursday',
                'friday': 'friday',
                'saturday': 'saturday',
                'sunday': 'sunday'
            };

            dayMatches.forEach(day => {
                const dayKey = dayMap[day];
                if (dayKey) {
                    availability[dayKey] = true;
                }
            });

            return {
                pattern: 'onlyValidSpecificDays',
                confidence: calculateConfidence(text, 'restriction'),
                isRestriction: true,
                isNegation: false
            };
        }
    }

    return null;
};

/**
 * Handles negation patterns (exclusions)
 */
const handleNegationPatterns = (text: string, availability: DayAvailability): PatternMatch | null => {
    // Start with all days available for negation patterns
    setAllDays(availability);

    // Check for "excepto" with any days (handles both single and multiple days)
    if (text.includes('excepto')) {
        // Look for specific days mentioned after "excepto"
        const dayMatches = [];
        for (const [day, pattern] of Object.entries(DAY_PATTERNS.specificDays)) {
            if (pattern.test(text)) {
                dayMatches.push(day);
            }
        }

        if (dayMatches.length > 0) {
            // Exclude the mentioned days
            const dayMap: { [key: string]: keyof Omit<DayAvailability, 'allDays' | 'customText'> } = {
                'monday': 'monday',
                'tuesday': 'tuesday',
                'wednesday': 'wednesday',
                'thursday': 'thursday',
                'friday': 'friday',
                'saturday': 'saturday',
                'sunday': 'sunday'
            };

            dayMatches.forEach(day => {
                const dayKey = dayMap[day];
                if (dayKey) {
                    availability[dayKey] = false;
                }
            });

            availability.allDays = false;
            return {
                pattern: dayMatches.length === 1 ? 'exceptDay' : 'exceptMultipleDays',
                confidence: calculateConfidence(text, 'negation'),
                isRestriction: true,
                isNegation: true
            };
        }
    }

    // Check for general "no válido" patterns with specific days
    if (ENHANCED_DAY_PATTERNS.notValid.test(text)) {
        // Look for specific days mentioned after "no válido"
        const dayMatches = [];
        for (const [day, pattern] of Object.entries(DAY_PATTERNS.specificDays)) {
            if (pattern.test(text)) {
                dayMatches.push(day);
            }
        }

        if (dayMatches.length > 0) {
            // Exclude the mentioned days
            const dayMap: { [key: string]: keyof Omit<DayAvailability, 'allDays' | 'customText'> } = {
                'monday': 'monday',
                'tuesday': 'tuesday',
                'wednesday': 'wednesday',
                'thursday': 'thursday',
                'friday': 'friday',
                'saturday': 'saturday',
                'sunday': 'sunday'
            };

            dayMatches.forEach(day => {
                const dayKey = dayMap[day];
                if (dayKey) {
                    availability[dayKey] = false;
                }
            });

            availability.allDays = false;
            return {
                pattern: 'notValidDays',
                confidence: calculateConfidence(text, 'negation'),
                isRestriction: true,
                isNegation: true
            };
        }
    }



    return null;
};

/**
 * Handles time-based day range patterns
 */
const handleTimeBasedRanges = (text: string, availability: DayAvailability): PatternMatch | null => {
    const timeRangeMatch = text.match(ENHANCED_DAY_PATTERNS.dayTimeRange);
    if (timeRangeMatch) {
        const startDay = timeRangeMatch[1].toLowerCase();
        const endDay = timeRangeMatch[2].toLowerCase();

        // Map day names to numbers for range calculation
        const dayNumbers: { [key: string]: number } = {
            'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
            'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 7
        };

        const startNum = dayNumbers[startDay];
        const endNum = dayNumbers[endDay];

        if (startNum && endNum) {
            // Handle range (including wrap-around for weekend ranges)
            const dayMap: (keyof Omit<DayAvailability, 'allDays' | 'customText'>)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            if (startNum <= endNum) {
                // Normal range
                for (let i = startNum; i <= endNum; i++) {
                    const dayKey = dayMap[i - 1]; // Adjust for 0-based array
                    if (dayKey) {
                        availability[dayKey] = true;
                    }
                }
            } else {
                // Wrap-around range (e.g., Friday to Sunday)
                for (let i = startNum; i <= 7; i++) {
                    const dayKey = dayMap[i - 1]; // Adjust for 0-based array
                    if (dayKey) {
                        availability[dayKey] = true;
                    }
                }
                for (let i = 1; i <= endNum; i++) {
                    const dayKey = dayMap[i - 1]; // Adjust for 0-based array
                    if (dayKey) {
                        availability[dayKey] = true;
                    }
                }
            }

            return {
                pattern: 'timeBasedRange',
                confidence: calculateConfidence(text, 'timeRange'),
                isRestriction: false,
                isNegation: false
            };
        }
    }

    return null;
};

/**
 * Handles day ranges (e.g., "lunes a miércoles")
 */
const handleDayRanges = (text: string, availability: DayAvailability): boolean => {
    if (DAY_PATTERNS.ranges.mondayToWednesday.test(text)) {
        availability.monday = true;
        availability.tuesday = true;
        availability.wednesday = true;
        return true;
    }

    if (DAY_PATTERNS.ranges.mondayToThursday.test(text)) {
        availability.monday = true;
        availability.tuesday = true;
        availability.wednesday = true;
        availability.thursday = true;
        return true;
    }

    if (DAY_PATTERNS.ranges.mondayToFriday.test(text)) {
        setWeekdays(availability);
        return true;
    }

    if (DAY_PATTERNS.ranges.tuesdayToThursday.test(text)) {
        availability.tuesday = true;
        availability.wednesday = true;
        availability.thursday = true;
        return true;
    }

    if (DAY_PATTERNS.ranges.wednesdayToFriday.test(text)) {
        availability.wednesday = true;
        availability.thursday = true;
        availability.friday = true;
        return true;
    }

    if (DAY_PATTERNS.ranges.thursdayToSunday.test(text)) {
        availability.thursday = true;
        availability.friday = true;
        availability.saturday = true;
        availability.sunday = true;
        return true;
    }

    if (DAY_PATTERNS.ranges.fridayToSunday.test(text)) {
        availability.friday = true;
        availability.saturday = true;
        availability.sunday = true;
        return true;
    }

    if (DAY_PATTERNS.ranges.saturdayToSunday.test(text)) {
        setWeekends(availability);
        return true;
    }

    return false;
};

/**
 * Handles specific day mentions
 */
const handleSpecificDays = (text: string, availability: DayAvailability): boolean => {
    let foundAnyDay = false;

    if (DAY_PATTERNS.specificDays.monday.test(text)) {
        availability.monday = true;
        foundAnyDay = true;
    }

    if (DAY_PATTERNS.specificDays.tuesday.test(text)) {
        availability.tuesday = true;
        foundAnyDay = true;
    }

    if (DAY_PATTERNS.specificDays.wednesday.test(text)) {
        availability.wednesday = true;
        foundAnyDay = true;
    }

    if (DAY_PATTERNS.specificDays.thursday.test(text)) {
        availability.thursday = true;
        foundAnyDay = true;
    }

    if (DAY_PATTERNS.specificDays.friday.test(text)) {
        availability.friday = true;
        foundAnyDay = true;
    }

    if (DAY_PATTERNS.specificDays.saturday.test(text)) {
        availability.saturday = true;
        foundAnyDay = true;
    }

    if (DAY_PATTERNS.specificDays.sunday.test(text)) {
        availability.sunday = true;
        foundAnyDay = true;
    }

    return foundAnyDay;
};

/**
 * Enhanced parsing function with pattern recognition and confidence scoring
 * 
 * @param cuando - The Spanish text describing when the benefit is available
 * @returns DayAvailability object with boolean flags for each day, or null if no patterns match
 */
export const parseDayAvailabilityEnhanced = (cuando?: string): { availability: DayAvailability; match: PatternMatch } | null => {
    // Handle missing or empty input
    if (!cuando || typeof cuando !== 'string' || cuando.trim() === '') {
        return null;
    }

    const text = cuando.toLowerCase().trim();
    const availability = createDefaultDayAvailability();

    // Check for enhanced restriction patterns first (highest priority)
    const restrictionMatch = handleEnhancedRestrictions(text, availability);
    if (restrictionMatch) {
        return { availability, match: restrictionMatch };
    }

    // Check for negation patterns (high priority)
    if (detectNegation(text)) {
        const negationMatch = handleNegationPatterns(text, availability);
        if (negationMatch) {
            return { availability, match: negationMatch };
        }
    }

    // Check for time-based day ranges
    const timeRangeMatch = handleTimeBasedRanges(text, availability);
    if (timeRangeMatch) {
        return { availability, match: timeRangeMatch };
    }

    // Check for "all days" patterns
    if (DAY_PATTERNS.allDays.test(text)) {
        setAllDays(availability);
        return {
            availability,
            match: {
                pattern: 'allDays',
                confidence: calculateConfidence(text, 'general'),
                isRestriction: false,
                isNegation: false
            }
        };
    }

    // Check for weekend patterns
    if (DAY_PATTERNS.weekends.test(text)) {
        setWeekends(availability);
        return {
            availability,
            match: {
                pattern: 'weekends',
                confidence: calculateConfidence(text, 'context'),
                isRestriction: detectRestriction(text),
                isNegation: false
            }
        };
    }

    // Check for weekday patterns
    if (DAY_PATTERNS.weekdays.test(text)) {
        setWeekdays(availability);
        return {
            availability,
            match: {
                pattern: 'weekdays',
                confidence: calculateConfidence(text, 'context'),
                isRestriction: detectRestriction(text),
                isNegation: false
            }
        };
    }

    // Check for day ranges
    if (handleDayRanges(text, availability)) {
        return {
            availability,
            match: {
                pattern: 'dayRange',
                confidence: calculateConfidence(text, 'range'),
                isRestriction: detectRestriction(text),
                isNegation: false
            }
        };
    }

    // Check for specific day mentions
    if (handleSpecificDays(text, availability)) {
        return {
            availability,
            match: {
                pattern: 'specificDays',
                confidence: calculateConfidence(text, 'specific'),
                isRestriction: detectRestriction(text),
                isNegation: false
            }
        };
    }

    return null;
};

/**
 * Parses Spanish day-related text and returns day availability information
 * (Backward compatible version)
 * 
 * @param cuando - The Spanish text describing when the benefit is available
 * @returns DayAvailability object with boolean flags for each day
 */
export const parseDayAvailability = (cuando?: string): DayAvailability | null => {
    const result = parseDayAvailabilityEnhanced(cuando);
    if (result) {
        return result.availability;
    }

    // Fallback for unrecognized patterns - store original text
    if (cuando && typeof cuando === 'string' && cuando.trim()) {
        const availability = createDefaultDayAvailability();
        availability.customText = cuando;
        return availability;
    }

    return null;
};

/**
 * Utility function to check if any days are available
 */
export const hasAnyDayAvailable = (availability: DayAvailability): boolean => {
    return availability.monday ||
        availability.tuesday ||
        availability.wednesday ||
        availability.thursday ||
        availability.friday ||
        availability.saturday ||
        availability.sunday ||
        availability.allDays;
};

/**
 * Utility function to get available day names in Spanish
 */
export const getAvailableDayNames = (availability: DayAvailability): string[] => {
    const dayNames: string[] = [];

    if (availability.allDays) {
        return ['Todos los días'];
    }

    if (availability.monday) dayNames.push('Lunes');
    if (availability.tuesday) dayNames.push('Martes');
    if (availability.wednesday) dayNames.push('Miércoles');
    if (availability.thursday) dayNames.push('Jueves');
    if (availability.friday) dayNames.push('Viernes');
    if (availability.saturday) dayNames.push('Sábado');
    if (availability.sunday) dayNames.push('Domingo');

    return dayNames;
};

/**
 * Utility function to get pattern match confidence score
 */
export const getPatternConfidence = (cuando?: string): number => {
    const result = parseDayAvailabilityEnhanced(cuando);
    return result ? result.match.confidence : 0;
};