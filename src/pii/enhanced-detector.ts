import { PIIDetectionConfig, PIIDetectionResult, CustomPattern } from '../types';
import { RuleManager, Rule } from '../rules';
import { logger } from '../logging/logger';

export class EnhancedPIIDetector {
  private config: PIIDetectionConfig;
  private ruleManager: RuleManager;

  constructor(config: PIIDetectionConfig, ruleManager?: RuleManager) {
    this.config = config;
    this.ruleManager = ruleManager || new RuleManager();
  }

  public async loadRules(): Promise<void> {
    await this.ruleManager.loadRules();
  }

  private static readonly patterns = {
    ssn: {
      regex: /\b(?:\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{9})\b/g,
      replacement: '[REDACTED_SSN]',
      name: 'SSN'
    },
    creditCard: {
      regex: /\b(?:\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}|\d{13,19})\b/g,
      replacement: '[REDACTED_CREDIT_CARD]',
      name: 'Credit Card'
    },
    email: {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[REDACTED_EMAIL]',
      name: 'Email'
    },
    phoneNumber: {
      regex: /\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
      replacement: '[REDACTED_PHONE]',
      name: 'Phone Number'
    },
    ipAddress: {
      regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      replacement: '[REDACTED_IP]',
      name: 'IP Address'
    },
    apiKey: {
      regex: /\b(?:sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9]{32,})\b/g,
      replacement: '[REDACTED_API_KEY]',
      name: 'API Key'
    }
  };

  public async detect(text: string): Promise<PIIDetectionResult> {
    let cleanedText = text;
    const detectedTypes: string[] = [];
    let redactedCount = 0;

    // Apply legacy patterns for backward compatibility
    if (this.config.detectSSN) {
      const matches = text.match(EnhancedPIIDetector.patterns.ssn.regex);
      if (matches) {
        detectedTypes.push(EnhancedPIIDetector.patterns.ssn.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(EnhancedPIIDetector.patterns.ssn.regex, EnhancedPIIDetector.patterns.ssn.replacement);
      }
    }

    if (this.config.detectCreditCards) {
      const matches = text.match(EnhancedPIIDetector.patterns.creditCard.regex);
      if (matches) {
        detectedTypes.push(EnhancedPIIDetector.patterns.creditCard.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(EnhancedPIIDetector.patterns.creditCard.regex, EnhancedPIIDetector.patterns.creditCard.replacement);
      }
    }

    if (this.config.detectEmails) {
      const matches = text.match(EnhancedPIIDetector.patterns.email.regex);
      if (matches) {
        detectedTypes.push(EnhancedPIIDetector.patterns.email.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(EnhancedPIIDetector.patterns.email.regex, EnhancedPIIDetector.patterns.email.replacement);
      }
    }

    if (this.config.detectPhoneNumbers) {
      const matches = text.match(EnhancedPIIDetector.patterns.phoneNumber.regex);
      if (matches) {
        detectedTypes.push(EnhancedPIIDetector.patterns.phoneNumber.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(EnhancedPIIDetector.patterns.phoneNumber.regex, EnhancedPIIDetector.patterns.phoneNumber.replacement);
      }
    }

    if (this.config.detectIPAddresses) {
      const matches = text.match(EnhancedPIIDetector.patterns.ipAddress.regex);
      if (matches) {
        detectedTypes.push(EnhancedPIIDetector.patterns.ipAddress.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(EnhancedPIIDetector.patterns.ipAddress.regex, EnhancedPIIDetector.patterns.ipAddress.replacement);
      }
    }

    if (this.config.detectAPIKeys) {
      const matches = text.match(EnhancedPIIDetector.patterns.apiKey.regex);
      if (matches) {
        detectedTypes.push(EnhancedPIIDetector.patterns.apiKey.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(EnhancedPIIDetector.patterns.apiKey.regex, EnhancedPIIDetector.patterns.apiKey.replacement);
      }
    }

    // Apply custom patterns from config
    this.config.customPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.pattern, 'g');
      const matches = text.match(regex);
      if (matches) {
        detectedTypes.push(pattern.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(regex, pattern.replacement);
      }
    });

    // Apply community rules
    try {
      const communityRules = this.ruleManager.getRules({ enabled: true });
      for (const rule of communityRules) {
        try {
          const regex = new RegExp(rule.pattern, rule.flags || 'g');
          const matches = cleanedText.match(regex);
          if (matches) {
            detectedTypes.push(rule.name);
            redactedCount += matches.length;
            cleanedText = cleanedText.replace(regex, rule.replacement);
            
            logger.debug(`Applied rule ${rule.id}: ${matches.length} matches`);
          }
        } catch (error) {
          logger.error(`Error applying rule ${rule.id}:`, error instanceof Error ? error : undefined);
        }
      }
    } catch (error) {
      logger.error('Error processing community rules:', error instanceof Error ? error : undefined);
    }

    return {
      hasPII: detectedTypes.length > 0,
      detectedTypes: [...new Set(detectedTypes)],
      cleanedText,
      redactedCount
    };
  }

  public async scanObject(obj: any): Promise<PIIDetectionResult> {
    const jsonString = JSON.stringify(obj);
    const result = await this.detect(jsonString);
    
    if (result.hasPII) {
      try {
        const cleanedObj = JSON.parse(result.cleanedText);
        return {
          ...result,
          cleanedText: JSON.stringify(cleanedObj)
        };
      } catch {
        return result;
      }
    }
    
    return result;
  }

  public getRuleManager(): RuleManager {
    return this.ruleManager;
  }
}