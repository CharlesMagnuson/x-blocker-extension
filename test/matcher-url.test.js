const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isBlockedUrl } = require('../src/matcher.js');

test('blocks https://x.com and its paths', () => {
  assert.equal(isBlockedUrl('https://x.com'), true);
  assert.equal(isBlockedUrl('https://x.com/elonmusk/status/1'), true);
});

test('blocks twitter.com and www/mobile subdomains', () => {
  assert.equal(isBlockedUrl('https://twitter.com/share?url=foo'), true);
  assert.equal(isBlockedUrl('http://www.twitter.com/intent/tweet'), true);
  assert.equal(isBlockedUrl('https://mobile.twitter.com/foo'), true);
});

test('blocks embed/widget hosts and short links', () => {
  assert.equal(isBlockedUrl('https://platform.twitter.com/widgets.js'), true);
  assert.equal(isBlockedUrl('https://syndication.twitter.com/i/jot'), true);
  assert.equal(isBlockedUrl('https://pbs.twimg.com/media/abc.jpg'), true);
  assert.equal(isBlockedUrl('https://t.co/abc123'), true);
  assert.equal(isBlockedUrl('https://platform.x.com/widgets.js'), true);
});

test('blocks protocol-relative and bare-host forms', () => {
  assert.equal(isBlockedUrl('//x.com/foo'), true);
  assert.equal(isBlockedUrl('x.com/foo'), true);
  assert.equal(isBlockedUrl('twitter.com'), true);
});

test('blocks x.com/twitter.com appearing as a redirect target in a query string', () => {
  assert.equal(isBlockedUrl('https://out.example.com/redirect?u=https%3A%2F%2Fx.com%2Ffoo'), true);
  assert.equal(isBlockedUrl('https://example.com/go?url=https://twitter.com/intent/tweet'), true);
});

test('does not block hosts that merely end in x.com', () => {
  assert.equal(isBlockedUrl('https://netflix.com'), false);
  assert.equal(isBlockedUrl('https://www.dropbox.com/s/abc'), false);
  assert.equal(isBlockedUrl('https://box.com'), false);
  assert.equal(isBlockedUrl('https://example.com/x.com-is-bad'), false);
});

test('does not block unrelated or empty values', () => {
  assert.equal(isBlockedUrl('https://mastodon.social/@someone'), false);
  assert.equal(isBlockedUrl('#'), false);
  assert.equal(isBlockedUrl(''), false);
  assert.equal(isBlockedUrl(null), false);
  assert.equal(isBlockedUrl('javascript:void(0)'), false);
});

test('is case-insensitive on the host', () => {
  assert.equal(isBlockedUrl('HTTPS://X.COM/Foo'), true);
  assert.equal(isBlockedUrl('https://Twitter.COM'), true);
});
