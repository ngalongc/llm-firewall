import { PIIDetectionConfig, PIIDetectionResult, CustomPattern } from '../types';

export class PIIDetector {
  private config: PIIDetectionConfig;

  constructor(config: PIIDetectionConfig) {
    this.config = config;
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

  public detect(text: string): PIIDetectionResult {
    let cleanedText = text;
    const detectedTypes: string[] = [];
    let redactedCount = 0;

    // Check each PII type based on config
    if (this.config.detectSSN) {
      const matches = text.match(PIIDetector.patterns.ssn.regex);
      if (matches) {
        detectedTypes.push(PIIDetector.patterns.ssn.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(PIIDetector.patterns.ssn.regex, PIIDetector.patterns.ssn.replacement);
      }
    }

    if (this.config.detectCreditCards) {
      const matches = text.match(PIIDetector.patterns.creditCard.regex);
      if (matches) {
        detectedTypes.push(PIIDetector.patterns.creditCard.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(PIIDetector.patterns.creditCard.regex, PIIDetector.patterns.creditCard.replacement);
      }
    }

    if (this.config.detectEmails) {
      const matches = text.match(PIIDetector.patterns.email.regex);
      if (matches) {
        detectedTypes.push(PIIDetector.patterns.email.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(PIIDetector.patterns.email.regex, PIIDetector.patterns.email.replacement);
      }
    }

    if (this.config.detectPhoneNumbers) {
      const matches = text.match(PIIDetector.patterns.phoneNumber.regex);
      if (matches) {
        detectedTypes.push(PIIDetector.patterns.phoneNumber.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(PIIDetector.patterns.phoneNumber.regex, PIIDetector.patterns.phoneNumber.replacement);
      }
    }

    if (this.config.detectIPAddresses) {
      const matches = text.match(PIIDetector.patterns.ipAddress.regex);
      if (matches) {
        detectedTypes.push(PIIDetector.patterns.ipAddress.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(PIIDetector.patterns.ipAddress.regex, PIIDetector.patterns.ipAddress.replacement);
      }
    }

    if (this.config.detectAPIKeys) {
      const matches = text.match(PIIDetector.patterns.apiKey.regex);
      if (matches) {
        detectedTypes.push(PIIDetector.patterns.apiKey.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(PIIDetector.patterns.apiKey.regex, PIIDetector.patterns.apiKey.replacement);
      }
    }

    // Apply custom patterns
    this.config.customPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.pattern, 'g');
      const matches = text.match(regex);
      if (matches) {
        detectedTypes.push(pattern.name);
        redactedCount += matches.length;
        cleanedText = cleanedText.replace(regex, pattern.replacement);
      }
    });

    return {
      hasPII: detectedTypes.length > 0,
      detectedTypes: [...new Set(detectedTypes)], // Remove duplicates
      cleanedText,
      redactedCount
    };
  }

  public scanObject(obj: any): PIIDetectionResult {
    const jsonString = JSON.stringify(obj);
    const result = this.detect(jsonString);
    
    if (result.hasPII) {
      try {
        const cleanedObj = JSON.parse(result.cleanedText);
        return {
          ...result,
          cleanedText: JSON.stringify(cleanedObj)
        };
      } catch {
        // If JSON parsing fails, return the string result
        return result;
      }
    }
    
    return result;
  }
}