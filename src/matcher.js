// Pure matching logic for X Blocker. No DOM mutation lives here.
// Classic script (not an ES module) so it can be loaded as a content
// script; it also exports under CommonJS for the test suite.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module && module.exports) {
    module.exports = api;
  } else {
    root.XBMatcher = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Hostnames (and all their subdomains) that belong to Twitter/X.
  const BLOCKED_HOSTS = ['x.com', 'twitter.com', 't.co', 'twimg.com', 'twttr.com', 'twtrdns.net'];

  // A blocked host, optionally prefixed by subdomains, bounded so that
  // "netflix.com" / "dropbox.com" never match: the character before the
  // host must not be part of a hostname, and the character after must end
  // the host (end of string, path, query, port, or quote/space).
  const HOST_RE = new RegExp(
    '(?:^|[^a-z0-9.-])(?:[a-z0-9-]+\\.)*(?:' +
      BLOCKED_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|') +
      ')(?=$|[/?#:&"\'\\s])'
  );

  function safeDecode(s) {
    try {
      return decodeURIComponent(s);
    } catch (_) {
      return s;
    }
  }

  function isBlockedUrl(value) {
    if (typeof value !== 'string' || value.length === 0) return false;
    const lower = value.toLowerCase();
    if (HOST_RE.test(lower)) return true;
    const decoded = safeDecode(lower);
    return decoded !== lower && HOST_RE.test(decoded);
  }

  // ---------------------------------------------------------------------
  // The 𝕏 logo glyph (MATHEMATICAL DOUBLE-STRUCK CAPITAL X).
  // ---------------------------------------------------------------------
  const GLYPH = '\u{1D54F}';
  const GLYPH_RE = /\u{1D54F}/u;
  const GLYPH_WITH_SPACE_RE = /\s*\u{1D54F}\s*/gu;
  const PUNCT_RE = /[.,;:!?)\]}]/;

  function hasLogoGlyph(text) {
    return typeof text === 'string' && GLYPH_RE.test(text);
  }

  // Remove the glyph from running prose without leaving doubled spaces or
  // a stray space before punctuation.
  function stripLogoGlyph(text) {
    if (typeof text !== 'string') return text;
    return text.replace(GLYPH_WITH_SPACE_RE, (match, offset, whole) => {
      const hasBefore = offset > 0;
      const next = whole[offset + match.length];
      const hasAfter = next !== undefined;
      if (hasBefore && hasAfter && !PUNCT_RE.test(next)) return ' ';
      return '';
    });
  }

  // ---------------------------------------------------------------------
  // Inline SVG fingerprints. Path data is normalised (lower-case, all
  // whitespace removed) and compared against the opening segment of known
  // logo paths. The prefixes are long enough that no ordinary icon shares
  // them.
  // ---------------------------------------------------------------------
  const SVG_FINGERPRINTS = [
    'm18.2442.25h3.308l-7.2278.268.50211.24',     // official X logo, 24x24
    'm714.163519.284l1160.890h1055.03',           // official X logo, 1200x1227
    'm178.57127.15290.270h-26.46',                // official X logo, 300x300
    'm18.9011.153h3.68l-8.049.19',                // Simple Icons "x"
    'm389.248h70.6l305.6224.2487464',             // Font Awesome "x-twitter"
    'm23.9534.57a10100',                          // Simple Icons "twitter" bird
    'm459.37151.716c.325,4.548',                  // Font Awesome 5 "twitter" bird
    'm459.3715151.716c.325,4.548',
    'm23.6434.937c-.835.37-1.732.62',             // Material / Bootstrap bird
  ].map(normalisePath);

  function normalisePath(d) {
    return String(d).toLowerCase().replace(/\s+/g, '');
  }

  function isLogoSvgPath(d) {
    if (typeof d !== 'string' || d.length < 20) return false;
    const norm = normalisePath(d);
    return SVG_FINGERPRINTS.some((fp) => norm.includes(fp));
  }

  // ---------------------------------------------------------------------
  // Names: class lists, ids, alt text, titles, aria-labels.
  // ---------------------------------------------------------------------
  const X_CONTEXT = new Set([
    'logo', 'social', 'socials', 'share', 'sharing', 'icon', 'follow',
    'on', 'to', 'formerly', 'post', 'via', 'network', 'twitter',
  ]);

  function tokenise(text) {
    return String(text)
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  function namesTwitter(text, options) {
    if (typeof text !== 'string' || text.trim() === '') return false;
    const allowBare = !options || options.allowBare !== false;
    const tokens = tokenise(text);
    if (tokens.length === 0) return false;
    if (tokens.some((t) => t.startsWith('twitter') || t.startsWith('tweet'))) return true;
    if (allowBare && tokens.length === 1 && tokens[0] === 'x') return true;
    return tokens.some((t, i) => t === 'x' && (X_CONTEXT.has(tokens[i - 1]) || X_CONTEXT.has(tokens[i + 1])));
  }

  // ---------------------------------------------------------------------
  // Element classification. Returns the element that should be hidden
  // (which may be an ancestor wrapper), or null.
  // ---------------------------------------------------------------------
  const LABEL_ATTRS = ['alt', 'title', 'aria-label', 'aria-describedby', 'data-network', 'data-service', 'data-provider', 'data-platform', 'data-share', 'data-social', 'data-tooltip', 'data-title'];
  const CLOSE_RE = /\b(close|dismiss|remove|clear|delete|cancel|toggle|menu|hamburger|collapse|exit)\b/i;
  const SHELL_TAGS = new Set(['a', 'button', 'li', 'span', 'i', 'b', 'em', 'strong', 'small', 'label', 'div', 'figure', 'p', 'td']);
  const MAX_SHELL_DEPTH = 3;
  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;

  function isElement(node) {
    return !!node && node.nodeType === ELEMENT_NODE && typeof node.getAttribute === 'function';
  }

  function tagOf(el) {
    return String(el.localName || el.tagName || '').toLowerCase();
  }

  function attributesOf(el) {
    const out = [];
    const attrs = el.attributes;
    if (!attrs) return out;
    for (let i = 0; i < attrs.length; i++) out.push(attrs[i]);
    return out;
  }

  // Any attribute value that contains a blocked URL (href, src, srcset,
  // action, poster, data-*, content, cite, xlink:href, ...). `style` and
  // `class` are skipped: `class` is handled by name matching, and `style`
  // can legitimately contain arbitrary strings.
  function hasBlockedUrlAttribute(el) {
    return attributesOf(el).some((attr) => {
      const name = attr.name.toLowerCase();
      if (name === 'style' || name === 'class') return false;
      return isBlockedUrl(attr.value);
    });
  }

  function looksLikeCloseControl(el) {
    const cls = (el.getAttribute('class') || '') + ' ' + (el.getAttribute('id') || '');
    return CLOSE_RE.test(cls);
  }

  function hasTwitterName(el) {
    const cls = el.getAttribute('class');
    if (cls && namesTwitter(cls, { allowBare: false })) return true;
    const id = el.getAttribute('id');
    if (id && namesTwitter(id, { allowBare: false })) return true;
    const allowBare = !looksLikeCloseControl(el);
    return LABEL_ATTRS.some((name) => {
      const v = el.getAttribute(name);
      return v && v.length < 120 && namesTwitter(v, { allowBare });
    });
  }

  function svgIsLogo(svg) {
    if (hasTwitterName(svg)) return true;
    const title = svg.querySelector && svg.querySelector('title');
    if (title && namesTwitter(title.textContent || '')) return true;
    const paths = svg.querySelectorAll ? svg.querySelectorAll('path') : [];
    for (let i = 0; i < paths.length; i++) {
      if (isLogoSvgPath(paths[i].getAttribute('d'))) return true;
    }
    const uses = svg.querySelectorAll ? svg.querySelectorAll('use') : [];
    for (let i = 0; i < uses.length; i++) {
      const ref = uses[i].getAttribute('href') || uses[i].getAttribute('xlink:href') || '';
      const fragment = ref.slice(ref.indexOf('#') + 1);
      if (namesTwitter(fragment, { allowBare: false })) return true;
    }
    return false;
  }

  function ownText(el) {
    let text = '';
    const kids = el.childNodes || [];
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].nodeType === TEXT_NODE) text += kids[i].nodeValue;
    }
    return text;
  }

  function isInteractive(el) {
    const tag = tagOf(el);
    return tag === 'a' || tag === 'button' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link';
  }

  // Walk up through wrappers that would be left visibly empty (a lone
  // <a> inside a lone <li>, for instance) so the page doesn't keep an
  // empty padded box where the icon was.
  function collapseShell(el) {
    let target = el;
    for (let depth = 0; depth < MAX_SHELL_DEPTH; depth++) {
      const parent = target.parentNode;
      if (!isElement(parent) || !SHELL_TAGS.has(tagOf(parent))) break;
      if (parent.children.length !== 1) break;
      if (ownText(parent).trim() !== '') break;
      target = parent;
    }
    return target;
  }

  function matches(el) {
    if (hasBlockedUrlAttribute(el)) return true;
    if (hasTwitterName(el)) return true;
    if (isInteractive(el) && hasLogoGlyph(el.textContent || '')) return true;
    return false;
  }

  function classifyElement(node) {
    if (!isElement(node)) return null;
    const tag = tagOf(node);
    if (tag === 'path' || tag === 'use' || tag === 'g' || tag === 'title') {
      const svg = node.closest ? node.closest('svg') : null;
      return svg ? classifyElement(svg) : null;
    }
    if (tag === 'svg') {
      return svgIsLogo(node) ? collapseShell(node) : null;
    }
    return matches(node) ? collapseShell(node) : null;
  }

  return { isBlockedUrl, BLOCKED_HOSTS, hasLogoGlyph, stripLogoGlyph, GLYPH, isLogoSvgPath, namesTwitter, classifyElement };
});
