#!/usr/bin/env node
// Zip the files Chrome actually loads into dist/x-blocker-<version>.zip.
// The file list is derived from manifest.json so it cannot drift from what
// the extension references. Tests, docs, node_modules and Chrome's generated
// _metadata folder are never included.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

function shippingFiles(manifest) {
  const files = new Set(['manifest.json']);
  for (const file of Object.values(manifest.icons || {})) files.add(file);
  for (const file of Object.values(manifest.action?.default_icon || {})) files.add(file);
  for (const cs of manifest.content_scripts || []) {
    for (const file of cs.js || []) files.add(file);
    for (const file of cs.css || []) files.add(file);
  }
  for (const rs of manifest.declarative_net_request?.rule_resources || []) files.add(rs.path);
  if (manifest.background?.service_worker) files.add(manifest.background.service_worker);
  return [...files];
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const files = shippingFiles(manifest);
  for (const file of files) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      console.error(`manifest references missing file: ${file}`);
      process.exit(1);
    }
  }
  const dist = path.join(ROOT, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  const out = path.join(dist, `x-blocker-${manifest.version}.zip`);
  fs.rmSync(out, { force: true });
  // -X drops macOS extended attributes and resource forks from the archive.
  execFileSync('zip', ['-X', '-q', out, ...files], { cwd: ROOT, stdio: 'inherit' });
  console.log(`wrote ${path.relative(ROOT, out)} (${files.length} files)`);
}

if (require.main === module) main();
module.exports = { shippingFiles };
