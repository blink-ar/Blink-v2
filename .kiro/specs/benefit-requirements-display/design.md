# Design Document

## Overview

This design enhances the Benefit.tsx page to display comprehensive benefit details from the "beneficios" array in the API response. The enhancement will add detailed benefit information sections including requirements, validity periods, limits, conditions, usage types, and application details. This provides users with complete benefit information while maintaining the current design language.

## Architecture

### Component Structure

The enhancement will modify the existing Benefit.tsx component to include a new requirements display section. The component will continue to use the same data fetching pattern but will need to handle the extended benefit data structure.

### Data Flow

1. Benefit data is fetched from the API (existing flow)
2. The API transformation in `api.ts` needs to be updated to include the "requisitos" field from the raw API response
3. The component extracts the "requisitos" field from the transformed benefit data
4. Requirements are processed and formatted for display
5. The requirements section is conditionally rendered based on data availability

### API Integration

The existing API in `api.ts` already receives the `requisitos` field from the backend but doesn't include it in the transformation to the `Business` type. The transformation logic needs to be updated to preserve this data.

## Components and Interfaces

### Enhanced BankBenefit Interface

The existing BankBenefit interface needs to be extended to include all benefit details:

```typescript
export interface BankBenefit {
  bankName: string;
  cardName: string;
  benefit: string;
  rewardRate: string;
  color: string;
  icon: string;
  // New fields from beneficios array
  tipo?: string;
  cuando?: string;
  valor?: string;
  tope?: string;
  claseDeBeneficio?: string;
  condicion?: string;
  requisitos?: string[];
  usos?: string[];
  textoAplicacion?: string;
}
```

### Benefit Details Display Components

New inline components within Benefit.tsx will handle detailed benefit information:

```typescript
interface BenefitDetailsProps {
  benefit: BankBenefit;
}

const BenefitDetailsSection: React.FC<BenefitDetailsProps> = ({ benefit }) => {
  // Component logic for rendering all benefit details
};

const RequirementsSection: React.FC<{ requirements: string[] }> = ({
  requirements,
}) => {
  // Component logic for rendering requirements
};

const ValiditySection: React.FC<{ validity: string }> = ({ validity }) => {
  // Component logic for rendering validity period
};

const LimitsSection: React.FC<{ limit: string; value: string }> = ({
  limit,
  value,
}) => {
  // Component logic for rendering limits and values
};

const DaysOfWeekSection: React.FC<{ availability: string }> = ({
  availability,
}) => {
  // Component logic for parsing and displaying days of the week availability
};
```

### UI Layout Integration

The detailed benefit information will be integrated into the existing benefit card layout:

```
[Existing benefit card content]
├── Bank name and card name
├── Benefit description
├── Reward rate badge
├── [NEW] Benefit Type and Class
├── [NEW] Validity Period
├── [NEW] Days of Week Availability
├── [NEW] Value and Limits
├── [NEW] Conditions
├── [NEW] Usage Types
├── [NEW] Requirements
├── [NEW] Application Details
└── Business description
```

## Data Models

### Input Data Structure

Based on the sample data provided, the component should handle:

```typescript
interface BenefitData {
  beneficios: Array<{
    requisitos: string[];
    // ... other fields
  }>;
  // ... other fields
}
```

### Requirements Processing

- Handle both array and string formats for requisitos
- Filter out empty or null requirements
- Preserve line breaks and formatting within individual requirements

### Days of Week Processing

The system will parse the `cuando` field to extract day-specific availability information:

```typescript
interface DayAvailability {
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

const parseDayAvailability = (cuando: string): DayAvailability => {
  // Parse common patterns:
  // - "fines de semana" -> Saturday, Sunday
  // - "lunes a viernes" -> Monday to Friday
  // - "sábados y domingos" -> Saturday, Sunday
  // - "todos los días" -> All days
  // - Specific days mentioned
};
```

### Visual Day Indicators

Days will be displayed using a horizontal row of day indicators:

```
┌─────────────────────────────────────────┐
│ Disponible:  L  M  X  J  V  S  D        │
│             ●  ●  ●  ●  ●  ○  ○        │
└─────────────────────────────────────────┘

Legend:
● = Available day (filled circle or highlighted)
○ = Not available day (empty circle or dimmed)
```

