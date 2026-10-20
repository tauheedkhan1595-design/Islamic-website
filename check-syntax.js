import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['backend', 'frontend', 'admin', 'tests', 'scripts'];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) files.push(full);
  }
}
for (const dir of roots) walk(path.join(root, dir));
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    process.stderr.write(`FAIL ${path.relative(root, file)}\n${result.stderr || result.stdout}`);
  }
}
if (failed) {
  process.stderr.write(`\n${failed}/${files.length} JavaScript files failed syntax validation.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS: syntax checked ${files.length} JavaScript files.\n`);
}
