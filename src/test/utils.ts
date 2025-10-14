import { BaseService } from '../services/base';

/**
 * Mock implementation of BaseService for testing
 */
export class MockBaseService implements BaseService {
    private _initialized = false;
    private _destroyed = false;

    constructor(private serviceName: string) { }

    getServiceName(): string {
        return this.serviceName;
    }

    async initialize(): Promise<void> {
        this._initialized = true;
    }

    async destroy(): Promise<void> {
        this._destroyed = true;
        this._initialized = false;
    }

    get initialized(): boolean {
        return this._initialized;
    }

    get destroyed(): boolean {
        return this._destroyed;
    }
}

/**
 * Create a mock fetch response
 */
export function createMockResponse<T>(
    data: T,
    options: Partial<Response> = {}
): Response {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        ...options
    } as Response;
}

/**
 * Create a mock fetch error
 */
export function createMockFetchError(message = 'Network error'): Error {
    return new Error(message);
}

/**
 * Wait for a specified number of milliseconds
 */
export function waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock localStorage for testing
 */
export function createMockStorage(): Storage {
    const store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        }),
        length: 0,
        key: vi.fn()
    };
}

/**
 * Test data generators
 */
export const testData = {
    business: {
        id: 'test-business-1',
        name: 'Test Business',
        category: 'gastronomia',
        description: 'A test business',
        rating: 4.5,
        location: 'Test Location',
        image: 'https://example.com/image.jpg',
        benefits: []
    },

    bankBenefit: {
        bankName: 'Test Bank',
        cardName: 'Test Card',
        benefit: 'Test Benefit',
        rewardRate: '5%',
        color: '#FF0000',
        icon: 'test-icon'
    }
};

/**
 * Assert that a function throws a specific error
 */
export async function expectToThrow<T extends Error>(
    fn: () => Promise<any> | any,
    errorClass: new (...args: any[]) => T
): Promise<T> {
    try {
        await fn();
        throw new Error('Expected function to throw');
    } catch (error) {
        expect(error).toBeInstanceOf(errorClass);
        return error as T;
    }
}