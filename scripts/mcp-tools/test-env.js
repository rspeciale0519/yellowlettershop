// test-env.js
require('dotenv').config({ path: '.env' });

console.log('Environment Variables Test:');
console.log('--------------------------');
console.log('BRAVE_API_KEY:', process.env.BRAVE_API_KEY ? '✅ Found' : '❌ Missing');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Found' : '❌ Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Found' : '❌ Missing');
console.log('XAI_API_KEY:', process.env.XAI_API_KEY ? '✅ Found' : '❌ Missing');
console.log('--------------------------');
