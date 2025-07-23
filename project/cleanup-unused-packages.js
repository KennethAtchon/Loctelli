#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Packages that are definitely unused after removing website-builder service
const UNUSED_PACKAGES = [
  // AWS SDK packages - only used by website builder
  '@aws-sdk/client-s3',
  '@aws-sdk/lib-storage', 
  '@aws-sdk/s3-request-presigner',
  
  // File processing packages - only used by website builder
  'fs-extra',
  '@types/fs-extra',
  'jszip',
  '@types/jszip',
  
  // Multer types - not used in current codebase
  '@types/multer',
  
  // UUID - not used in current codebase
  'uuid',
  '@types/uuid',
  
  // Redis packages - not used in current codebase
  'ioredis',
  'redis',
  'cache-manager-redis-store',
  'cache-manager-redis-yet',
  
  // Authentication packages - not used in current codebase
  'passport',
  'passport-local',
  '@types/passport-local',
  'jsonwebtoken',
  '@types/jsonwebtoken',
  
  // Other unused packages
  'class-transformer',
  'reflect-metadata',
  'rxjs',
  
  // Dev dependencies that are unused
  '@eslint/eslintrc',
  '@swc/cli',
  '@swc/core',
  '@types/jest',
  'eslint',
  'eslint-config-prettier',
  'jest',
  'prettier',
  'source-map-support',
  'ts-loader',
  'ts-node',
  'tsconfig-paths',
  'typescript'
];

// Packages that might be used but need verification
const POTENTIALLY_UNUSED = [
  '@nestjs/axios',
  '@nestjs/terminus',
  '@nestjs/platform-express',
  '@nestjs/cli',
  '@nestjs/schematics'
];

console.log('🔍 Analyzing package usage...\n');

// Read current package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📦 Current dependencies count:');
console.log(`   Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
console.log(`   DevDependencies: ${Object.keys(packageJson.devDependencies || {}).length}\n`);

// Check which packages are actually installed
const installedPackages = new Set();
try {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const packages = fs.readdirSync(nodeModulesPath);
    packages.forEach(pkg => {
      if (!pkg.startsWith('.')) {
        installedPackages.add(pkg);
      }
    });
  }
} catch (error) {
  console.log('⚠️  Could not read node_modules directory');
}

console.log('🎯 Packages to remove:');
UNUSED_PACKAGES.forEach(pkg => {
  const isInstalled = installedPackages.has(pkg) || installedPackages.has(pkg.replace('@types/', ''));
  console.log(`   ${pkg} ${isInstalled ? '✅' : '❌ (not installed)'}`);
});

console.log('\n⚠️  Packages that need verification:');
POTENTIALLY_UNUSED.forEach(pkg => {
  const isInstalled = installedPackages.has(pkg);
  console.log(`   ${pkg} ${isInstalled ? '✅' : '❌ (not installed)'}`);
});

console.log('\n🚀 Starting package removal...\n');

// Remove unused packages
const packagesToRemove = UNUSED_PACKAGES.filter(pkg => {
  return packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
});

if (packagesToRemove.length > 0) {
  console.log(`Removing ${packagesToRemove.length} packages...`);
  
  try {
    // Remove packages
    const command = `npm uninstall ${packagesToRemove.join(' ')}`;
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    
    console.log('\n✅ Package removal completed successfully!');
  } catch (error) {
    console.error('\n❌ Error removing packages:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ No unused packages found to remove!');
}

console.log('\n📊 Summary:');
console.log(`   Packages removed: ${packagesToRemove.length}`);
console.log(`   Remaining dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
console.log(`   Remaining devDependencies: ${Object.keys(packageJson.devDependencies || {}).length}`);

console.log('\n💡 Next steps:');
console.log('   1. Run "npm install" to ensure clean state');
console.log('   2. Run "npm run build" to verify everything still works');
console.log('   3. Run "npm test" to ensure tests still pass');
console.log('   4. Consider running "depcheck" again to verify cleanup');

console.log('\n⚠️  Note: Some packages marked as "potentially unused" may still be needed.');
console.log('   Please verify manually before removing them.'); 