## Error Handling

### Data Validation

- Check if requisitos field exists before rendering
- Handle cases where requisitos is null, undefined, or empty array
- Gracefully handle malformed requirement strings

### Fallback Behavior

- If no requirements exist, don't display the requirements section
- If requirements are malformed, log error but continue rendering other content
- Maintain existing error handling for benefit data fetching

## Days of Week Implementation Details

### Text Parsing Logic

The system will implement intelligent parsing of Spanish day-related text:

```typescript
const DAY_PATTERNS = {
  weekends: /fines?\s+de\s+semana|sábados?\s+y\s+domingos?|fin\s+de\s+semana/i,
  weekdays: /lunes\s+a\s+viernes|días?\s+hábiles?|días?\s+laborables?/i,
  allDays: /todos?\s+los?\s+días?|permanente|siempre/i,
  specificDays: {
    monday: /lunes?/i,
    tuesday: /martes?/i,
    wednesday: /miércoles?|miercoles?/i,
    thursday: /jueves?/i,
    friday: /viernes?/i,
    saturday: /sábados?|sabados?/i,
    sunday: /domingos?/i,
  },
};
```

### Visual Design Specifications

The days of the week will be displayed as a compact horizontal indicator:

```
┌─────────────────────────────────────────┐
│ 📅 Disponible                           │
│    L   M   X   J   V   S   D            │
│    ●   ●   ●   ●   ●   ○   ○            │
└─────────────────────────────────────────┘
```

**Design Elements:**

- Calendar icon (📅) or "Disponible:" label
- Day abbreviations: L (Lunes), M (Martes), X (Miércoles), J (Jueves), V (Viernes), S (Sábado), D (Domingo)
- Visual indicators: filled circles (●) for available days, empty circles (○) for unavailable days
- Alternative: colored backgrounds or badges for available days

### Component Architecture

```typescript
interface DaysOfWeekProps {
  availability: string;
  className?: string;
}

const DaysOfWeek: React.FC<DaysOfWeekProps> = ({ availability, className }) => {
  const dayAvailability = useMemo(
    () => parseDayAvailability(availability),
    [availability]
  );

  if (!dayAvailability || dayAvailability.allDays) {
    return <span className="text-sm text-gray-600">Todos los días</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium">Disponible:</span>
      <div className="flex gap-1">
        {DAYS.map((day) => (
          <DayIndicator
            key={day.key}
            day={day}
            isAvailable={dayAvailability[day.key]}
          />
        ))}
      </div>
    </div>
  );
};
```

## Testing Strategy

### Unit Tests

1. Test requirements section rendering with valid data
2. Test handling of missing or empty requisitos field
3. Test formatting of multiple requirements
4. Test error handling for malformed data
5. **Test day availability parsing with various Spanish text patterns**
6. **Test visual day indicator rendering for different availability scenarios**
7. **Test edge cases for day parsing (typos, mixed formats, unclear text)**

### Integration Tests

1. Test full benefit page rendering with requirements
2. Test navigation and state management with enhanced data
3. Test responsive behavior of requirements section
4. **Test days of week display integration with existing benefit details**

### Visual Testing

1. Verify requirements section styling matches design system
2. Test readability and spacing of requirements list
3. Verify mobile responsiveness of requirements display
4. **Verify day indicators are clearly visible and accessible**
5. **Test day indicator spacing and alignment on different screen sizes**

## Implementation Approach

### Phase 1: API and Type Updates

- Extend BankBenefit interface to include requisitos field
- Update API transformation in `api.ts` to include requisitos from the raw API response
- Update mock data to include sample requirements for testing

### Phase 2: Component Enhancement

- Add RequirementsSection component to Benefit.tsx
- Implement requirements processing logic
- Add conditional rendering based on data availability

### Phase 3: Styling and Polish

- Apply consistent styling to requirements section
- Ensure proper spacing and typography
- Add responsive design considerations

### Phase 4: Testing and Validation

- Add comprehensive unit tests
- Test with various data scenarios
- Validate accessibility and user experience
