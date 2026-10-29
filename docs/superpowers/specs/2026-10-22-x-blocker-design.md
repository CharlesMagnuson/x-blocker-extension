# X Blocker — design spec

Date: 2026-10-22

## Purpose

A Chrome extension that removes every visible trace of Twitter/X from every
webpage the user visits: links, share buttons, images, embedded tweets,
icons, and the 𝕏 logo glyph. The user never wants to see a Twitter/X element
under any circumstance.

## Success criteria

- Any element whose URL attribute (href, src, srcset, action, poster,
  data-href, data-url, data-src, content, cite) points at a Twitter/X domain is
  hidden.
- Any text node containing the 𝕏 glyph (U+1D54F) is neutralised: the glyph's
  nearest inline/interactive ancestor is hidden, or the glyph is stripped from
  running prose.
- Inline SVG logos matching the official X logo path, the Font Awesome
  `x-twitter` path, or the Simple Icons X path are hidden, as are SVGs whose
  title/aria-label names Twitter or X.
- Elements whose class, id, alt, title or aria-label name Twitter or the X
  logo (e.g. `fa-x-twitter`, `twitter-tweet`, `share-twitter`, alt="Twitter")
  are hidden.
- Embedded tweet iframes and scripts (`platform.twitter.com`,
  `syndication.twitter.com`, `platform.x.com`) are hidden and their network
  requests blocked.
- Hiding persists through DOM mutation (infinite scroll, SPA routing,
  lazy-loaded share bars) and inside iframes.
- Network requests to the blocked domains are refused at the request layer,
  including top-level navigation to x.com / twitter.com.

## Domains

`x.com`, `twitter.com`, `t.co`, `twimg.com`, `twtrdns.net`, `twttr.com`, and
all subdomains. Hostname matching is exact-or-subdomain, never substring, so
`netflix.com`, `dropbox.com`, `box.com` are never caught.

## Architecture

```
manifest.json            MV3, content script in all frames at document_start,
                         declarativeNetRequest static ruleset.
rules.json               DNR block rules for the domain list (all resource types).
src/matcher.js           Pure functions, no DOM mutation. Exported for tests.
                           isBlockedUrl(str)         URL/host test
                           hasLogoGlyph(str)         𝕏 test
                           isLogoSvgPath(d)          SVG path fingerprint
                           namesTwitter(str)         class/alt/aria text test
                           classifyElement(el)       -> 'hide' | null
src/content.js           Injects CSS, runs initial sweep, MutationObserver,
                         handles text nodes and attribute changes.
src/hide.css             Attribute-selector rules that fire before JS runs
                         (first-paint protection).
test/*.test.js           node --test + jsdom.
```

### Layer 1: CSS (first paint)

Injected via manifest `css` at document_start. Attribute selectors for
`a[href]`, `img[src]`, `iframe[src]`, `link[href]`, `form[action]` with
protocol-anchored patterns (`//x.com/`, `//www.x.com`, `.x.com/`,
`twitter.com`, `//t.co/`, `twimg.com`) plus `blockquote.twitter-tweet`,
`[class*="twitter"]`, `[class*="x-twitter"]`. CSS cannot do exact hostname
matching, so this layer is deliberately slightly broad on `twitter` and
deliberately narrow on `x.com` (JS covers the gaps).

### Layer 2: JS (precision + text + SVG + mutations)

`content.js` runs at document_start, walks the DOM once it exists, and
attaches a `MutationObserver` for `childList`, `characterData`, and
`attributes` (href/src/class/alt/title/aria-label/data-*). Each candidate
element goes through `classifyElement`; a hit gets `data-xb-hidden=""` and a
`!important` `display:none` rule keyed on that attribute. Text nodes go
through `hasLogoGlyph`.

Shadow roots: open shadow roots are walked and observed too.

### Layer 3: declarativeNetRequest

Static rules in `rules.json` block every resource type for the domain list.
This stops embedded-tweet scripts, tracking pixels, and widgets at the
network layer so nothing can flash in before the content script runs.
Top-level navigation is included; removing `"main_frame"` from
`resourceTypes` in `rules.json` re-enables visiting the sites directly.

## Decisions

- `display:none` rather than removal: removal breaks page scripts that hold
  references; hiding is reversible and safer.
- Logo glyph in running prose: strip the character rather than hide a
  paragraph. Logo glyph as sole/primary content of `a`, `button`, `span`,
  `i`, `b`, `li`, etc.: hide that element.
- No options page, no whitelist, no toggle. Not requested.
- No icons in the store sense; simple generated PNGs so Chrome shows
  something in the toolbar.

## Testing

`npm test` runs `node --test` over `test/`. jsdom provides the DOM. Fixtures
in `test/fixtures/` cover share bars, embedded tweets, inline SVG logos, the
glyph, false-positive domains, and dynamically inserted content.
