import { EnhancedPIIDetector } from '../pii/enhanced-detector';
import { RuleManager } from './index';
import { PIIDetectionConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('EnhancedPIIDetector', () => {
  let detector: EnhancedPIIDetector;
  let ruleManager: RuleManager;
  let tempRulesDir: string;

  beforeEach(() => {
    // Create temporary rules directory for testing
    tempRulesDir = path.join(__dirname, '../../temp-rules-test');
    if (fs.existsSync(tempRulesDir)) {
      fs.rmSync(tempRulesDir, { recursive: true });
    }
    fs.mkdirSync(tempRulesDir, { recursive: true });
    fs.mkdirSync(path.join(tempRulesDir, 'core'), { recursive: true });

    // Create test rule file
    const testRules = {
      name: 'Test Rules',
      version: '1.0.0',
      description: 'Test rules for unit testing',
      rules: [
        {
          id: 'test_pattern',
          name: 'Test Pattern',
          description: 'Test pattern for unit testing',
          pattern: 'TEST-\\d{4}',
          flags: 'g',
          replacement: '[REDACTED_TEST]',
          confidence: 0.9,
          category: 'custom',
          severity: 'low',
          enabled: true
        }
      ]
    };

    fs.writeFileSync(
      path.join(tempRulesDir, 'core', 'test-rules.json'),
      JSON.stringify(testRules, null, 2)
    );

    const config: PIIDetectionConfig = {
      detectSSN: true,
      detectCreditCards: true,
      detectEmails: true,
      detectPhoneNumbers: true,
      detectIPAddresses: true,
      detectAPIKeys: true,
      customPatterns: []
    };

    ruleManager = new RuleManager(tempRulesDir);
    detector = new EnhancedPIIDetector(config, ruleManager);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempRulesDir)) {
      fs.rmSync(tempRulesDir, { recursive: true });
    }
  });

  describe('Community Rules Integration', () => {
    it('should load and apply community rules', async () => {
      await detector.loadRules();
      
      const result = await detector.detect('Found pattern TEST-1234 in the text');
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Test Pattern');
      expect(result.cleanedText).toBe('Found pattern [REDACTED_TEST] in the text');
      expect(result.redactedCount).toBe(1);
    });

    it('should work with legacy patterns and community rules together', async () => {
      await detector.loadRules();
      
      const result = await detector.detect('Email: john@example.com, Test: TEST-5678');
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('Email');
      expect(result.detectedTypes).toContain('Test Pattern');
      expect(result.cleanedText).toBe('Email: [REDACTED_EMAIL], Test: [REDACTED_TEST]');
      expect(result.redactedCount).toBe(2);
    });

    it('should handle empty rules gracefully', async () => {
      // Create empty rules directory
      const emptyRulesDir = path.join(__dirname, '../../empty-rules-test');
      if (fs.existsSync(emptyRulesDir)) {
        fs.rmSync(emptyRulesDir, { recursive: true });
      }
      fs.mkdirSync(emptyRulesDir, { recursive: true });
      
      const emptyRuleManager = new RuleManager(emptyRulesDir);
      const emptyDetector = new EnhancedPIIDetector({
        detectSSN: true,
        detectCreditCards: false,
        detectEmails: false,
        detectPhoneNumbers: false,
        detectIPAddresses: false,
        detectAPIKeys: false,
        customPatterns: []
      }, emptyRuleManager);
      
      await emptyDetector.loadRules();
      
      const result = await emptyDetector.detect('SSN: 123-45-6789');
      
      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('SSN');
      expect(result.cleanedText).toBe('SSN: [REDACTED_SSN]');
      
      // Clean up
      fs.rmSync(emptyRulesDir, { recursive: true });
    });
  });

  describe('Rule Manager Integration', () => {
    it('should provide access to rule manager', async () => {
      await detector.loadRules();
      
      const manager = detector.getRuleManager();
      expect(manager).toBe(ruleManager);
      
      const metadata = manager.getMetadata();
      expect(metadata.totalRules).toBeGreaterThan(0);
      expect(metadata.enabledRules).toBeGreaterThan(0);
    });
  });
});