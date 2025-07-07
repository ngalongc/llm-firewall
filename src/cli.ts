#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './config';
import { ProxyServer } from './proxy/server';

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

program.parse();