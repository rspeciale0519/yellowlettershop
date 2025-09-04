// verify-env.js
require('dotenv').config();

console.log('=== Environment Variables Verification ===');
console.log('\n1. Required API Keys:');

const requiredVars = {
  'BRAVE_API_KEY': 'Brave Search API',
  'ANTHROPIC_API_KEY': 'Anthropic API',
  'OPENAI_API_KEY': 'OpenAI API',
  'OPENROUTER_API_KEY': 'OpenRouter API',
  'XAI_API_KEY': 'XAI API'
};

let allValid = true;

Object.entries(requiredVars).forEach(([key, name]) => {
  const value = process.env[key];
  const isValid = value && value.length > 0 && !value.includes('your_');
  if (!isValid) allValid = false;
  
  console.log(`  ${name.padEnd(15)}: ${isValid ? '✅ Valid' : '❌ Missing or invalid'}`);
  if (isValid) {
    console.log(`     First 8 chars: ${value.substring(0, 8)}...`);
  }
});

console.log('\n2. Verification Status:');
if (allValid) {
  console.log('✅ All required environment variables are properly set!');
  console.log('   Your MCP configuration should work correctly now.');
  
  // Generate the mcp_config.json content
  console.log('\n3. Here\'s your secure mcp_config.json configuration:');
  console.log(JSON.stringify({
    mcpServers: {
      "sequential-thinking": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        env: {},
        disabled: false
      },
      "puppeteer": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        env: {},
        disabled: false
      },
      "brave-search": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-brave-search"],
        env: { BRAVE_API_KEY: "${BRAVE_API_KEY}" },
        disabled: false,
        disabledTools: ["brave_local_search"]
      },
      "taskmaster-ai": {
        command: "npx",
        args: ["-y", "--package=task-master-ai", "task-master-ai"],
        env: {
          ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}",
          OPENAI_API_KEY: "${OPENAI_API_KEY}",
          OPENROUTER_API_KEY: "${OPENROUTER_API_KEY}",
          XAI_API_KEY: "${XAI_API_KEY}"
        },
        disabled: false
      }
    }
  }, null, 2));
  
  console.log('\n✅ Copy this configuration to your mcp_config.json file.');
} else {
  console.log('❌ Some required environment variables are missing or invalid.');
  console.log('   Please update your .env file with the correct values and try again.');
}

console.log('\n=== Verification Complete ===');
