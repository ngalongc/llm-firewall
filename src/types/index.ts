export interface PIIDetectionConfig {
  detectSSN: boolean;
  detectCreditCards: boolean;
  detectEmails: boolean;
  detectPhoneNumbers: boolean;
  detectIPAddresses: boolean;
  detectAPIKeys: boolean;
  customPatterns: CustomPattern[];
}

export interface CustomPattern {
  name: string;
  pattern: string;
  replacement: string;
}

export interface Config {
  port: number;
  pii: PIIDetectionConfig;
  logging: LoggingConfig;
  providers: ProviderConfig;
  rateLimit: RateLimitConfig;
  rules: RulesConfig;
}

export interface PartialConfig {
  port?: number;
  pii?: Partial<PIIDetectionConfig>;
  logging?: Partial<LoggingConfig>;
  providers?: Partial<ProviderConfig>;
  rateLimit?: Partial<RateLimitConfig>;
  rules?: Partial<RulesConfig>;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  logPII: boolean;
  logRequests: boolean;
}

export interface ProviderConfig {
  openai: ProviderSettings;
  anthropic: ProviderSettings;
}

export interface ProviderSettings {
  enabled: boolean;
  baseURL?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  cleanedText: string;
  redactedCount: number;
}

export interface RulesConfig {
  enabled: boolean;
  rulesDir: string;
  autoReload: boolean;
  minConfidence: number;
  enabledCategories: string[];
  disabledRules: string[];
}

export interface RequestLog {
  id: string;
  timestamp: Date;
  provider: string;
  method: string;
  path: string;
  hasPII: boolean;
  piiTypes: string[];
  redactedCount: number;
  responseTime: number;
  statusCode: number;
}