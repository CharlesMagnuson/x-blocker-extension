const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isLogoSvgPath } = require('../src/matcher.js');

const OFFICIAL_X = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const SIMPLE_ICONS_X = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';
const FONT_AWESOME_X = 'M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z';
const OLD_TWITTER_BIRD = 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z';

test('fingerprints the official X logo path', () => {
  assert.equal(isLogoSvgPath(OFFICIAL_X), true);
});

test('fingerprints the Simple Icons and Font Awesome X paths', () => {
  assert.equal(isLogoSvgPath(SIMPLE_ICONS_X), true);
  assert.equal(isLogoSvgPath(FONT_AWESOME_X), true);
});

test('fingerprints the old Twitter bird path', () => {
  assert.equal(isLogoSvgPath(OLD_TWITTER_BIRD), true);
});

test('tolerates whitespace and case differences in the path data', () => {
  assert.equal(isLogoSvgPath('  m18.244 2.25 H3.308 ' + OFFICIAL_X.slice(18)), true);
  assert.equal(isLogoSvgPath(OFFICIAL_X.replace(/ /g, '\n')), true);
});

test('does not flag a generic close-X or arbitrary path', () => {
  assert.equal(isLogoSvgPath('M6 18L18 6M6 6l12 12'), false);
  assert.equal(isLogoSvgPath('M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'), false);
  assert.equal(isLogoSvgPath(''), false);
  assert.equal(isLogoSvgPath(null), false);
});
