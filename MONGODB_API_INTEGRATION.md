# MongoDB API Integration

This document describes the integration of your new MongoDB benefits API into the project.

## What Changed

### 1. Updated API Service (`src/services/api.ts`)

The main API service has been updated to use your new MongoDB API instead of the previous API structure:

- **Base URL**: Changed to `http://localhost:3002`
- **New BenefitsAPI Class**: Implements all your API endpoints
- **Raw JSON Processing**: Now handles raw JSON benefits data from MongoDB

### 2. New API Endpoints Available

Your MongoDB API provides these endpoints:

```typescript
// Get all benefits with optional filters
GET /api/benefits?category=gastronomia&bank=BBVA

// Get a specific benefit by ID
GET /api/benefits/:id

// Get nearby benefits
GET /api/benefits/nearby?lat=-34.6037&lng=-58.3816&radius=5000

// Get available categories
GET /api/categories

// Get available banks
GET /api/banks

// Get statistics
GET /api/stats
```

### 3. Updated Data Transformation

The `fetchBusinesses()` function now:

- Calls your MongoDB API directly
- Processes raw JSON benefit data
- Transforms it into the existing Business/BankBenefit structure
- Maintains compatibility with existing UI components

### 4. New Utility Functions

Added new functions to leverage your API endpoints:

```typescript
import {
  fetchBenefitById,
  fetchNearbyBenefits,
  fetchCategories,
  fetchBanks,
  fetchStats,
} from "./services/api";

// Get a specific benefit
const benefit = await fetchBenefitById("benefit-id");

// Get nearby benefits
const nearby = await fetchNearbyBenefits(-34.6037, -58.3816, {
  radius: "5000",
  limit: "10",
});

// Get categories and banks
const categories = await fetchCategories();
const banks = await fetchBanks();
const stats = await fetchStats();
```

## Expected MongoDB Data Structure

The API expects your MongoDB benefits to have fields like:

```json
{
  "_id": "benefit-id",
  "name": "Business Name",
  "category": "gastronomia",
  "description": "Benefit description",
  "bank": "BBVA",
  "card": "Credit Card",
  "benefit": "15% discount",
  "reward_rate": "15%",
  "image": "https://example.com/image.jpg",
  "location": "Buenos Aires",
  "tipo": "descuento",
  "cuando": "2024-01-01 a 2024-12-31",
  "valor": "15%",
  "requisitos": ["tarjeta activa"],
  "usos": ["presencial"]
}
```

The transformation handles various field name variations (e.g., `categoria` vs `category`, `banco` vs `bank`).

## How to Use

### 1. Start Your MongoDB API Server

Make sure your MongoDB API is running on `http://localhost:3002`

### 2. Use Existing Components

All existing components will continue to work. The `fetchBusinesses()` function now uses your MongoDB API:

```typescript
import { fetchBusinesses } from "./services/api";

const businesses = await fetchBusinesses();
// Returns transformed Business[] array for UI components
```

### 3. Use New API Functions

For more specific queries, use the new functions:

```typescript
import { fetchNearbyBenefits, fetchCategories } from "./services/api";

// Get benefits near a location
const nearbyBenefits = await fetchNearbyBenefits(-34.6037, -58.3816);

// Get available categories for filters
const categories = await fetchCategories();
```

## Example Usage

See `src/services/mongodb-api-example.ts` for complete examples of how to use all the new API endpoints.

## Fallback Behavior

If your MongoDB API is not available:

- The system falls back to mock data
- Error messages are logged to the console
- The UI continues to function with sample data

## Testing

To test the integration:

1. Start your MongoDB API server on port 3002
2. Run the example: `import { runAllExamples } from './services/mongodb-api-example'`
3. Check the console for API responses

## Next Steps

1. **Update API URL**: Change the `BASE_URL` in `src/services/api.ts` if your API runs on a different port
2. **Add Authentication**: If your API requires authentication, add headers to the BenefitsAPI class
3. **Error Handling**: Customize error handling based on your API's error responses
4. **Caching**: The existing cache system will work with your new API
5. **Testing**: Update the test files to mock the new MongoDB API structure
