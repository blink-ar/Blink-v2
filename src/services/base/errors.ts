/**
 * Base error class for all service errors
 */
export abstract class ServiceError extends Error {
    abstract readonly code: string;
    abstract readonly category: ErrorCategory;

    constructor(
        message: string,
        public readonly context?: Record<string, any>
    ) {
        super(message);
        this.name = this.constructor.name;
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            category: this.category,
            context: this.context,
            stack: this.stack
        };
    }
}

export enum ErrorCategory {
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    STORAGE = 'STORAGE',
    CACHE = 'CACHE',
    SERVICE = 'SERVICE',
    USER_INPUT = 'USER_INPUT'
}

/**
 * Network-related errors
 */
export class NetworkError extends ServiceError {
    readonly code = 'NETWORK_ERROR';
    readonly category = ErrorCategory.NETWORK;

    constructor(message: string, context?: Record<string, any>) {
        super(message, context);
    }
}

/**
 * Validation errors
 */
export class ValidationError extends ServiceError {
    readonly code = 'VALIDATION_ERROR';
    readonly category = ErrorCategory.VALIDATION;

    constructor(message: string, context?: Record<string, any>) {
        super(message, context);
    }
}

/**
 * Storage-related errors
 */
export class StorageError extends ServiceError {
    readonly code = 'STORAGE_ERROR';
    readonly category = ErrorCategory.STORAGE;

    constructor(message: string, context?: Record<string, any>) {
        super(message, context);
    }
}

/**
 * Cache-related errors
 */
export class CacheError extends ServiceError {
    readonly code = 'CACHE_ERROR';
    readonly category = ErrorCategory.CACHE;

    constructor(message: string, context?: Record<string, any>) {
        super(message, context);
    }
}

/**
 * General service errors
 */
export class GeneralServiceError extends ServiceError {
    readonly code = 'SERVICE_ERROR';
    readonly category = ErrorCategory.SERVICE;

    constructor(message: string, context?: Record<string, any>) {
        super(message, context);
    }
}

/**
 * User input errors
 */
export class UserInputError extends ServiceError {
    readonly code = 'USER_INPUT_ERROR';
    readonly category = ErrorCategory.USER_INPUT;

    constructor(message: string, context?: Record<string, any>) {
        super(message, context);
    }
}