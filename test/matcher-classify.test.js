const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyElement } = require('../src/matcher.js');
const { el } = require('./helpers.js');

const OFFICIAL_X = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

test('hides an anchor whose href points at x.com', () => {
  const a = el('<a href="https://x.com/foo">x</a>');
  assert.equal(classifyElement(a), a);
});

test('leaves an anchor to an unrelated host alone', () => {
  const a = el('<a href="https://netflix.com/browse">Netflix</a>');
  assert.equal(classifyElement(a), null);
});

test('hides images, iframes, forms and links by URL attribute', () => {
  const img = el('<img src="https://pbs.twimg.com/media/a.jpg">');
  const iframe = el('<iframe src="https://platform.twitter.com/embed/Tweet.html?id=1"></iframe>');
  const form = el('<form action="https://twitter.com/intent/tweet"></form>');
  const link = el('<link rel="me" href="https://x.com/someone">');
  assert.equal(classifyElement(img), img);
  assert.equal(classifyElement(iframe), iframe);
  assert.equal(classifyElement(form), form);
  assert.equal(classifyElement(link), link);
});

test('hides elements carrying a blocked URL in data attributes or redirect params', () => {
  const dataHref = el('<a href="#" data-href="https://x.com/intent/post?text=hi">share</a>');
  const redirect = el('<a href="https://example.com/out?u=https%3A%2F%2Fx.com%2Fme">x</a>');
  assert.equal(classifyElement(dataHref), dataHref);
  assert.equal(classifyElement(redirect), redirect);
});

test('hides elements whose class names Twitter or the X logo', () => {
  const quote = el('<blockquote class="twitter-tweet"><p>hi</p></blockquote>');
  const share = el('<a href="/share" class="btn share-twitter">Share</a>');
  const fa = el('<i class="fab fa-x-twitter"></i>');
  assert.equal(classifyElement(quote), quote);
  assert.equal(classifyElement(share), share);
  assert.equal(classifyElement(fa), fa);
});

test('hides elements labelled as Twitter/X via alt, title or aria-label', () => {
  const img = el('<img alt="Twitter" src="/img/social-sprite.png">');
  const btn = el('<button aria-label="Share on X"></button>');
  const titled = el('<a href="/s" title="Post to X">P</a>');
  assert.equal(classifyElement(img), img);
  assert.equal(classifyElement(btn), btn);
  assert.equal(classifyElement(titled), titled);
});

test('does not hide close buttons or generic utility classes', () => {
  assert.equal(classifyElement(el('<button aria-label="X" class="modal-close"></button>')), null);
  assert.equal(classifyElement(el('<button aria-label="Close">X</button>')), null);
  assert.equal(classifyElement(el('<span class="x"></span>')), null);
  assert.equal(classifyElement(el('<div class="mx-auto flex max-w-xl"></div>')), null);
  assert.equal(classifyElement(el('<div class="x-axis"></div>')), null);
  assert.equal(classifyElement(el('<a href="https://xbox.com">Xbox Series X</a>')), null);
});

test('hides an inline SVG whose path is the X logo, whether given the svg or the path', () => {
  const svg = el(`<svg viewBox="0 0 24 24"><path d="${OFFICIAL_X}"></path></svg>`);
  assert.equal(classifyElement(svg), svg);
  assert.equal(classifyElement(svg.querySelector('path')), svg);
});

test('hides an SVG whose title or <use> reference names Twitter', () => {
  const titled = el('<svg><title>Twitter</title><path d="M0 0h1"></path></svg>');
  const used = el('<svg><use href="#icon-twitter"></use></svg>');
  const xlink = el('<svg><use xlink:href="/sprite.svg#x-logo"></use></svg>');
  assert.equal(classifyElement(titled), titled);
  assert.equal(classifyElement(used), used);
  assert.equal(classifyElement(xlink), xlink);
});

test('does not hide an SVG that is just a close icon', () => {
  const svg = el('<svg><path d="M6 18L18 6M6 6l12 12"></path></svg>');
  assert.equal(classifyElement(svg), null);
});

test('hides a link or button whose text is the 𝕏 glyph', () => {
  const a = el('<a href="/follow">𝕏</a>');
  const btn = el('<button>Share on 𝕏</button>');
  assert.equal(classifyElement(a), a);
  assert.equal(classifyElement(btn), btn);
});

test('collapses an empty wrapper shell around the hidden element', () => {
  const li = el(`<li class="social-item"><a href="https://twitter.com/foo"><svg><path d="${OFFICIAL_X}"></path></svg></a></li>`);
  const a = li.querySelector('a');
  assert.equal(classifyElement(a), li);
  assert.equal(classifyElement(li.querySelector('path')), li);
});

test('does not collapse a wrapper that has other visible content', () => {
  const li = el('<li><span>Follow:</span> <a href="https://twitter.com/foo">T</a></li>');
  const a = li.querySelector('a');
  assert.equal(classifyElement(a), a);
});

test('returns null for text nodes and non-elements', () => {
  const span = el('<span>hello</span>');
  assert.equal(classifyElement(span.firstChild), null);
  assert.equal(classifyElement(null), null);
});
