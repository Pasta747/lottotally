#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const SRC = __dirname;

console.log('=== VANTAGE FEEDBACK CYCLE ===');
console.log('Step 1: Signal Attribution Analysis...');
try {
  const out1 = execSync('node ' + path.join(SRC, 'signal-attribution.js'), { encoding: 'utf8', timeout: 60000 });
  console.log(out1);
} catch (err) {
  console.error('Attribution failed:', err.message);
  process.exit(1);
}

console.log('Step 2: Feedback Loop (weight updates)...');
try {
  const out2 = execSync('node ' + path.join(SRC, 'feedback-loop.js'), { encoding: 'utf8', timeout: 30000 });
  console.log(out2);
} catch (err) {
  console.error('Feedback loop failed:', err.message);
  process.exit(1);
}

console.log('=== FEEDBACK CYCLE COMPLETE ===');
