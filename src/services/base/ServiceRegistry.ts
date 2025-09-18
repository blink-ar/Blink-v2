import { BaseService } from './BaseService';

/**
 * Service registry for managing service lifecycle
 */
export class ServiceRegistry {
    private static instance: ServiceRegistry;
    private services = new Map<string, BaseService>();

    private constructor() { }

    static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    /**
     * Register a service with the registry
     */
    register<T extends BaseService>(service: T): T {
        const serviceName = service.getServiceName();

        if (this.services.has(serviceName)) {
            throw new Error(`Service ${serviceName} is already registered`);
        }

        this.services.set(serviceName, service);
        return service;
    }

    /**
     * Get a registered service by name
     */
    get<T extends BaseService>(serviceName: string): T | undefined {
        return this.services.get(serviceName) as T;
    }

    /**
     * Initialize all registered services
     */
    async initializeAll(): Promise<void> {
        const initPromises = Array.from(this.services.values()).map(service =>
            service.initialize()
        );

        await Promise.all(initPromises);
    }

    /**
     * Destroy all registered services
     */
    async destroyAll(): Promise<void> {
        const destroyPromises = Array.from(this.services.values()).map(service =>
            service.destroy()
        );

        await Promise.all(destroyPromises);
        this.services.clear();
    }

    /**
     * Get all registered service names
     */
    getRegisteredServices(): string[] {
        return Array.from(this.services.keys());
    }
}