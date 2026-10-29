const { test } = require('node:test');
const assert = require('node:assert/strict');
const { namesTwitter } = require('../src/matcher.js');

test('matches class and id tokens that name twitter', () => {
  assert.equal(namesTwitter('share-twitter'), true);
  assert.equal(namesTwitter('icon fa fa-twitter'), true);
  assert.equal(namesTwitter('twitter-tweet'), true);
  assert.equal(namesTwitter('btn-social-twitter-large'), true);
  assert.equal(namesTwitter('TwitterShareButton'), true);
});

test('matches tokens that name the X logo explicitly', () => {
  assert.equal(namesTwitter('fa-x-twitter'), true);
  assert.equal(namesTwitter('fab fa-x-twitter'), true);
  assert.equal(namesTwitter('icon-x-logo'), true);
  assert.equal(namesTwitter('social-x'), true);
  assert.equal(namesTwitter('share-x'), true);
  assert.equal(namesTwitter('x-logo'), true);
  assert.equal(namesTwitter('xLogo'), true);
  assert.equal(namesTwitter('logo-x'), true);
});

test('matches human-readable labels', () => {
  assert.equal(namesTwitter('Share on Twitter'), true);
  assert.equal(namesTwitter('Follow us on X'), true);
  assert.equal(namesTwitter('X (formerly Twitter)'), true);
  assert.equal(namesTwitter('Share on X'), true);
  assert.equal(namesTwitter('X'), true);
  assert.equal(namesTwitter('Tweet'), true);
  assert.equal(namesTwitter('Tweet this'), true);
  assert.equal(namesTwitter('Post to X'), true);
});

test('does not match ordinary words containing x', () => {
  assert.equal(namesTwitter('close-x'), false);
  assert.equal(namesTwitter('btn-close'), false);
  assert.equal(namesTwitter('flex'), false);
  assert.equal(namesTwitter('xl-container'), false);
  assert.equal(namesTwitter('max-width'), false);
  assert.equal(namesTwitter('mx-auto px-4'), false);
  assert.equal(namesTwitter('Close'), false);
  assert.equal(namesTwitter('Xbox Series X'), false);
  assert.equal(namesTwitter('SpaceX'), false);
  assert.equal(namesTwitter('Size X'), false);
  assert.equal(namesTwitter('x-axis'), false);
  assert.equal(namesTwitter(''), false);
  assert.equal(namesTwitter(null), false);
});
