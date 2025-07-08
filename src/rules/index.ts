import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logging/logger';

export interface Rule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  flags: string;
  replacement: string;
  confidence: number;
  category: 'personal' | 'financial' | 'medical' | 'technical' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  testCases?: TestCase[];
}

export interface TestCase {
  input: string;
  expected: string;
  shouldMatch: boolean;
}

export interface RuleSet {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags?: string[];
  rules: Rule[];
}

export interface RuleMetadata {
  totalRules: number;
  enabledRules: number;
  categories: Record<string, number>;
  severities: Record<string, number>;
  sources: string[];
}

export class RuleManager {
  private rules: Map<string, Rule> = new Map();
  private ruleSets: Map<string, RuleSet> = new Map();
  private rulesDir: string;

  constructor(rulesDir: string = path.join(process.cwd(), 'rules')) {
    this.rulesDir = rulesDir;
  }

  public async loadRules(): Promise<void> {
    try {
      await this.loadCoreRules();
      await this.loadCommunityRules();
      await this.loadVendorRules();
      logger.info(`Loaded ${this.rules.size} rules from ${this.ruleSets.size} rule sets`);
    } catch (error) {
      logger.error('Failed to load rules:', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  private async loadCoreRules(): Promise<void> {
    const coreDir = path.join(this.rulesDir, 'core');
    if (fs.existsSync(coreDir)) {
      await this.loadRulesFromDirectory(coreDir, 'core');
    }
  }

  private async loadCommunityRules(): Promise<void> {
    const communityDir = path.join(this.rulesDir, 'community');
    if (fs.existsSync(communityDir)) {
      await this.loadRulesFromDirectory(communityDir, 'community');
    }
  }

  private async loadVendorRules(): Promise<void> {
    const vendorDir = path.join(this.rulesDir, 'vendor');
    if (fs.existsSync(vendorDir)) {
      await this.loadRulesFromDirectory(vendorDir, 'vendor');
    }
  }

  private async loadRulesFromDirectory(dir: string, source: string): Promise<void> {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const ruleSet: RuleSet = JSON.parse(content);
          
          if (await this.validateRuleSet(ruleSet)) {
            this.registerRuleSet(ruleSet, source);
          } else {
            logger.warn(`Invalid rule set in ${filePath}, skipping`);
          }
        } catch (error) {
          logger.error(`Error loading rules from ${filePath}:`, error instanceof Error ? error : undefined);
        }
      }
    }
  }

  private async validateRuleSet(ruleSet: RuleSet): Promise<boolean> {
    try {
      // Basic validation
      if (!ruleSet.name || !ruleSet.version || !ruleSet.rules || !Array.isArray(ruleSet.rules)) {
        return false;
      }

      // Validate each rule
      for (const rule of ruleSet.rules) {
        if (!this.validateRule(rule)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Rule set validation error:', error instanceof Error ? error : undefined);
      return false;
    }
  }

  private validateRule(rule: Rule): boolean {
    try {
      // Check required fields
      if (!rule.id || !rule.name || !rule.pattern || !rule.replacement) {
        return false;
      }

      // Test regex pattern
      new RegExp(rule.pattern, rule.flags || 'g');

      // Validate confidence
      if (rule.confidence < 0 || rule.confidence > 1) {
        return false;
      }

      // Test with test cases if provided
      if (rule.testCases) {
        for (const testCase of rule.testCases) {
          if (!this.validateTestCase(rule, testCase)) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error(`Rule validation error for ${rule.id}:`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  private validateTestCase(rule: Rule, testCase: TestCase): boolean {
    try {
      const regex = new RegExp(rule.pattern, rule.flags || 'g');
      const matches = testCase.input.match(regex);
      const hasMatch = matches !== null;

      if (hasMatch !== testCase.shouldMatch) {
        return false;
      }

      if (testCase.shouldMatch) {
        const result = testCase.input.replace(regex, rule.replacement);
        return result === testCase.expected;
      }

      return true;
    } catch (error) {
      logger.error(`Test case validation error:`, error instanceof Error ? error : undefined);
      return false;
    }
  }

  private registerRuleSet(ruleSet: RuleSet, source: string): void {
    const ruleSetKey = `${source}:${ruleSet.name}`;
    this.ruleSets.set(ruleSetKey, ruleSet);

    for (const rule of ruleSet.rules) {
      const ruleKey = `${ruleSetKey}:${rule.id}`;
      this.rules.set(ruleKey, rule);
    }

    logger.info(`Registered rule set: ${ruleSet.name} (${ruleSet.rules.length} rules)`);
  }

  public getRules(filter?: {
    enabled?: boolean;
    category?: string;
    severity?: string;
    minConfidence?: number;
  }): Rule[] {
    let rules = Array.from(this.rules.values());

    if (filter) {
      if (filter.enabled !== undefined) {
        rules = rules.filter(rule => rule.enabled === filter.enabled);
      }
      if (filter.category) {
        rules = rules.filter(rule => rule.category === filter.category);
      }
      if (filter.severity) {
        rules = rules.filter(rule => rule.severity === filter.severity);
      }
      if (filter.minConfidence !== undefined) {
        rules = rules.filter(rule => rule.confidence >= filter.minConfidence!);
      }
    }

    return rules;
  }

  public getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  public getRuleSet(name: string): RuleSet | undefined {
    return this.ruleSets.get(name);
  }

  public getMetadata(): RuleMetadata {
    const rules = Array.from(this.rules.values());
    const categories: Record<string, number> = {};
    const severities: Record<string, number> = {};

    for (const rule of rules) {
      categories[rule.category] = (categories[rule.category] || 0) + 1;
      severities[rule.severity] = (severities[rule.severity] || 0) + 1;
    }

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      categories,
      severities,
      sources: Array.from(this.ruleSets.keys())
    };
  }

  public enableRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  public disableRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }

  public async reloadRules(): Promise<void> {
    this.rules.clear();
    this.ruleSets.clear();
    await this.loadRules();
  }
}