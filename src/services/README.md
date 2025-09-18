# Service Infrastructure

This directory contains the enhanced service infrastructure for the Blink PWA application. The infrastructure provides a robust foundation for building maintainable, testable, and scalable services.

## Architecture Overview

The service infrastructure consists of several key components:

### Base Service Framework

- **BaseService Interface**: Defines the contract all services must implement
- **AbstractBaseService**: Provides common functionality and lifecycle management
- **ServiceRegistry**: Manages service registration and lifecycle

### Error Handling

- **ServiceError**: Base class for all service errors with categorization
- **Specific Error Types**: NetworkError, ValidationError, StorageError, etc.
- **Error Context**: Rich error information for debugging

### Logging System

- **Logger**: Centralized logging with configurable levels
- **Service Loggers**: Service-specific loggers for better traceability
- **Log Management**: Automatic log rotation and storage

### Utilities

- **Retry Logic**: Exponential backoff for network operations
- **Validation**: Input validation helpers
- **Data Manipulation**: Deep cloning, JSON parsing, etc.

## Usage Examples

### Creating a Service

```typescript
import { AbstractBaseService, Logger, ILogger } from "../base";

export class MyService extends AbstractBaseService {
  private logger: ILogger;

  constructor() {
    super();
    this.logger = Logger.getInstance().createServiceLogger(
      this.getServiceName()
    );
  }

  getServiceName(): string {
    return "MyService";
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info("Initializing MyService");
    // Initialization logic here
  }

  protected async onDestroy(): Promise<void> {
    this.logger.info("Destroying MyService");
    // Cleanup logic here
  }

  // Service methods here
}
```

### Registering Services

```typescript
import { ServiceRegistry } from "./base";
import { MyService } from "./MyService";

const registry = ServiceRegistry.getInstance();
const myService = registry.register(new MyService());

// Initialize all services
await registry.initializeAll();
```

### Error Handling

```typescript
import { NetworkError, ValidationError } from "./base";

// Throw specific errors
if (!isValid(input)) {
  throw new ValidationError("Invalid input", { input });
}

// Handle network errors with retry
try {
  const result = await retryWithBackoff(async () => {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new NetworkError("API request failed");
    }
    return response.json();
  });
} catch (error) {
  logger.error("Failed to fetch data", error);
}
```

### Logging

```typescript
import { Logger } from "./base";

const logger = Logger.getInstance().createServiceLogger("MyService");

logger.debug("Debug information", { context: "data" });
logger.info("Operation completed");
logger.warn("Potential issue detected");
logger.error("Operation failed", error, { context: "additional info" });
```

## Testing

The infrastructure includes comprehensive test utilities:

- **MockBaseService**: Mock implementation for testing
- **Test Utilities**: Helper functions for creating test data
- **Setup Configuration**: Pre-configured test environment

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage
```

## Best Practices

1. **Service Lifecycle**: Always call `initialize()` before using a service
2. **Error Handling**: Use specific error types with context information
3. **Logging**: Use service-specific loggers for better traceability
4. **Testing**: Write comprehensive unit tests for all service methods
5. **Validation**: Validate inputs using the provided utilities
6. **Resource Cleanup**: Implement proper cleanup in `onDestroy()`

## Future Services

The following services will be built on this infrastructure:

- **CategoryFilterService**: Configuration-driven category filtering
- **APIService**: Enhanced API client with caching and retry logic
- **CacheService**: Intelligent caching with TTL and size management
- **UserPreferenceService**: User preferences and favorites management
- **OfflineService**: Offline capability and action queuing

Each service will follow the established patterns and leverage the base infrastructure for consistency and maintainability.
