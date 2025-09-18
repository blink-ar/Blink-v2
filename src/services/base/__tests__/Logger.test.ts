import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, LogLevel } from '../Logger';

describe('Logger', () => {
    let logger: Logger;
    let consoleSpy: any;

    beforeEach(() => {
        logger = Logger.getInstance();
        logger.clearLogs();
        logger.setLogLevel(LogLevel.DEBUG);

        // Mock console methods
        consoleSpy = {
            debug: vi.spyOn(console, 'debug').mockImplementation(() => { }),
            info: vi.spyOn(console, 'info').mockImplementation(() => { }),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
            error: vi.spyOn(console, 'error').mockImplementation(() => { })
        };
    });

    afterEach(() => {
        Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = Logger.getInstance();
            const instance2 = Logger.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('logging levels', () => {
        it('should log debug messages', () => {
            logger.debug('Debug message', { test: 'data' });

            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe(LogLevel.DEBUG);
            expect(logs[0].message).toBe('Debug message');
            expect(logs[0].context).toEqual({ test: 'data' });
        });

        it('should log info messages', () => {
            logger.info('Info message');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe(LogLevel.INFO);
            expect(logs[0].message).toBe('Info message');
        });

        it('should log warning messages', () => {
            logger.warn('Warning message');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe(LogLevel.WARN);
            expect(logs[0].message).toBe('Warning message');
        });

        it('should log error messages', () => {
            const error = new Error('Test error');
            logger.error('Error message', error, { context: 'test' });

            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe(LogLevel.ERROR);
            expect(logs[0].message).toBe('Error message');
            expect(logs[0].error).toBe(error);
            expect(logs[0].context).toEqual({ context: 'test' });
        });
    });

    describe('log level filtering', () => {
        it('should filter logs based on log level', () => {
            logger.setLogLevel(LogLevel.WARN);

            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(2);
            expect(logs[0].level).toBe(LogLevel.WARN);
            expect(logs[1].level).toBe(LogLevel.ERROR);
        });
    });

    describe('service logger', () => {
        it('should create service-specific logger', () => {
            const serviceLogger = logger.createServiceLogger('TestService');

            serviceLogger.info('Service message');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].service).toBe('TestService');
            expect(logs[0].message).toBe('Service message');
        });
    });

    describe('log management', () => {
        it('should limit number of logs', () => {
            logger.setMaxLogs(3);

            logger.info('Message 1');
            logger.info('Message 2');
            logger.info('Message 3');
            logger.info('Message 4');

            const logs = logger.getLogs();
            expect(logs).toHaveLength(3);
            expect(logs[0].message).toBe('Message 2');
            expect(logs[2].message).toBe('Message 4');
        });

        it('should get recent logs', () => {
            logger.info('Message 1');
            logger.info('Message 2');
            logger.info('Message 3');

            const recentLogs = logger.getLogs(2);
            expect(recentLogs).toHaveLength(2);
            expect(recentLogs[0].message).toBe('Message 2');
            expect(recentLogs[1].message).toBe('Message 3');
        });

        it('should clear all logs', () => {
            logger.info('Message 1');
            logger.info('Message 2');

            logger.clearLogs();

            expect(logger.getLogs()).toHaveLength(0);
        });
    });
});