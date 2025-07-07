import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Config, RequestLog } from '../types';
import { PIIDetector } from '../pii/detector';
import { Logger } from '../logging/logger';

interface ProxyRequest extends Request {
  requestId?: string;
  startTime?: number;
}

export class ProxyServer {
  private app: express.Application;
  private config: Config;
  private piiDetector: PIIDetector;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.piiDetector = new PIIDetector(config.pii);
    this.logger = new Logger(config.logging);
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request tracking middleware
    this.app.use((req: ProxyRequest, res: Response, next: NextFunction) => {
      req.requestId = uuidv4();
      req.startTime = Date.now();
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Status endpoint
    this.app.get('/status', (req: Request, res: Response) => {
      res.json({
        status: 'running',
        version: '1.0.0',
        config: {
          piiDetection: {
            ssn: this.config.pii.detectSSN,
            creditCards: this.config.pii.detectCreditCards,
            emails: this.config.pii.detectEmails,
            phoneNumbers: this.config.pii.detectPhoneNumbers,
            ipAddresses: this.config.pii.detectIPAddresses,
            apiKeys: this.config.pii.detectAPIKeys
          },
          providers: this.config.providers
        }
      });
    });

    // OpenAI proxy routes
    if (this.config.providers.openai.enabled) {
      this.app.all('/proxy/openai/*', this.handleOpenAIProxy.bind(this));
    }

    // Anthropic proxy routes
    if (this.config.providers.anthropic.enabled) {
      this.app.all('/proxy/anthropic/*', this.handleAnthropicProxy.bind(this));
    }

    // Catch-all for unsupported routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        message: 'Supported routes: /proxy/openai/* and /proxy/anthropic/*'
      });
    });
  }

  private async handleOpenAIProxy(req: ProxyRequest, res: Response): Promise<void> {
    await this.handleProxy(req, res, 'openai');
  }

  private async handleAnthropicProxy(req: ProxyRequest, res: Response): Promise<void> {
    await this.handleProxy(req, res, 'anthropic');
  }

  private async handleProxy(req: ProxyRequest, res: Response, provider: 'openai' | 'anthropic'): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Extract the API path
      const apiPath = req.path.replace(`/proxy/${provider}`, '');
      const baseURL = this.config.providers[provider].baseURL;
      const targetURL = `${baseURL}${apiPath}`;

      // Scan request body for PII
      let requestBody = req.body;
      let piiDetectionResult = { hasPII: false, detectedTypes: [] as string[], cleanedText: '', redactedCount: 0 };

      if (requestBody) {
        piiDetectionResult = this.piiDetector.scanObject(requestBody);
        
        if (piiDetectionResult.hasPII) {
          // Log PII incident
          this.logger.logPIIIncident({
            requestId: req.requestId!,
            piiTypes: piiDetectionResult.detectedTypes,
            redactedCount: piiDetectionResult.redactedCount,
            provider,
            timestamp: new Date()
          });

          // Replace request body with cleaned version
          try {
            requestBody = JSON.parse(piiDetectionResult.cleanedText);
          } catch (error) {
            this.logger.error('Failed to parse cleaned request body', error as Error);
            res.status(400).json({ error: 'Invalid request format after PII redaction' });
            return;
          }
        }
      }

      // Forward request to the actual API
      const response = await axios({
        method: req.method as any,
        url: targetURL,
        headers: {
          ...req.headers,
          host: undefined, // Remove host header to avoid conflicts
          'content-length': undefined // Let axios calculate this
        },
        data: requestBody,
        params: req.query,
        timeout: 30000, // 30 second timeout
        validateStatus: () => true // Don't throw on HTTP error status
      });

      // Log the request
      const requestLog: RequestLog = {
        id: req.requestId!,
        timestamp: new Date(),
        provider,
        method: req.method,
        path: apiPath,
        hasPII: piiDetectionResult.hasPII,
        piiTypes: piiDetectionResult.detectedTypes,
        redactedCount: piiDetectionResult.redactedCount,
        responseTime: Date.now() - startTime,
        statusCode: response.status
      };

      this.logger.logRequest(requestLog);

      // Forward response
      res.status(response.status);
      
      // Set response headers (except some that shouldn't be forwarded)
      Object.keys(response.headers).forEach(key => {
        if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          res.set(key, response.headers[key]);
        }
      });

      res.json(response.data);

    } catch (error) {
      this.logger.error('Proxy request failed', error as Error, {
        requestId: req.requestId,
        provider,
        path: req.path,
        method: req.method
      });

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Proxy request failed' };
        res.status(status).json(data);
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        });
      }
    }
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      this.logger.info(`LLM Firewall proxy server started on port ${this.config.port}`);
      this.logger.info(`OpenAI proxy: ${this.config.providers.openai.enabled ? 'enabled' : 'disabled'}`);
      this.logger.info(`Anthropic proxy: ${this.config.providers.anthropic.enabled ? 'enabled' : 'disabled'}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}