const axios = require('axios');

// Example showing how to use the LLM Firewall with OpenAI
async function exampleWithPII() {
  console.log('🔍 Testing OpenAI proxy with PII detection...');
  
  try {
    // This request contains PII that should be detected and redacted
    const response = await axios.post('http://localhost:3000/proxy/openai/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Help me with user John Smith. His email is john@example.com and SSN is 123-45-6789'
        }
      ]
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function exampleWithoutPII() {
  console.log('🔍 Testing OpenAI proxy without PII...');
  
  try {
    const response = await axios.post('http://localhost:3000/proxy/openai/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'What is the capital of France?'
        }
      ]
    }, {
      headers: {
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
        'Content-Type': 'application/json'
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