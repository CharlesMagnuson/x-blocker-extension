const { test } = require('node:test');
const assert = require('node:assert/strict');
const { page, tick, isHidden, loaded } = require('./helpers.js');

const OFFICIAL_X = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

test('hides matching elements already in the document on load', () => {
  const w = page(`
    <a id="x" href="https://x.com/foo">x</a>
    <a id="ok" href="https://mastodon.social/@me">m</a>
    <img id="img" src="https://pbs.twimg.com/a.jpg">
    <blockquote id="q" class="twitter-tweet"><p>hi</p></blockquote>
  `);
  const d = w.document;
  assert.equal(isHidden(d.getElementById('x')), true);
  assert.equal(isHidden(d.getElementById('img')), true);
  assert.equal(isHidden(d.getElementById('q')), true);
  assert.equal(isHidden(d.getElementById('ok')), false);
});

test('hides elements inserted after load', async () => {
  const w = page('<div id="root"></div>');
  const d = w.document;
  d.getElementById('root').innerHTML = `<div class="share-bar"><a id="late" href="https://twitter.com/intent/tweet?text=hi">Tweet</a><a id="fine" href="https://example.com">E</a></div>`;
  await tick();
  assert.equal(isHidden(d.getElementById('late')), true);
  assert.equal(isHidden(d.getElementById('fine')), false);
});

test('hides an element when its href later changes to a blocked URL', async () => {
  const w = page('<a id="a" href="/placeholder">share</a>');
  const a = w.document.getElementById('a');
  assert.equal(isHidden(a), false);
  a.setAttribute('href', 'https://x.com/intent/post');
  await tick();
  assert.equal(isHidden(a), true);
});

test('hides an inline SVG X logo inserted later, collapsing its empty wrapper', async () => {
  const w = page('<ul id="social"></ul>');
  const d = w.document;
  d.getElementById('social').innerHTML = `<li id="li"><a href="/x"><svg viewBox="0 0 24 24"><path d="${OFFICIAL_X}"/></svg></a></li><li id="mast"><a href="https://mastodon.social">M</a></li>`;
  await tick();
  assert.equal(isHidden(d.getElementById('li')), true);
  assert.equal(isHidden(d.getElementById('mast')), false);
});

test('strips the 𝕏 glyph from running prose without hiding the paragraph', async () => {
  const w = page('<p id="p">The platform formerly known as Twitter is now 𝕏, and that is sad.</p>');
  const p = w.document.getElementById('p');
  await tick();
  assert.equal(isHidden(p), false);
  assert.equal(p.textContent.includes('\u{1D54F}'), false);
  assert.equal(p.textContent, 'The platform formerly known as Twitter is now, and that is sad.');
});

test('hides an element whose only content is the 𝕏 glyph', async () => {
  const w = page('<span id="logo">𝕏</span> <a id="link" href="/follow">𝕏</a>');
  const d = w.document;
  await tick();
  assert.equal(isHidden(d.getElementById('logo')), true);
  assert.equal(isHidden(d.getElementById('link')), true);
});

test('handles a glyph that arrives via a later text mutation', async () => {
  const w = page('<span id="s">Follow us</span>');
  const s = w.document.getElementById('s');
  s.firstChild.nodeValue = 'Follow us on 𝕏';
  await tick();
  assert.equal(s.textContent, 'Follow us on');
  assert.equal(isHidden(s), false);
});

test('hides matching elements inside an open shadow root attached after load', async () => {
  const w = page('<div id="host"></div>');
  const d = w.document;
  await loaded(w);
  await tick();
  const host = d.getElementById('host');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<a id="sx" href="https://x.com/foo">x</a><a id="sok" href="https://example.com">ok</a>';
  await tick();
  assert.equal(isHidden(root.getElementById('sx')), true);
  assert.equal(isHidden(root.getElementById('sok')), false);
});

test('exposes a hidden-count for diagnostics', async () => {
  const w = page('<a href="https://x.com/a">1</a><a href="https://twitter.com/b">2</a><a href="https://example.com">3</a>');
  await tick();
  assert.equal(w.__xblocker.hiddenCount(), 2);
});
