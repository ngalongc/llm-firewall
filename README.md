# LLM Firewall 🛡️

A security proxy for LLM APIs with real-time PII detection and redaction. Protect your organization from accidentally sending sensitive data to language models.

## ✨ Features

- **🔒 Real-time PII Detection**: Automatically detects and redacts sensitive information
- **🚀 Easy Integration**: Simply change your API endpoint URL
- **📊 Comprehensive Logging**: Track PII incidents and API usage
- **🐳 Self-Hosting Ready**: Deploy with Docker or npm
- **⚡ High Performance**: Minimal latency overhead
- **🔧 Configurable**: Customize detection rules and behavior

## 🛡️ Supported PII Types

- Social Security Numbers (SSN)
- Credit Card Numbers
- Email Addresses
- Phone Numbers
- IP Addresses
- API Keys
- Custom Patterns (configurable)

## 🚀 Quick Start

### Installation

```bash
npm install -g llm-firewall
```

### Start the Proxy

```bash
llm-firewall start
```

Your proxy is now running on `http://localhost:3000`

### Usage

Simply replace your LLM API endpoint:

```javascript
// Before (direct to OpenAI)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});

// After (through LLM Firewall)
const response = await fetch('http://localhost:3000/proxy/openai/v1/chat/completions', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
```

## 📖 Examples

### OpenAI Example

```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:3000/proxy/openai/v1/chat/completions', {
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'user',
      content: 'Help me with user info: email john@example.com, SSN 123-45-6789'
    }
  ]
}, {
  headers: {
    'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
    'Content-Type': 'application/json'
  }
});
```

The request sent to OpenAI will be:
```
Help me with user info: email [REDACTED_EMAIL], SSN [REDACTED_SSN]
```

### Anthropic Example

```javascript
const response = await axios.post('http://localhost:3000/proxy/anthropic/v1/messages', {
  model: 'claude-3-haiku-20240307',
  max_tokens: 1000,
  messages: [
    {
      role: 'user',
      content: 'Process this customer data: phone 555-123-4567'
    }
  ]
}, {
  headers: {
    'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  }
});
```

## ⚙️ Configuration

### Initialize Config File

```bash
llm-firewall init
```

### Custom Configuration

Create a `config.json` file:

```json
{
  "port": 3000,
  "pii": {
    "detectSSN": true,
    "detectCreditCards": true,
    "detectEmails": true,
    "detectPhoneNumbers": true,
    "detectIPAddresses": true,
    "detectAPIKeys": true,
    "customPatterns": [
      {
        "name": "Employee ID",
        "pattern": "EMP-\\d{6}",
        "replacement": "[REDACTED_EMPLOYEE_ID]"
      }
    ]
  },
  "logging": {
    "level": "info",
    "logPII": false,
    "logRequests": true
  }
}
```

### Environment Variables

```bash
export LLM_FIREWALL_PORT=3000
export LLM_FIREWALL_LOG_LEVEL=info
export LLM_FIREWALL_DETECT_SSN=true
export LLM_FIREWALL_DETECT_EMAILS=true
```

## 🐳 Docker Deployment

### Using Docker Compose

```yaml
version: '3.8'

services:
  llm-firewall:
    image: llm-firewall:latest
    ports:
      - "3000:3000"
    environment:
      - LLM_FIREWALL_PORT=3000
      - LLM_FIREWALL_LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    restart: unless-stopped
```

```bash
docker-compose up -d
```

### Using Docker

```bash
# Build
docker build -t llm-firewall .

# Run
docker run -p 3000:3000 -d llm-firewall
```

## 🔧 CLI Commands

### Start Server

```bash
llm-firewall start [options]

Options:
  -p, --port <port>     Port to run the server on (default: 3000)
  -c, --config <path>   Path to config file
```
### Local Dev to start the server

```bash
 node dist/cli.js start
```

### Initialize Config

```bash
llm-firewall init [options]

Options:
  -o, --output <path>   Output path for config file
```

### Test PII Detection

```bash
llm-firewall test [options]

Options:
  -t, --text <text>     Text to test for PII
  -c, --config <path>   Path to config file
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Status Dashboard

```bash
curl http://localhost:3000/status
```

## 🔒 Security Features

- **No Data Persistence**: PII is redacted in memory, not stored
- **Configurable Logging**: Choose what to log (PII incidents vs. content)
- **Rate Limiting**: Built-in protection against abuse
- **HTTPS Support**: TLS termination ready
- **Audit Trails**: Comprehensive logging for compliance

## 📈 Performance

- **Low Latency**: ~10ms overhead for PII detection
- **High Throughput**: Supports concurrent requests
- **Memory Efficient**: Minimal memory footprint
- **Scalable**: Stateless design for horizontal scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🚀 Roadmap

- [ ] Advanced NLP-based PII detection
- [ ] Web dashboard for monitoring
- [ ] Custom redaction rules
- [ ] Integration with identity providers
- [ ] Compliance reporting (GDPR, HIPAA)
- [ ] Multi-tenant support
