// simple-test.js
require('dotenv').config();
console.log('Simple Environment Test:');
console.log('BRAVE_API_KEY exists:', !!process.env.BRAVE_API_KEY);
console.log('First 5 chars:', process.env.BRAVE_API_KEY?.substring(0, 5) + '...');
