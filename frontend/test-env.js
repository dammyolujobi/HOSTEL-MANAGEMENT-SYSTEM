#!/usr/bin/env node
/**
 * Test script to verify environment configuration
 */

console.log('🔧 Environment Configuration Test');
console.log('==================================');
console.log('');

console.log('📂 Environment Files:');
const fs = require('fs');

// Check which environment files exist and show their content
const envFiles = ['.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (!line.startsWith('#')) {
        console.log(`   📝 ${line}`);
      } else {
        console.log(`   💬 ${line}`);
      }
    });
  } else {
    console.log(`❌ ${file} missing`);
  }
  console.log('');
});

console.log('🚀 To test the configuration:');
console.log('   1. Run: npm run dev');
console.log('   2. Check browser console for "🔗 API Base URL" message');
console.log('   3. Should show: http://localhost:8000 (for local dev)');
console.log('');
console.log('� To switch environments:');
console.log('   📝 Edit .env.local file');
console.log('   🔄 Restart: npm run dev');
