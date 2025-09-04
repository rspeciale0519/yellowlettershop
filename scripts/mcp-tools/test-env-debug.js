// test-env-debug.js
const fs = require('fs');
const path = require('path');

// 1. Check if .env file exists
const envPath = path.join(__dirname, '..', '..', '.env');
const envExists = fs.existsSync(envPath);

console.log('=== Environment Debug ===');
console.log(`1. .env file exists: ${envExists ? '✅ Yes' : '❌ No'}`);

if (envExists) {
  console.log('\n2. .env file contents:');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(envContent || '(File is empty)');
  } catch (error) {
    console.error('Error reading .env file:', error.message);
  }
} else {
  console.log('\n2. No .env file found. Please create one in the project root.');
}

// 3. Show current environment variables
console.log('\n3. Current environment variables:');
const envVars = [
  'NODE_ENV',
  'BRAVE_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
  'XAI_API_KEY'
];

envVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? '✅ Set' : '❌ Not set'}`);
});

console.log('\n=== End of Debug ===');
