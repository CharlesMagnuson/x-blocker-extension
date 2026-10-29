// X Blocker content script. Runs at document_start in every frame.
// Depends on src/matcher.js (loaded first by the manifest) for all
// matching decisions; this file only touches the DOM.
(function () {
  'use strict';

  const M = globalThis.XBMatcher;
  if (!M || globalThis.__xblocker) return;

  const HIDDEN_ATTR = 'data-xb-hidden';
  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;
  const DOCUMENT_FRAGMENT_NODE = 11;
  const WATCHED_ATTRS = [
    'href', 'src', 'srcset', 'action', 'formaction', 'poster', 'cite', 'content',
    'class', 'id', 'alt', 'title', 'aria-label', 'role', 'd', 'xlink:href',
    'data-href', 'data-url', 'data-src', 'data-link', 'data-share-url',
    'data-network', 'data-service', 'data-provider', 'data-platform', 'data-share', 'data-social',
    'data-xb-shadow',
  ];

  let hidden = 0;
  const observed = new WeakSet();

  // --- hiding -----------------------------------------------------------

  function hide(el) {
    if (el.hasAttribute(HIDDEN_ATTR)) return;
    el.setAttribute(HIDDEN_ATTR, '');
    // CSSOM writes are permitted under any page CSP, unlike injected <style>.
    try { el.style.setProperty('display', 'none', 'important'); } catch (_) { /* SVG without style */ }
    hidden++;
  }

  function alreadyHidden(el) {
    return !!(el.closest && el.closest('[' + HIDDEN_ATTR + ']'));
  }

  // --- text nodes -------------------------------------------------------

  const LOGO_ONLY_TAGS = new Set(['span', 'i', 'b', 'em', 'strong', 'small', 'sup', 'sub', 'label', 'li', 'td', 'div', 'p', 'figcaption']);

  function ownText(el) {
    let text = '';
    for (let n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === TEXT_NODE) text += n.nodeValue;
    }
    return text;
  }

  function processText(node) {
    if (!M.hasLogoGlyph(node.nodeValue)) return;
    const parent = node.parentElement;
    if (!parent || alreadyHidden(parent)) return;

    // A link/button carrying the glyph is an X control: hide the control.
    const asControl = M.classifyElement(parent);
    if (asControl) { hide(asControl); return; }

    // A small element whose text is nothing but the glyph is a logo: hide it.
    const remaining = M.stripLogoGlyph(ownText(parent)).trim();
    const tag = (parent.localName || '').toLowerCase();
    if (remaining === '' && parent.children.length === 0 && LOGO_ONLY_TAGS.has(tag)) {
      hide(parent);
      return;
    }

    // Otherwise the glyph sits in running prose: remove just the glyph.
    node.nodeValue = M.stripLogoGlyph(node.nodeValue);
  }

  // --- elements ---------------------------------------------------------

  function processElement(el) {
    if (alreadyHidden(el)) return;
    const target = M.classifyElement(el);
    if (target) hide(target);
    if (el.shadowRoot) attach(el.shadowRoot);
  }

  function sweep(root) {
    if (!root) return;
    if (root.nodeType === ELEMENT_NODE) {
      processElement(root);
      if (root.hasAttribute(HIDDEN_ATTR)) return;
    }
    const doc = root.ownerDocument || root;
    const walker = doc.createTreeWalker(root, 0x1 | 0x4 /* SHOW_ELEMENT | SHOW_TEXT */);
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeType === ELEMENT_NODE) processElement(n);
      else processText(n);
    }
  }

  // --- mutation handling ------------------------------------------------

  function onMutations(records) {
    for (const r of records) {
      if (r.type === 'childList') {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) sweep(n);
          else if (n.nodeType === TEXT_NODE) processText(n);
        });
      } else if (r.type === 'attributes') {
        if (r.target.nodeType === ELEMENT_NODE) processElement(r.target);
      } else if (r.type === 'characterData') {
        if (r.target.nodeType === TEXT_NODE) processText(r.target);
      }
    }
  }

  function attach(root) {
    if (observed.has(root)) return;
    observed.add(root);
    const observer = new MutationObserver(onMutations);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRS,
      characterData: true,
    });
    sweep(root);
  }

  // --- boot -------------------------------------------------------------

  attach(document);
  document.addEventListener('DOMContentLoaded', () => sweep(document), { once: true });
  globalThis.addEventListener('load', () => sweep(document), { once: true });

  globalThis.__xblocker = {
    hiddenCount: () => hidden,
    sweep: () => sweep(document),
  };
})();
