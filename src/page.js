// X Blocker page-world helper. Runs in the page's own JavaScript world
// (manifest "world": "MAIN") because the isolated world cannot see the
// page's Element.prototype. It does one thing: when a page attaches a
// shadow root, it marks the host with data-xb-shadow so the isolated-world
// MutationObserver in content.js notices and sweeps the new root.
(function () {
  'use strict';
  const proto = typeof Element !== 'undefined' && Element.prototype;
  if (!proto || !proto.attachShadow || proto.attachShadow.__xblocker) return;
  const native = proto.attachShadow;
  function attachShadow(init) {
    const root = native.call(this, init);
    try { this.setAttribute('data-xb-shadow', ''); } catch (_) { /* detached or exotic host */ }
    return root;
  }
  attachShadow.__xblocker = true;
  try {
    Object.defineProperty(proto, 'attachShadow', { value: attachShadow, configurable: true, writable: true });
  } catch (_) { /* frozen prototype: shadow roots fall back to load-time sweeps */ }
})();
