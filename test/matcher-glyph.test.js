const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hasLogoGlyph, stripLogoGlyph } = require('../src/matcher.js');

test('detects the double-struck X glyph U+1D54F', () => {
  assert.equal(hasLogoGlyph('Follow us on 𝕏'), true);
  assert.equal(hasLogoGlyph('\u{1D54F}'), true);
});

test('does not flag a plain ASCII X or unrelated text', () => {
  assert.equal(hasLogoGlyph('Close X'), false);
  assert.equal(hasLogoGlyph('XBox'), false);
  assert.equal(hasLogoGlyph(''), false);
  assert.equal(hasLogoGlyph(null), false);
});

test('strips the glyph and collapses the whitespace around it', () => {
  assert.equal(stripLogoGlyph('Share on 𝕏 today'), 'Share on today');
  assert.equal(stripLogoGlyph('𝕏'), '');
  assert.equal(stripLogoGlyph('Twitter is now 𝕏.'), 'Twitter is now.');
});
