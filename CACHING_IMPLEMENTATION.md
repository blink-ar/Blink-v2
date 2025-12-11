# Benefits Data Caching Implementation

## Overview

This implementation adds intelligent caching to prevent unnecessary API calls when navigating between pages in the benefits app. The solution uses a centralized data service with localStorage-based caching.

## Key Components

### 1. BenefitsDataService (`src/services/BenefitsDataService.ts`)

A singleton service that provides cached access to benefits data:

- **Caches all businesses data** for 30 minutes
- **Caches raw benefits data** with different cache keys based on query parameters
- **Provides featured benefits** as a separate cached entity
- **Automatic fallback** to stale data if API fails
- **Force refresh capability** for manual updates

### 2. useBenefitsData Hook (`src/hooks/useBenefitsData.ts`)

React hooks that provide easy access to cached data:

- `useBenefitsData()` - Full data access with loading states and refresh capability
- `useBusinessesData()` - Lightweight hook for businesses only
- `useFeaturedBenefits()` - Lightweight hook for featured benefits only

### 3. Updated Pages

#### Home.tsx

- Now uses `useBenefitsData()` hook instead of direct API calls
- Shows cache status indicator when data is loaded from cache
- Includes refresh button to manually update data
- Displays cache statistics (for debugging)

#### Benefit.tsx

- Uses `useBusinessesData()` hook for businesses
- Leverages cached data service for raw benefits lookup
- No longer refetches businesses data on every page load

## Cache Behavior

### Cache Duration

- **Default TTL**: 30 minutes
- **Cache size limit**: 20 entries max
- **Storage limit**: 5MB max

### Cache Keys

- `all_businesses` - All business data
- `raw_benefits_{options}` - Raw benefits with specific query parameters
- `featured_benefits` - First 10 benefits for homepage

### Cache Invalidation

- **Automatic**: After 30 minutes
- **Manual**: Via refresh button or `refreshData()` function
- **On error**: Falls back to stale cache data if available

## Benefits

1. **Faster Navigation**: No API calls when switching between pages
2. **Better UX**: Instant loading from cache
3. **Offline Resilience**: Stale data available when API fails
4. **Reduced Server Load**: Fewer unnecessary API requests
5. **Smart Refresh**: Background refresh when cache is getting old

## Usage

### Basic Usage

```typescript
// In any component
const { businesses, featuredBenefits, isLoading, refreshData } =
  useBenefitsData();
```

### Manual Refresh

```typescript
// Force refresh all data
await refreshData();

// Or refresh specific data
await benefitsDataService.refreshAllData();
```

### Cache Management

```typescript
// Clear all cache
benefitsDataService.clearCache();

// Check cache status
const stats = benefitsDataService.getCacheStats();
const isCached = benefitsDataService.isDataCached("businesses");
```

## Cache Status Component

The `CacheStatus` component (currently visible on homepage) shows:

- Number of cached entries
- Cache size in KB
- Hit/miss rates
- Last update time
- Manual refresh and clear buttons

## Future Enhancements

1. **Background Sync**: Automatically refresh cache in background
2. **Selective Invalidation**: Invalidate specific cache entries
3. **Compression**: Compress cached data to save space
4. **Analytics**: Track cache performance metrics
5. **Service Worker**: Move caching to service worker for better performance

## Testing Cache Behavior

1. **Load Homepage**: Data fetched from API, cached for future use
2. **Navigate to Benefit Page**: Uses cached businesses data
3. **Return to Homepage**: Loads instantly from cache
4. **Wait 30+ minutes**: Cache expires, fresh data fetched
5. **Use Refresh Button**: Forces fresh data fetch
6. **Go Offline**: App continues working with cached data

## Cache Statistics

The cache service tracks:

- **Hit Rate**: Percentage of requests served from cache
- **Miss Rate**: Percentage of requests that required API calls
- **Total Entries**: Number of items in cache
- **Total Size**: Memory usage of cached data
- **Age Information**: Oldest and newest cache entries

This implementation significantly improves the app's performance and user experience by eliminating unnecessary API calls during navigation.
