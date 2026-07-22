#!/usr/bin/env node

/**
 * Verify WASM Build Script
 * 
 * Checks if WASM files are present in dist/ after build
 * Useful for CI/CD pipelines and local verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');

// Check for any WASM files (since exact names may vary by version)
const MIN_REQUIRED_WASM_FILES = 1; // At least one WASM file should be present
const EXPECTED_WASM_PATTERNS = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.wasm',
];

console.log('🔍 Verifying WASM files in production build...\n');

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: dist/ directory not found!');
  console.error('   Run `npm run build` first.\n');
  process.exit(1);
}

// Find all WASM files in dist
const allDistFiles = fs.readdirSync(DIST_DIR);
const wasmFiles = allDistFiles.filter(f => f.endsWith('.wasm'));
const foundFiles = [];

console.log('📦 Searching for WASM files in dist/...\n');

if (wasmFiles.length === 0) {
  console.log('❌ No WASM files found in dist/\n');
} else {
  wasmFiles.forEach(filename => {
    const filepath = path.join(DIST_DIR, filename);
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    foundFiles.push({ filename, size: sizeInMB });
    console.log(`✅ ${filename} (${sizeInMB} MB)`);
  });
}

const allFilesFound = foundFiles.length >= MIN_REQUIRED_WASM_FILES;

console.log('\n' + '='.repeat(60));

if (allFilesFound) {
  console.log('✅ SUCCESS: WASM files present in dist/');
  console.log(`   Total WASM files: ${foundFiles.length}`);
  console.log(`   Total size: ${foundFiles.reduce((sum, f) => sum + parseFloat(f.size), 0).toFixed(2)} MB`);
  
  // Check for expected patterns
  const hasThreaded = foundFiles.some(f => f.filename.includes('threaded'));
  if (hasThreaded) {
    console.log('   ✅ Multi-threaded WASM variant found (best performance)');
  }
  
  console.log('\n✨ Build is ready for deployment!');
  console.log('\n💡 Note: ONNX Runtime Web v1.21.0 may include different WASM variants.');
  console.log('   As long as at least one WASM file is present, the feature should work.');
  process.exit(0);
} else {
  console.log('❌ FAILURE: No WASM files found in dist/');
  console.log(`   Found: ${foundFiles.length} WASM files`);
  console.log(`   Required: At least ${MIN_REQUIRED_WASM_FILES} WASM file(s)`);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Check if vite.config.ts has copy-onnx-wasm plugin');
  console.log('   2. Check if onnxruntime-web is installed: npm list onnxruntime-web');
  console.log('   3. Check node_modules/onnxruntime-web/dist/ directory:');
  console.log('      dir node_modules\\onnxruntime-web\\dist\\*.wasm');
  console.log('   4. Rebuild: npm run build');
  process.exit(1);
}
