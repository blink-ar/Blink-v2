import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceRegistry } from '../ServiceRegistry';
import { MockBaseService } from '../../../test/utils';

describe('ServiceRegistry', () => {
    let registry: ServiceRegistry;
    let service1: MockBaseService;
    let service2: MockBaseService;

    beforeEach(() => {
        registry = ServiceRegistry.getInstance();
        // Clear any existing services
        registry.destroyAll();

        service1 = new MockBaseService('Service1');
        service2 = new MockBaseService('Service2');
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = ServiceRegistry.getInstance();
            const instance2 = ServiceRegistry.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('service registration', () => {
        it('should register a service', () => {
            const registered = registry.register(service1);

            expect(registered).toBe(service1);
            expect(registry.getRegisteredServices()).toContain('Service1');
        });

        it('should throw error when registering duplicate service', () => {
            registry.register(service1);

            expect(() => registry.register(new MockBaseService('Service1')))
                .toThrow('Service Service1 is already registered');
        });

        it('should get registered service', () => {
            registry.register(service1);

            const retrieved = registry.get<MockBaseService>('Service1');

            expect(retrieved).toBe(service1);
        });

        it('should return undefined for unregistered service', () => {
            const retrieved = registry.get('NonExistent');

            expect(retrieved).toBeUndefined();
        });
    });

    describe('service lifecycle', () => {
        it('should initialize all services', async () => {
            registry.register(service1);
            registry.register(service2);

            await registry.initializeAll();

            expect(service1.initialized).toBe(true);
            expect(service2.initialized).toBe(true);
        });

        it('should destroy all services', async () => {
            registry.register(service1);
            registry.register(service2);
            await registry.initializeAll();

            await registry.destroyAll();

            expect(service1.destroyed).toBe(true);
            expect(service2.destroyed).toBe(true);
            expect(registry.getRegisteredServices()).toHaveLength(0);
        });
    });

    describe('service listing', () => {
        it('should list registered services', () => {
            registry.register(service1);
            registry.register(service2);

            const services = registry.getRegisteredServices();

            expect(services).toContain('Service1');
            expect(services).toContain('Service2');
            expect(services).toHaveLength(2);
        });
    });
});