#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './config';
import { ProxyServer } from './proxy/server';
import { RuleManager } from './rules';
import { RuleValidator } from './rules/validator';

const program = new Command();

program
  .name('llm-firewall')
  .description('A security proxy for LLM APIs with PII detection')
  .version('1.0.0');

program
  .command('start')
  .description('Start the LLM firewall proxy server')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      // Ensure logs directory exists
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Load configuration
      const configManager = new ConfigManager(options.config);
      const config = configManager.getConfig();
      
      // Override port if specified
      if (options.port) {
        config.port = parseInt(options.port, 10);
      }

      // Start server
      const server = new ProxyServer(config);
      server.start();

      console.log(`🛡️  LLM Firewall started on port ${config.port}`);
      console.log(`📊 Dashboard: http://localhost:${config.port}/status`);
      console.log(`🔒 OpenAI Proxy: ${config.providers.openai.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`🔒 Anthropic Proxy: ${config.providers.anthropic.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      
    } catch (error) {
      console.error('❌ Failed to start LLM Firewall:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new config file')
  .option('-o, --output <path>', 'Output path for config file', './llm-firewall-config.json')
  .action(async (options) => {
    try {
      const defaultConfigPath = path.join(__dirname, '../config/default.json');
      const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf-8');
      
      fs.writeFileSync(options.output, defaultConfig);
      console.log(`✅ Config file created at ${options.output}`);
      console.log('Edit the config file to customize PII detection settings.');
    } catch (error) {
      console.error('❌ Failed to create config file:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test PII detection with sample text')
  .option('-t, --text <text>', 'Text to test for PII')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      const { PIIDetector } = await import('./pii/detector');
      
      const configManager = new ConfigManager(options.config);
      const config = configManager.getConfig();
      const detector = new PIIDetector(config.pii);
      
      const testText = options.text || 'My email is john@example.com and my SSN is 123-45-6789';
      const result = detector.detect(testText);
      
      console.log('🔍 PII Detection Test Results:');
      console.log('Original text:', testText);
      console.log('Has PII:', result.hasPII ? '✅ Yes' : '❌ No');
      console.log('Detected types:', result.detectedTypes.join(', '));
      console.log('Redacted count:', result.redactedCount);
      console.log('Cleaned text:', result.cleanedText);
      
    } catch (error) {
      console.error('❌ Failed to test PII detection:', error);
      process.exit(1);
    }
  });

program
  .command('rules')
  .description('Manage PII detection rules')
  .addCommand(
    new Command('list')
      .description('List all available rules')
      .option('-c, --config <path>', 'Path to config file')
      .option('--category <category>', 'Filter by category')
      .option('--enabled', 'Show only enabled rules')
      .action(async (options) => {
        try {
          const configManager = new ConfigManager(options.config);
          const config = configManager.getConfig();
          const ruleManager = new RuleManager(config.rules.rulesDir);
          
          await ruleManager.loadRules();
          
          const filter: any = {};
          if (options.category) filter.category = options.category;
          if (options.enabled) filter.enabled = true;
          
          const rules = ruleManager.getRules(filter);
          const metadata = ruleManager.getMetadata();
          
          console.log('🔍 LLM Firewall Rules:');
          console.log(`Total rules: ${metadata.totalRules}`);
          console.log(`Enabled rules: ${metadata.enabledRules}`);
          console.log('Categories:', Object.entries(metadata.categories).map(([k, v]) => `${k}: ${v}`).join(', '));
          console.log('\nRules:');
          
          rules.forEach(rule => {
            const status = rule.enabled ? '✅' : '❌';
            const confidence = Math.round(rule.confidence * 100);
            console.log(`${status} [${rule.category}] ${rule.name} (${confidence}% confidence, ${rule.severity} severity)`);
            console.log(`   ID: ${rule.id}`);
            console.log(`   Description: ${rule.description}`);
            console.log('');
          });
          
        } catch (error) {
          console.error('❌ Failed to list rules:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate rule files')
      .argument('<file>', 'Path to rule file to validate')
      .action(async (file) => {
        try {
          const validator = new RuleValidator();
          const result = await validator.validateRuleSetFile(file);
          
          console.log(`🔍 Validating rule file: ${file}`);
          
          if (result.isValid) {
            console.log('✅ Rule file is valid!');
          } else {
            console.log('❌ Rule file is invalid:');
            result.errors.forEach(error => console.log(`  - ${error}`));
          }
          
          if (result.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            result.warnings.forEach(warning => console.log(`  - ${warning}`));
          }
          
          if (!result.isValid) {
            process.exit(1);
          }
          
        } catch (error) {
          console.error('❌ Failed to validate rules:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('test-rules')
      .description('Test rule files with their test cases')
      .argument('<file>', 'Path to rule file to test')
      .action(async (file) => {
        try {
          const validator = new RuleValidator();
          const result = await validator.testRuleSetFile(file);
          
          console.log(`🧪 Testing rule file: ${file}`);
          
          if (result.passed) {
            console.log(`✅ All tests passed! (${result.total} tests)`);
          } else {
            console.log(`❌ Tests failed: ${result.failed.length}/${result.total}`);
            
            if (result.errors.length > 0) {
              console.log('\nErrors:');
              result.errors.forEach(error => console.log(`  - ${error}`));
            }
            
            if (result.failed.length > 0) {
              console.log('\nFailed test cases:');
              result.failed.forEach(testCase => {
                console.log(`  - Input: "${testCase.input}"`);
                console.log(`    Expected: "${testCase.expected}"`);
                console.log(`    Should match: ${testCase.shouldMatch}`);
              });
            }
          }
          
          if (!result.passed) {
            process.exit(1);
          }
          
        } catch (error) {
          console.error('❌ Failed to test rules:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('enable')
      .description('Enable a specific rule')
      .argument('<rule-id>', 'Rule ID to enable')
      .option('-c, --config <path>', 'Path to config file')
      .action(async (ruleId, options) => {
        try {
          const configManager = new ConfigManager(options.config);
          const config = configManager.getConfig();
          const ruleManager = new RuleManager(config.rules.rulesDir);
          
          await ruleManager.loadRules();
          
          if (ruleManager.enableRule(ruleId)) {
            console.log(`✅ Enabled rule: ${ruleId}`);
          } else {
            console.log(`❌ Rule not found: ${ruleId}`);
            process.exit(1);
          }
          
        } catch (error) {
          console.error('❌ Failed to enable rule:', error);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('disable')
      .description('Disable a specific rule')
      .argument('<rule-id>', 'Rule ID to disable')
      .option('-c, --config <path>', 'Path to config file')
      .action(async (ruleId, options) => {
        try {
          const configManager = new ConfigManager(options.config);
          const config = configManager.getConfig();
          const ruleManager = new RuleManager(config.rules.rulesDir);
          
          await ruleManager.loadRules();
          
          if (ruleManager.disableRule(ruleId)) {
            console.log(`✅ Disabled rule: ${ruleId}`);
          } else {
            console.log(`❌ Rule not found: ${ruleId}`);
            process.exit(1);
          }
          
        } catch (error) {
          console.error('❌ Failed to disable rule:', error);
          process.exit(1);
        }
      })
  );

program
  .command('test-enhanced')
  .description('Test enhanced PII detection with community rules')
  .option('-t, --text <text>', 'Text to test for PII')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    try {
      const { EnhancedPIIDetector } = await import('./pii/enhanced-detector');
      
      const configManager = new ConfigManager(options.config);
      const config = configManager.getConfig();
      const detector = new EnhancedPIIDetector(config.pii);
      
      await detector.loadRules();
      
      const testText = options.text || 'My email is john@example.com, SSN is 123-45-6789, and API key is sk-1234567890abcdef1234567890abcdef';
      const result = await detector.detect(testText);
      
      console.log('🔍 Enhanced PII Detection Test Results:');
      console.log('Original text:', testText);
      console.log('Has PII:', result.hasPII ? '✅ Yes' : '❌ No');
      console.log('Detected types:', result.detectedTypes.join(', '));
      console.log('Redacted count:', result.redactedCount);
      console.log('Cleaned text:', result.cleanedText);
      
      const metadata = detector.getRuleManager().getMetadata();
      console.log('\n📊 Rule Statistics:');
      console.log(`Total rules loaded: ${metadata.totalRules}`);
      console.log(`Enabled rules: ${metadata.enabledRules}`);
      console.log('Categories:', Object.entries(metadata.categories).map(([k, v]) => `${k}: ${v}`).join(', '));
      
    } catch (error) {
      console.error('❌ Failed to test enhanced PII detection:', error);
      process.exit(1);
    }
  });

program.parse();