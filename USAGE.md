# LLM Firewall - Usage Guide

## Quick Start

1. **Install globally:**
   ```bash
   npm install -g llm-firewall
   ```

2. **Start the proxy:**
   ```bash
   llm-firewall start
   ```

3. **Update your code:**
   ```javascript
   // Change from:
   'https://api.openai.com/v1/chat/completions'
   
   // To:
   'http://localhost:3000/proxy/openai/v1/chat/completions'
   ```

## Demo

Test PII detection:
```bash
llm-firewall test --text "My email is john@example.com and SSN is 123-45-6789"
```

Output:
```
🔍 PII Detection Test Results:
Original text: My email is john@example.com and SSN is 123-45-6789
Has PII: ✅ Yes
Detected types: Email, SSN
Redacted count: 2
Cleaned text: My email is [REDACTED_EMAIL] and SSN is [REDACTED_SSN]
```

## Configuration

Initialize config file:
```bash
llm-firewall init --output my-config.json
```

Start with custom config:
```bash
llm-firewall start --config my-config.json
```

## Supported Endpoints

### OpenAI
- All endpoints under `/v1/`: `http://localhost:3000/proxy/openai/v1/*`
- Example: `http://localhost:3000/proxy/openai/v1/chat/completions`

### Anthropic
- All endpoints under `/v1/`: `http://localhost:3000/proxy/anthropic/v1/*`
- Example: `http://localhost:3000/proxy/anthropic/v1/messages`

## PII Types Detected

- ✅ Social Security Numbers (SSN)
- ✅ Credit Card Numbers
- ✅ Email Addresses
- ✅ Phone Numbers
- ✅ IP Addresses
- ✅ API Keys
- ✅ Custom Patterns (configurable)

## Integration Examples

### Node.js with Axios
```javascript
const axios = require('axios');

// OpenAI example
const openaiResponse = await axios.post('http://localhost:3000/proxy/openai/v1/chat/completions', {
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello world' }]
}, {
  headers: { 'Authorization': 'Bearer YOUR_OPENAI_KEY' }
});

// Anthropic example
const anthropicResponse = await axios.post('http://localhost:3000/proxy/anthropic/v1/messages', {
  model: 'claude-3-haiku-20240307',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'Hello world' }]
}, {
  headers: { 
    'x-api-key': 'YOUR_ANTHROPIC_KEY',
    'anthropic-version': '2023-06-01'
  }
});
```

### Python with Requests
```python
import requests

# OpenAI example
response = requests.post('http://localhost:3000/proxy/openai/v1/chat/completions', 
  json={
    'model': 'gpt-3.5-turbo',
    'messages': [{'role': 'user', 'content': 'Hello world'}]
  },
  headers={'Authorization': 'Bearer YOUR_OPENAI_KEY'}
)

# Anthropic example
response = requests.post('http://localhost:3000/proxy/anthropic/v1/messages',
  json={
    'model': 'claude-3-haiku-20240307',
    'max_tokens': 1000,
    'messages': [{'role': 'user', 'content': 'Hello world'}]
  },
  headers={
    'x-api-key': 'YOUR_ANTHROPIC_KEY',
    'anthropic-version': '2023-06-01'
  }
)
```

## Monitoring

Check server health:
```bash
curl http://localhost:3000/health
```

View configuration:
```bash
curl http://localhost:3000/status
```

## Docker Deployment

```bash
# Build and run
docker build -t llm-firewall .
docker run -p 3000:3000 llm-firewall

# Or use docker-compose
docker-compose up -d
```

## Environment Variables

```bash
export LLM_FIREWALL_PORT=3000
export LLM_FIREWALL_LOG_LEVEL=info
export LLM_FIREWALL_DETECT_SSN=true
export LLM_FIREWALL_DETECT_EMAILS=true
```

## Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test -- --coverage
```

## Security Benefits

- **Real-time PII Detection**: Prevents sensitive data from reaching LLM providers
- **Audit Trail**: Logs all PII incidents for compliance
- **Configurable**: Customize detection rules for your needs
- **No Data Storage**: PII is redacted in memory, not persisted
- **Rate Limiting**: Built-in protection against abuse

## Next Steps

1. **Set up monitoring**: Configure log aggregation for production
2. **Customize patterns**: Add custom PII detection rules
3. **Scale horizontally**: Deploy multiple instances with load balancing
4. **Add authentication**: Implement API key validation for enterprise use