import * as fs from 'fs';
import * as path from 'path';
import { Config, PartialConfig, PIIDetectionConfig, LoggingConfig } from '../types';

export class ConfigManager {
  private config: Config;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
  }

  private loadConfig(configPath?: string): Config {
    // Load default config
    const defaultConfigPath = path.join(__dirname, '../../config/default.json');
    const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf-8'));

    // Load custom config if provided
    if (configPath && fs.existsSync(configPath)) {
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return this.mergeConfigs(defaultConfig, customConfig);
    }

    // Check for environment variables
    const envConfig = this.loadFromEnv();
    
    return this.mergeConfigs(defaultConfig, envConfig);
  }

  private loadFromEnv(): PartialConfig {
    const envConfig: PartialConfig = {};

    // Port
    if (process.env.LLM_FIREWALL_PORT) {
      envConfig.port = parseInt(process.env.LLM_FIREWALL_PORT, 10);
    }

    // PII Detection settings
    if (process.env.LLM_FIREWALL_DETECT_SSN) {
      if (!envConfig.pii) envConfig.pii = {};
      envConfig.pii.detectSSN = process.env.LLM_FIREWALL_DETECT_SSN === 'true';
    }

    if (process.env.LLM_FIREWALL_DETECT_EMAILS) {
      if (!envConfig.pii) envConfig.pii = {};
      envConfig.pii.detectEmails = process.env.LLM_FIREWALL_DETECT_EMAILS === 'true';
    }

    if (process.env.LLM_FIREWALL_DETECT_CREDIT_CARDS) {
      if (!envConfig.pii) envConfig.pii = {};
      envConfig.pii.detectCreditCards = process.env.LLM_FIREWALL_DETECT_CREDIT_CARDS === 'true';
    }

    // Logging level
    if (process.env.LLM_FIREWALL_LOG_LEVEL) {
      if (!envConfig.logging) envConfig.logging = {};
      envConfig.logging.level = process.env.LLM_FIREWALL_LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug';
    }

    return envConfig;
  }

  private mergeConfigs(base: Config, override: PartialConfig): Config {
    return {
      ...base,
      ...override,
      pii: {
        ...base.pii,
        ...override.pii
      },
      logging: {
        ...base.logging,
        ...override.logging
      },
      providers: {
        ...base.providers,
        ...override.providers
      },
      rateLimit: {
        ...base.rateLimit,
        ...override.rateLimit
      }
    };
  }

  public getConfig(): Config {
    return this.config;
  }

  public updateConfig(updates: PartialConfig): void {
    this.config = this.mergeConfigs(this.config, updates);
  }
}