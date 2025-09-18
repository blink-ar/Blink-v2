# Design Document

## Overview

This design outlines the enhancement of the day availability parsing system to extract day-of-week information from multiple benefit fields. The solution extends the existing `dayAvailabilityParser` utility and updates the `DaysOfWeek` component to support both single-field and multi-field parsing approaches.

## Architecture

### Core Components

1. **Enhanced Day Availability Parser** (`src/utils/dayAvailabilityParser.ts`)

   - Extended with multi-field parsing capabilities
   - Maintains backward compatibility with existing single-field parsing
   - Implements intelligent field prioritization and conflict resolution

2. **Updated DaysOfWeek Component** (`src/components/ui/DaysOfWeek.tsx`)

   - Enhanced to accept either availability string or full benefit object
   - Automatically chooses appropriate parsing method based on input type
   - Maintains existing API for backward compatibility

3. **Pattern Recognition Engine**
   - Extended regex patterns for comprehensive Spanish day phrase detection
   - Support for negation patterns and exclusion logic
   - Context-aware parsing for different field types

## Components and Interfaces

### Enhanced Parser Interface

```typescript
// Extended interface for multi-field parsing
interface BenefitDayInfo {
  cuando?: string;
  requisitos?: string[];
  condicion?: string;
  textoAplicacion?: string;
}

// New parsing functions
export const parseMultiFieldDayAvailability = (
  benefitInfo: BenefitDayInfo
): DayAvailability | null;

export const parseDayAvailabilityFromBenefit = (
  benefit: BankBenefit
): DayAvailability | null;
```

### Updated Component Interface

```typescript
interface DaysOfWeekProps {
  /** The availability text to parse (backward compatibility) */
  availability?: string;
  /** Full benefit object for enhanced parsing */
  benefit?: BankBenefit;
  /** Additional CSS classes */
  className?: string;
}
```

### Pattern Recognition Enhancements

```typescript
const ENHANCED_DAY_PATTERNS = {
  // Restriction patterns
  onlyValid: /válido\s+solo|aplicable\s+únicamente|únicamente\s+válido/i,
  notValid: /no\s+válido|excepto|excluye|sin\s+validez/i,

  // Context patterns
  weekendOnly: /solo\s+fines?\s+de\s+semana|únicamente\s+fines?\s+de\s+semana/i,
  weekdayOnly: /solo\s+días?\s+hábiles?|únicamente\s+días?\s+laborables?/i,

  // Time-based day patterns
  dayTimeRange:
    /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+a\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+de\s+\d+/i,

  // Specific exclusions
  exceptDays:
    /excepto\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i,
};
```

## Data Models

### Field Priority System

The parser will prioritize fields in the following order when conflicts arise:

1. **condicion** - Most specific restrictions
2. **requisitos** - Specific requirements that must be met
3. **cuando** - General validity period
4. **textoAplicacion** - Application instructions (lowest priority)

### Conflict Resolution Logic

```typescript
interface FieldParsingResult {
  field: "cuando" | "requisitos" | "condicion" | "textoAplicacion";
  availability: DayAvailability;
  confidence: number; // 0-1 score based on pattern specificity
  isRestriction: boolean; // true if field contains limiting language
}
```

### Parsing Strategy

1. **Parse each field independently** - Extract day information from each field
2. **Apply confidence scoring** - Rate the reliability of each parsing result
3. **Resolve conflicts** - Use field priority and restriction logic
4. **Merge results** - Combine compatible day availability information

## Error Handling

### Graceful Degradation

- If multi-field parsing fails, fall back to single-field parsing
- If enhanced patterns fail, use existing pattern matching
- Log parsing errors without breaking component functionality
- Return null for unparseable content rather than throwing errors

### Error Logging

```typescript
const logger = Logger.getInstance().createServiceLogger(
  "DayAvailabilityParser"
);

// Log parsing attempts and results for debugging
logger.debug("Multi-field parsing attempt", {
  fields: fieldNames,
  results: parsingResults,
});
```

## Testing Strategy

### Unit Tests

1. **Enhanced Parser Tests**

   - Test multi-field parsing with various field combinations
   - Test conflict resolution with competing day information
   - Test backward compatibility with existing single-field parsing
   - Test error handling and graceful degradation

2. **Pattern Recognition Tests**

   - Test new Spanish day patterns and phrases
   - Test negation and exclusion patterns
   - Test context-aware parsing for different field types
   - Test edge cases and malformed input

3. **Component Integration Tests**
   - Test DaysOfWeek component with benefit objects
   - Test backward compatibility with availability strings
   - Test rendering with enhanced parsing results
   - Test error states and fallback behavior

### Integration Tests

1. **Real Data Testing**

   - Test with actual benefit data from mock data
   - Validate parsing accuracy across different business types
   - Test performance with large datasets

2. **Cross-Browser Testing**
   - Ensure regex patterns work consistently across browsers
   - Test component rendering with enhanced data

## Implementation Phases

### Phase 1: Enhanced Parser Core

- Extend dayAvailabilityParser with multi-field capabilities
- Implement new pattern recognition engine
- Add conflict resolution logic
- Maintain backward compatibility

### Phase 2: Component Integration

- Update DaysOfWeek component to support benefit objects
- Implement automatic parsing method selection
- Add error handling and logging
- Ensure existing usage continues to work

### Phase 3: Testing and Validation

- Comprehensive unit and integration testing
- Performance optimization
- Documentation updates
- Real-world data validation

## Performance Considerations

### Optimization Strategies

1. **Memoization** - Cache parsing results for identical input
2. **Lazy Evaluation** - Only parse fields that contain potential day information
3. **Pattern Compilation** - Pre-compile regex patterns for better performance
4. **Early Exit** - Stop parsing when high-confidence result is found

### Memory Management

- Avoid creating unnecessary objects during parsing
- Reuse DayAvailability objects where possible
- Clean up temporary parsing state

## Security Considerations

### Input Validation

- Sanitize input strings before regex processing
- Limit input length to prevent ReDoS attacks
- Validate field types and structure

### Error Boundaries

- Prevent parsing errors from crashing the application
- Log security-relevant parsing attempts
- Fail safely with null returns rather than exceptions
