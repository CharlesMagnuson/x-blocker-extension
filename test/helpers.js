const { JSDOM } = require('jsdom');

// Build a document from an HTML fragment and return the first element
// matching `selector` (or the body when no selector is given).
function dom(html) {
  const jsdom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  return jsdom.window;
}

function el(html, selector) {
  const window = dom(html);
  return selector ? window.document.querySelector(selector) : window.document.body.firstElementChild;
}

module.exports = { dom, el };

const fs = require('node:fs');
const path = require('node:path');
const MATCHER_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'matcher.js'), 'utf8');
const CONTENT_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');
const PAGE_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'page.js'), 'utf8');

// Boot a page with the extension's content script loaded, exactly as the
// manifest would load it: page.js in the page's own world, then matcher
// and content in the isolated world.
function page(bodyHtml) {
  const jsdom = new JSDOM(`<!doctype html><html><head></head><body>${bodyHtml}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://example.com/',
  });
  const window = jsdom.window;
  window.eval(PAGE_SRC);
  window.eval(MATCHER_SRC);
  window.eval(CONTENT_SRC);
  return window;
}

// Let MutationObserver callbacks run.
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function isHidden(el) {
  return el.hasAttribute('data-xb-hidden') && el.style.getPropertyValue('display') === 'none';
}

// Resolve once the window's load event has fired (the content script's
// last scheduled full sweep), so a test can exercise what happens afterwards.
function loaded(window) {
  if (window.document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
}

module.exports.page = page;
module.exports.loaded = loaded;
module.exports.tick = tick;
module.exports.isHidden = isHidden;
