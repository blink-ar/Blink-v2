import { ServiceError } from './errors';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    service: string;
    message: string;
    context?: Record<string, any>;
    error?: Error;
}

/**
 * Logger interface for services
 */
export interface ILogger {
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * Logger implementation with configurable output and storage
 */
export class Logger implements ILogger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.INFO;
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    private constructor() {
        // Set log level based on environment
        if (import.meta.env.DEV) {
            this.logLevel = LogLevel.DEBUG;
        }
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    setMaxLogs(max: number): void {
        this.maxLogs = max;
        this.trimLogs();
    }

    debug(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, 'SYSTEM', message, context);
    }

    info(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.INFO, 'SYSTEM', message, context);
    }

    warn(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.WARN, 'SYSTEM', message, context);
    }

    error(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(LogLevel.ERROR, 'SYSTEM', message, context, error);
    }

    /**
     * Create a service-specific logger
     */
    createServiceLogger(serviceName: string): ILogger {
        return {
            debug: (message: string, context?: Record<string, any>) =>
                this.log(LogLevel.DEBUG, serviceName, message, context),
            info: (message: string, context?: Record<string, any>) =>
                this.log(LogLevel.INFO, serviceName, message, context),
            warn: (message: string, context?: Record<string, any>) =>
                this.log(LogLevel.WARN, serviceName, message, context),
            error: (message: string, error?: Error, context?: Record<string, any>) =>
                this.log(LogLevel.ERROR, serviceName, message, context, error)
        };
    }

    private log(
        level: LogLevel,
        service: string,
        message: string,
        context?: Record<string, any>,
        error?: Error
    ): void {
        if (level < this.logLevel) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: Date.now(),
            level,
            service,
            message,
            context,
            error
        };

        this.logs.push(logEntry);
        this.trimLogs();

        // Output to console in development
        if (import.meta.env.DEV) {
            this.outputToConsole(logEntry);
        }
    }

    private outputToConsole(entry: LogEntry): void {
        const timestamp = new Date(entry.timestamp).toISOString();
        const levelName = LogLevel[entry.level];
        const prefix = `[${timestamp}] ${levelName} [${entry.service}]`;

        const args = [
            `${prefix} ${entry.message}`,
            ...(entry.context ? [entry.context] : []),
            ...(entry.error ? [entry.error] : [])
        ];

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(...args);
                break;
            case LogLevel.INFO:
                console.info(...args);
                break;
            case LogLevel.WARN:
                console.warn(...args);
                break;
            case LogLevel.ERROR:
                console.error(...args);
                break;
        }
    }

    private trimLogs(): void {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    /**
     * Get recent logs for debugging
     */
    getLogs(count?: number): LogEntry[] {
        if (count) {
            return this.logs.slice(-count);
        }
        return [...this.logs];
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }
}