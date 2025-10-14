import { describe, it, expect, beforeEach } from 'vitest';
import { AbstractBaseService } from '../BaseService';

class TestService extends AbstractBaseService {
    public initializeCalled = false;
    public destroyCalled = false;

    getServiceName(): string {
        return 'TestService';
    }

    protected onInitialize(): void {
        this.initializeCalled = true;
    }

    protected onDestroy(): void {
        this.destroyCalled = true;
    }
}

describe('AbstractBaseService', () => {
    let service: TestService;

    beforeEach(() => {
        service = new TestService();
    });

    describe('initialization', () => {
        it('should initialize service correctly', async () => {
            expect(service.initializeCalled).toBe(false);

            await service.initialize();

            expect(service.initializeCalled).toBe(true);
        });

        it('should not initialize twice', async () => {
            await service.initialize();
            service.initializeCalled = false;

            await service.initialize();

            expect(service.initializeCalled).toBe(false);
        });

        it('should throw error when accessing uninitialized service', () => {
            expect(() => service.ensureInitialized()).toThrow(
                'TestService is not initialized'
            );
        });
    });

    describe('destruction', () => {
        it('should destroy service correctly', async () => {
            await service.initialize();
            expect(service.destroyCalled).toBe(false);

            await service.destroy();

            expect(service.destroyCalled).toBe(true);
        });

        it('should not destroy twice', async () => {
            await service.initialize();
            await service.destroy();
            service.destroyCalled = false;

            await service.destroy();

            expect(service.destroyCalled).toBe(false);
        });

        it('should throw error when accessing destroyed service', async () => {
            await service.initialize();
            await service.destroy();

            expect(() => service.ensureNotDestroyed()).toThrow(
                'TestService has been destroyed'
            );
        });
    });

    describe('service name', () => {
        it('should return correct service name', () => {
            expect(service.getServiceName()).toBe('TestService');
        });
    });
});