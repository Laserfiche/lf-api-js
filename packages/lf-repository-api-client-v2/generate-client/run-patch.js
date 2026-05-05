#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidates = process.platform === 'win32'
  ? ['py', 'python', 'python3']
  : ['python3', 'python'];
const script = path.join(__dirname, 'patch_optional_multipart.py');

for (const cmd of candidates) {
  const result = spawnSync(cmd, [script], { stdio: 'inherit' });
  if (result.error && result.error.code === 'ENOENT') continue;
  process.exit(result.status ?? 0);
}
console.error('No Python interpreter found (tried: ' + candidates.join(', ') + ')');
process.exit(1);
