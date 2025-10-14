import { describe, it, expect } from 'vitest';
import {
    NetworkError,
    ValidationError,
    StorageError,
    CacheError,
    GeneralServiceError,
    UserInputError,
    ErrorCategory
} from '../errors';

describe('Service Errors', () => {
    describe('NetworkError', () => {
        it('should create network error with correct properties', () => {
            const context = { url: 'https://api.example.com' };
            const error = new NetworkError('Connection failed', context);

            expect(error.message).toBe('Connection failed');
            expect(error.code).toBe('NETWORK_ERROR');
            expect(error.category).toBe(ErrorCategory.NETWORK);
            expect(error.context).toBe(context);
            expect(error.name).toBe('NetworkError');
        });

        it('should serialize to JSON correctly', () => {
            const error = new NetworkError('Test error', { test: 'data' });
            const json = error.toJSON();

            expect(json).toMatchObject({
                name: 'NetworkError',
                message: 'Test error',
                code: 'NETWORK_ERROR',
                category: ErrorCategory.NETWORK,
                context: { test: 'data' }
            });
            expect(json.stack).toBeDefined();
        });
    });

    describe('ValidationError', () => {
        it('should create validation error with correct properties', () => {
            const context = { field: 'email', value: 'invalid' };
            const error = new ValidationError('Invalid email format', context);

            expect(error.message).toBe('Invalid email format');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.category).toBe(ErrorCategory.VALIDATION);
            expect(error.context).toBe(context);
        });
    });

    describe('StorageError', () => {
        it('should create storage error with correct properties', () => {
            const error = new StorageError('Quota exceeded');

            expect(error.message).toBe('Quota exceeded');
            expect(error.code).toBe('STORAGE_ERROR');
            expect(error.category).toBe(ErrorCategory.STORAGE);
        });
    });

    describe('CacheError', () => {
        it('should create cache error with correct properties', () => {
            const error = new CacheError('Cache miss');

            expect(error.message).toBe('Cache miss');
            expect(error.code).toBe('CACHE_ERROR');
            expect(error.category).toBe(ErrorCategory.CACHE);
        });
    });

    describe('GeneralServiceError', () => {
        it('should create service error with correct properties', () => {
            const error = new GeneralServiceError('Service unavailable');

            expect(error.message).toBe('Service unavailable');
            expect(error.code).toBe('SERVICE_ERROR');
            expect(error.category).toBe(ErrorCategory.SERVICE);
        });
    });

    describe('UserInputError', () => {
        it('should create user input error with correct properties', () => {
            const error = new UserInputError('Invalid input');

            expect(error.message).toBe('Invalid input');
            expect(error.code).toBe('USER_INPUT_ERROR');
            expect(error.category).toBe(ErrorCategory.USER_INPUT);
        });
    });
});