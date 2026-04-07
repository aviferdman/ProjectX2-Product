/**
 * Build CJS output from TypeScript source.
 *
 * Runs tsc with the CJS tsconfig and writes a package.json marker
 * to ensure Node.js treats the output as CommonJS. Type errors are
 * intentionally tolerated because the ESM build handles strict type
 * checking — the CJS build is only for JavaScript output.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const cjsConfigPath = path.join(cwd, 'tsconfig.cjs.json');

if (!fs.existsSync(cjsConfigPath)) {
  console.error('tsconfig.cjs.json not found in', cwd);
  process.exit(1);
}

// Run tsc for CJS output — emit files even if there are type-only errors
try {
  execSync('npx tsc -p tsconfig.cjs.json', { stdio: 'inherit', cwd });
} catch {
  // tsc exits non-zero on type errors but still emits files
  // (noEmitOnError defaults to false). This is expected because
  // moduleResolution "Node" has slightly different type behavior
  // than "Node16". The ESM build validates types strictly.
}

// Write CJS package.json marker
const cjsDir = path.join(cwd, 'dist', 'cjs');
if (fs.existsSync(cjsDir)) {
  fs.writeFileSync(
    path.join(cjsDir, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2) + '\n'
  );
  console.log('CJS build complete: dist/cjs/');
} else {
  console.error('CJS output directory not found — build may have failed');
  process.exit(1);
}
