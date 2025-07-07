import winston from 'winston';
import { LoggingConfig, RequestLog } from '../types';

export class Logger {
  private logger: winston.Logger;
  private config: LoggingConfig;

  constructor(config: LoggingConfig) {
    this.config = config;
    this.logger = winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        })
      ]
    });
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public logRequest(requestLog: RequestLog): void {
    if (!this.config.logRequests) {
      return;
    }

    const logData = {
      ...requestLog,
      // Redact PII types if logPII is false
      piiTypes: this.config.logPII ? requestLog.piiTypes : requestLog.piiTypes.map(() => '[REDACTED]')
    };

    if (requestLog.hasPII) {
      this.warn('PII detected in request', logData);
    } else {
      this.info('Request processed', logData);
    }
  }

  public logPIIIncident(incident: {
    requestId: string;
    piiTypes: string[];
    redactedCount: number;
    provider: string;
    timestamp: Date;
  }): void {
    this.warn('PII incident detected', {
      ...incident,
      piiTypes: this.config.logPII ? incident.piiTypes : incident.piiTypes.map(() => '[REDACTED]')
    });
  }
}