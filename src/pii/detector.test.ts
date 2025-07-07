import { PIIDetector } from './detector';
import { PIIDetectionConfig } from '../types';

describe('PIIDetector', () => {
  let detector: PIIDetector;

  beforeEach(() => {
    const config: PIIDetectionConfig = {
      detectSSN: true,
      detectCreditCards: true,
      detectEmails: true,
      detectPhoneNumbers: true,
      detectIPAddresses: true,
      detectAPIKeys: true,
      customPatterns: []
    };
    detector = new PIIDetector(config);
  });

  describe('SSN Detection', () => {
    it('should detect SSN with dashes', () => {
      const result = detector.detect('My SSN is 123-45-6789');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('SSN');
      expect(result.cleanedText).toBe('My SSN is [REDACTED_SSN]');
    });

    it('should detect SSN without dashes', () => {
      const result = detector.detect('My SSN is 123456789');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('SSN');
    });
  });

  describe('Email Detection', () => {
    it('should detect email addresses', () => {
      const result = detector.detect('Contact me at john@example.com');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Email');
      expect(result.cleanedText).toBe('Contact me at [REDACTED_EMAIL]');
    });
  });

  describe('Credit Card Detection', () => {
    it('should detect credit card numbers', () => {
      const result = detector.detect('My card is 4111-1111-1111-1111');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Credit Card');
      expect(result.cleanedText).toBe('My card is [REDACTED_CREDIT_CARD]');
    });
  });

  describe('Phone Number Detection', () => {
    it('should detect phone numbers', () => {
      const result = detector.detect('Call me at 555-123-4567');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Phone Number');
      expect(result.cleanedText).toBe('Call me at [REDACTED_PHONE]');
    });
  });

  describe('Multiple PII Detection', () => {
    it('should detect multiple types of PII', () => {
      const result = detector.detect('Email: john@example.com, SSN: 123-45-6789, Phone: 555-123-4567');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Email');
      expect(result.detectedTypes).toContain('SSN');
      expect(result.detectedTypes).toContain('Phone Number');
      expect(result.redactedCount).toBe(3);
    });
  });

  describe('No PII Detection', () => {
    it('should not detect PII in clean text', () => {
      const result = detector.detect('This is just a normal sentence.');
      expect(result.hasPII).toBe(false);
      expect(result.detectedTypes).toHaveLength(0);
      expect(result.cleanedText).toBe('This is just a normal sentence.');
    });
  });

  describe('Custom Patterns', () => {
    it('should detect custom patterns', () => {
      const config: PIIDetectionConfig = {
        detectSSN: false,
        detectCreditCards: false,
        detectEmails: false,
        detectPhoneNumbers: false,
        detectIPAddresses: false,
        detectAPIKeys: false,
        customPatterns: [{
          name: 'Employee ID',
          pattern: 'EMP-\\d{6}',
          replacement: '[REDACTED_EMPLOYEE_ID]'
        }]
      };
      const customDetector = new PIIDetector(config);
      const result = customDetector.detect('Employee ID: EMP-123456');
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Employee ID');
      expect(result.cleanedText).toBe('Employee ID: [REDACTED_EMPLOYEE_ID]');
    });
  });
});