import * as dotenv from 'dotenv';
import { ConfigManager } from './config';
import { ProxyServer } from './proxy/server';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize configuration
const configManager = new ConfigManager();
const config = configManager.getConfig();

// Start the proxy server
const server = new ProxyServer(config);
server.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

export { ConfigManager, ProxyServer };