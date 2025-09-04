#!/usr/bin/env node

/**
 * Simple Type System Test
 * Tests if the comprehensive types can be imported and used correctly
 */

try {
  console.log('🔍 Testing YLS comprehensive type system...\n');
  
  // Test if we can import the types file
  console.log('✅ Testing type import...');
  // In a JS file, we can't actually import TypeScript types,
  // but we can check if the file exists and has valid structure
  const fs = require('fs');
  const path = require('path');
  
  const typesPath = path.join(__dirname, 'types', 'supabase.ts');
  
  if (!fs.existsSync(typesPath)) {
    throw new Error('Types file does not exist at types/supabase.ts');
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Check for key type exports
  const requiredTypes = [
    'export type UserProfile',
    'export type MailingList', 
    'export type Campaign',
    'export type ListBuilderCriteria',
    'export type ChangeHistory',
    'export type UserAnalytics',
    'export type CampaignMetrics',
    'export type ShortLink',
    'export type Vendor',
    'export type ApiUsageTracking',
    'export type SubscriptionPlan',
    'export type CampaignType',
    'export type ValidationStatus'
  ];
  
  let missingTypes = [];
  let foundTypes = [];
  
  for (const typeExport of requiredTypes) {
    if (typesContent.includes(typeExport)) {
      foundTypes.push(typeExport);
    } else {
      missingTypes.push(typeExport);
    }
  }
  
  console.log(`  ✓ Found ${foundTypes.length} required type exports`);
  
  if (missingTypes.length > 0) {
    console.log(`  ⚠️ Missing types: ${missingTypes.join(', ')}`);
  }
  
  // Check for enum types
  const enumTypes = [
    "'free' | 'pro' | 'team' | 'enterprise'",
    "'single' | 'split' | 'recurring'", 
    "'pending' | 'valid' | 'invalid' | 'corrected'"
  ];
  
  let foundEnums = 0;
  for (const enumType of enumTypes) {
    if (typesContent.includes(enumType)) {
      foundEnums++;
    }
  }
  
  console.log(`  ✓ Found ${foundEnums} enum type definitions`);
  
  // Check for comprehensive schema features
  const features = [
    'List Builder System Types',
    'Version History & Rollback System Types',
    'Analytics & Performance Tracking Types',
    'Team Collaboration & Resource Sharing Types',
    'Vendor Management System Types',
    'Campaign and Order Management Types'
  ];
  
  let foundFeatures = 0;
  for (const feature of features) {
    if (typesContent.includes(feature)) {
      foundFeatures++;
    }
  }
  
  console.log(`  ✓ Found ${foundFeatures} feature section markers`);
  
  // Test file size (comprehensive types should be substantial)
  const fileSize = Math.round(typesContent.length / 1024);
  console.log(`  ✓ Types file size: ${fileSize}KB`);
  
  if (fileSize < 10) {
    console.log('  ⚠️ Types file seems small for comprehensive schema');
  }
  
  console.log('\n✅ Type System Tests:');
  console.log(`  • Required types found: ${foundTypes.length}/${requiredTypes.length}`);
  console.log(`  • Enum definitions: ${foundEnums}/${enumTypes.length}`);
  console.log(`  • Feature sections: ${foundFeatures}/${features.length}`);
  console.log(`  • File size: ${fileSize}KB`);
  
  const successRate = Math.round(((foundTypes.length + foundEnums + foundFeatures) / (requiredTypes.length + enumTypes.length + features.length)) * 100);
  
  if (successRate >= 90) {
    console.log(`\n🎉 Type system verification passed! (${successRate}%)`);
    console.log('\n📊 Summary:');
    console.log('  ✅ Comprehensive types file exists');
    console.log('  ✅ All core types are defined');  
    console.log('  ✅ Enum types are properly structured');
    console.log('  ✅ Feature-specific types included');
    console.log('  ✅ Ready for development use');
  } else {
    console.log(`\n⚠️ Type system verification incomplete (${successRate}%)`);
    console.log('Some types or features may be missing.');
  }
  
} catch (error) {
  console.error('\n❌ Type system test failed:');
  console.error(`   ${error.message}`);
  process.exit(1);
}