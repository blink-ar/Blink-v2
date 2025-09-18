# Requirements Document

## Introduction

This specification outlines enhancements to the day availability parsing system to extract day-of-week information from multiple benefit fields (requisitos, condicion, textoAplicacion) in addition to the current cuando field. This will provide more comprehensive day availability detection for benefits that specify day restrictions in various text fields.

## Requirements

### Requirement 1: Enhanced Day Parsing from Multiple Fields

**User Story:** As a user viewing benefit details, I want to see accurate day-of-week availability indicators even when day information is mentioned in requirements, conditions, or application text rather than just the validity period, so that I can understand when the benefit is actually available.

#### Acceptance Criteria

1. WHEN a benefit has day information in the requisitos field THEN the DaysOfWeek component SHALL parse and display the correct day availability
2. WHEN a benefit has day information in the condicion field THEN the DaysOfWeek component SHALL parse and display the correct day availability
3. WHEN a benefit has day information in the textoAplicacion field THEN the DaysOfWeek component SHALL parse and display the correct day availability
4. WHEN day information exists in multiple fields THEN the parser SHALL combine the information intelligently to show the most restrictive availability
5. WHEN conflicting day information exists across fields THEN the parser SHALL prioritize the most specific restriction

### Requirement 2: Improved Day Pattern Recognition

**User Story:** As a user, I want the system to recognize various Spanish day patterns and phrases commonly used in benefit descriptions, so that day availability is accurately detected regardless of how it's written.

#### Acceptance Criteria

1. WHEN text contains "válido solo fines de semana" THEN the parser SHALL identify Saturday and Sunday as available days
2. WHEN text contains "aplicable sábados y domingos" THEN the parser SHALL identify Saturday and Sunday as available days
3. WHEN text contains "válido solo días hábiles" THEN the parser SHALL identify Monday through Friday as available days
4. WHEN text contains specific day mentions like "válido lunes y miércoles" THEN the parser SHALL identify only those specific days
5. WHEN text contains negations like "no válido domingos" THEN the parser SHALL exclude those days from availability

### Requirement 3: Multi-Field Parsing Integration

**User Story:** As a developer, I want a unified parsing function that can analyze all relevant benefit fields for day information, so that the DaysOfWeek component gets comprehensive availability data.

#### Acceptance Criteria

1. WHEN the parsing function receives a benefit object THEN it SHALL analyze cuando, requisitos, condicion, and textoAplicacion fields
2. WHEN multiple fields contain day information THEN the function SHALL return a consolidated DayAvailability object
3. WHEN no day information is found in any field THEN the function SHALL return null
4. WHEN parsing fails for any field THEN the function SHALL continue processing other fields without throwing errors
5. WHEN the consolidated result has conflicts THEN the function SHALL apply logical precedence rules

### Requirement 4: Enhanced DaysOfWeek Component Integration

**User Story:** As a user, I want the DaysOfWeek component to automatically use the enhanced parsing without requiring changes to how it's used in the application, so that existing implementations benefit from the improvements.

#### Acceptance Criteria

1. WHEN the DaysOfWeek component receives a benefit object THEN it SHALL use the enhanced multi-field parser
2. WHEN the component receives only an availability string THEN it SHALL continue to work with the existing single-field parser for backward compatibility
3. WHEN enhanced parsing finds day information THEN the component SHALL display the day indicators as before
4. WHEN enhanced parsing finds no day information THEN the component SHALL return null as before
5. WHEN the component is used in existing pages THEN it SHALL work without requiring code changes

### Requirement 5: Comprehensive Pattern Matching

**User Story:** As a user, I want the system to recognize day patterns in various formats and contexts commonly found in Spanish benefit descriptions, so that availability detection is robust and accurate.

#### Acceptance Criteria

1. WHEN text contains "válido solo" followed by day names THEN the parser SHALL identify only those days as available
2. WHEN text contains "aplicable únicamente" followed by day names THEN the parser SHALL identify only those days as available
3. WHEN text contains "excepto" or "no válido" followed by day names THEN the parser SHALL exclude those days from a default set
4. WHEN text contains time-based restrictions with days like "lunes a viernes de 9 a 17hs" THEN the parser SHALL identify the day range
5. WHEN text contains multiple day restrictions in the same field THEN the parser SHALL apply the most restrictive combination
