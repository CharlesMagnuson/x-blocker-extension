const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shippingFiles } = require('../scripts/package.js');

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

// Width and height from a PNG's IHDR chunk (bytes 16..24).
function pngSize(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf.toString('latin1', 1, 4), 'PNG', `${file} is not a PNG`);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

test('every file the manifest references exists', () => {
  for (const file of shippingFiles(manifest)) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `missing ${file}`);
  }
});

test('shipping file list is exactly what the extension loads', () => {
  assert.deepEqual(shippingFiles(manifest).sort(), [
    'icons/icon128.png',
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'manifest.json',
    'rules.json',
    'src/content.js',
    'src/hide.css',
    'src/matcher.js',
    'src/page.js',
  ]);
});

test('icons are declared at 16, 32, 48 and 128 and match their declared size', () => {
  for (const map of [manifest.icons, manifest.action.default_icon]) {
    assert.deepEqual(Object.keys(map).sort((a, b) => a - b), ['16', '32', '48', '128']);
    for (const [size, file] of Object.entries(map)) {
      const { w, h } = pngSize(path.join(ROOT, file));
      assert.equal(w, Number(size), `${file} width`);
      assert.equal(h, Number(size), `${file} height`);
    }
  }
});

test('version is strictly greater than the 1.0 already on the Web Store', () => {
  // Chrome compares dotted integers, missing parts count as 0, so 1.0.0 == 1.0.
  const parts = manifest.version.split('.').map(Number);
  const old = [1, 0];
  const n = Math.max(parts.length, old.length);
  let cmp = 0;
  for (let i = 0; i < n && cmp === 0; i++) cmp = (parts[i] || 0) - (old[i] || 0);
  assert.ok(cmp > 0, `version ${manifest.version} must be > 1.0`);
});

test('description fits the Web Store limit of 132 characters', () => {
  // The store rejected a 144-character description on 2026-11-04.
  assert.ok(manifest.description.length <= 132, `description is ${manifest.description.length} chars`);
});
