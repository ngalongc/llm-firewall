const axios = require('axios');

// Example showing how to use the LLM Firewall with Anthropic
async function exampleWithPII() {
  console.log('🔍 Testing Anthropic proxy with PII detection...');
  
  try {
    // This request contains PII that should be detected and redacted
    const response = await axios.post('http://localhost:3000/proxy/anthropic/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: 'Help me with user Sarah Johnson. Her email is sarah@company.com and phone is 555-123-4567'
        }
      ]
    }, {
      headers: {
        'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function exampleWithoutPII() {
  console.log('🔍 Testing Anthropic proxy without PII...');
  
  try {
    const response = await axios.post('http://localhost:3000/proxy/anthropic/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: 'Explain quantum computing in simple terms'
        }
      ]
    }, {
      headers: {
        'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run examples
async function runExamples() {
  await exampleWithPII();
  console.log('\n' + '='.repeat(50) + '\n');
  await exampleWithoutPII();
}

runExamples();