import * as fs from 'fs';
import * as path from 'path';
import { Rule, RuleSet, TestCase } from './index';
import { logger } from '../logging/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TestResult {
  passed: boolean;
  total: number;
  failed: TestCase[];
  errors: string[];
}

export class RuleValidator {
  private schemaPath: string;

  constructor(schemaPath?: string) {
    this.schemaPath = schemaPath || path.join(process.cwd(), 'rules', 'schema.json');
  }

  public validateRuleSet(ruleSet: RuleSet): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!ruleSet.name) {
      errors.push('Rule set must have a name');
    }

    if (!ruleSet.version) {
      errors.push('Rule set must have a version');
    } else if (!/^\d+\.\d+\.\d+$/.test(ruleSet.version)) {
      errors.push('Version must follow semantic versioning (x.y.z)');
    }

    if (!ruleSet.description) {
      errors.push('Rule set must have a description');
    }

    if (!ruleSet.rules || !Array.isArray(ruleSet.rules)) {
      errors.push('Rule set must have a rules array');
    } else if (ruleSet.rules.length === 0) {
      errors.push('Rule set must contain at least one rule');
    } else {
      // Validate each rule
      const ruleIds = new Set<string>();
      for (let i = 0; i < ruleSet.rules.length; i++) {
        const rule = ruleSet.rules[i];
        const ruleErrors = this.validateRule(rule, i);
        errors.push(...ruleErrors);

        // Check for duplicate IDs
        if (rule.id) {
          if (ruleIds.has(rule.id)) {
            errors.push(`Duplicate rule ID: ${rule.id}`);
          }
          ruleIds.add(rule.id);
        }
      }
    }

    // Warnings for optional but recommended fields
    if (!ruleSet.author) {
      warnings.push('Rule set should have an author');
    }

    if (!ruleSet.tags || ruleSet.tags.length === 0) {
      warnings.push('Rule set should have tags for better categorization');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateRule(rule: Rule, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Rule ${index + 1}`;

    // Required fields
    if (!rule.id) {
      errors.push(`${prefix}: Rule must have an ID`);
    } else if (!/^[a-zA-Z0-9_-]+$/.test(rule.id)) {
      errors.push(`${prefix}: Rule ID must contain only alphanumeric characters, underscores, and hyphens`);
    }

    if (!rule.name) {
      errors.push(`${prefix}: Rule must have a name`);
    }

    if (!rule.pattern) {
      errors.push(`${prefix}: Rule must have a pattern`);
    } else {
      try {
        new RegExp(rule.pattern, rule.flags || 'g');
      } catch (error) {
        errors.push(`${prefix}: Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!rule.replacement) {
      errors.push(`${prefix}: Rule must have a replacement`);
    }

    if (rule.confidence === undefined || rule.confidence === null) {
      errors.push(`${prefix}: Rule must have a confidence level`);
    } else if (rule.confidence < 0 || rule.confidence > 1) {
      errors.push(`${prefix}: Confidence must be between 0 and 1`);
    }

    if (!rule.category) {
      errors.push(`${prefix}: Rule must have a category`);
    } else if (!['personal', 'financial', 'medical', 'technical', 'custom'].includes(rule.category)) {
      errors.push(`${prefix}: Invalid category. Must be one of: personal, financial, medical, technical, custom`);
    }

    if (!rule.severity) {
      errors.push(`${prefix}: Rule must have a severity`);
    } else if (!['low', 'medium', 'high', 'critical'].includes(rule.severity)) {
      errors.push(`${prefix}: Invalid severity. Must be one of: low, medium, high, critical`);
    }

    // Validate flags if present
    if (rule.flags && !/^[gimuy]*$/.test(rule.flags)) {
      errors.push(`${prefix}: Invalid regex flags. Must contain only g, i, m, u, y`);
    }

    // Validate test cases if present
    if (rule.testCases) {
      if (!Array.isArray(rule.testCases)) {
        errors.push(`${prefix}: testCases must be an array`);
      } else {
        rule.testCases.forEach((testCase, testIndex) => {
          const testErrors = this.validateTestCase(testCase, rule, `${prefix} Test ${testIndex + 1}`);
          errors.push(...testErrors);
        });
      }
    }

    return errors;
  }

  private validateTestCase(testCase: TestCase, rule: Rule, prefix: string): string[] {
    const errors: string[] = [];

    if (!testCase.input) {
      errors.push(`${prefix}: Test case must have input`);
    }

    if (!testCase.expected) {
      errors.push(`${prefix}: Test case must have expected output`);
    }

    if (testCase.shouldMatch === undefined || testCase.shouldMatch === null) {
      errors.push(`${prefix}: Test case must specify shouldMatch`);
    }

    // Validate test case logic
    if (testCase.input && testCase.expected !== undefined && testCase.shouldMatch !== undefined) {
      try {
        const regex = new RegExp(rule.pattern, rule.flags || 'g');
        const matches = testCase.input.match(regex);
        const hasMatch = matches !== null;

        if (hasMatch !== testCase.shouldMatch) {
          errors.push(`${prefix}: Test case logic error - shouldMatch=${testCase.shouldMatch} but pattern ${hasMatch ? 'matches' : 'does not match'}`);
        }

        if (testCase.shouldMatch && hasMatch) {
          const result = testCase.input.replace(regex, rule.replacement);
          if (result !== testCase.expected) {
            errors.push(`${prefix}: Expected output does not match actual replacement result`);
          }
        }
      } catch (error) {
        errors.push(`${prefix}: Error testing pattern: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return errors;
  }

  public async testRuleSet(ruleSet: RuleSet): Promise<TestResult> {
    const results: TestResult = {
      passed: true,
      total: 0,
      failed: [],
      errors: []
    };

    for (const rule of ruleSet.rules) {
      if (rule.testCases) {
        for (const testCase of rule.testCases) {
          results.total++;
          try {
            const testPassed = await this.testRule(rule, testCase);
            if (!testPassed) {
              results.passed = false;
              results.failed.push(testCase);
            }
          } catch (error) {
            results.passed = false;
            results.errors.push(`Error testing rule ${rule.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    return results;
  }

  private async testRule(rule: Rule, testCase: TestCase): Promise<boolean> {
    try {
      const regex = new RegExp(rule.pattern, rule.flags || 'g');
      const matches = testCase.input.match(regex);
      const hasMatch = matches !== null;

      // Check if match expectation is correct
      if (hasMatch !== testCase.shouldMatch) {
        return false;
      }

      // If should match, check replacement
      if (testCase.shouldMatch && hasMatch) {
        const result = testCase.input.replace(regex, rule.replacement);
        return result === testCase.expected;
      }

      return true;
    } catch (error) {
      logger.error(`Error testing rule ${rule.id}:`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  public async validateRuleSetFile(filePath: string): Promise<ValidationResult> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ruleSet: RuleSet = JSON.parse(content);
      return this.validateRuleSet(ruleSet);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Error reading or parsing file: ${error instanceof Error ? error.message : String(error)}`],
        warnings: []
      };
    }
  }

  public async testRuleSetFile(filePath: string): Promise<TestResult> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const ruleSet: RuleSet = JSON.parse(content);
      return await this.testRuleSet(ruleSet);
    } catch (error) {
      return {
        passed: false,
        total: 0,
        failed: [],
        errors: [`Error reading or parsing file: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
}