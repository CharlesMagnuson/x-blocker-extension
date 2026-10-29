# X Blocker

A Chrome extension that removes every visible trace of Twitter/X from every
webpage: links, share buttons, images, embedded tweets, icons, and the 𝕏 logo.
It also blocks network requests to x.com, twitter.com, t.co and twimg.com.

## Install

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this folder.

Reload any open tabs. The extension runs on every site and inside every frame.

## What gets hidden

| Signal | Example |
|---|---|
| URL attribute pointing at a blocked host | `<a href="https://x.com/...">`, `<img src="https://pbs.twimg.com/...">`, `<iframe src="https://platform.twitter.com/...">`, redirectors like `/out?u=https%3A%2F%2Fx.com` |
| Class, id, alt, title or aria-label naming Twitter or the X logo | `fa-x-twitter`, `twitter-tweet`, `share-twitter`, `alt="Twitter"`, `aria-label="Share on X"` |
| Inline SVG whose path is the X logo or Twitter bird | official X logo, Font Awesome `x-twitter`, Simple Icons, Material bird |
| SVG `<title>` or `<use href="#...">` naming Twitter/X | `<use href="#icon-twitter">` |
| The 𝕏 glyph (U+1D54F) | A lone `<span>𝕏</span>` or `<a>𝕏</a>` is hidden. In running prose the glyph is removed and the sentence kept. |

Hostname matching is exact-or-subdomain, so netflix.com, dropbox.com and
box.com are never caught. Close buttons labelled "X" are left alone.

When a hidden element was the only thing inside a wrapper such as an `<li>`
or `<a>`, the wrapper is hidden too so no empty padded box remains.

## How it works

Three layers, in the order they act:

1. **declarativeNetRequest** (`rules.json`): blocks every request to the
   domains, so embed scripts and widgets never download.
2. **CSS at first paint** (`src/hide.css`): attribute selectors hide the
   obvious cases before any script can run, so nothing flashes.
3. **Content script** (`src/matcher.js` + `src/content.js`): runs at
   `document_start` in every frame, sweeps the DOM, and watches a
   `MutationObserver` for new nodes, attribute changes and text changes.
   Open shadow roots are swept and observed too: `src/page.js` runs in the
   page's own world and marks any host that attaches a shadow root, so the
   observer can sweep it. (Closed shadow roots are only reachable at
   `DOMContentLoaded` and `load` sweeps.)

Hidden elements get `data-xb-hidden` and `display: none !important`.

## Allowing direct visits to x.com

Top-level navigation is blocked too. To allow visiting the sites directly
while still hiding them everywhere else, remove `"main_frame"` from each
rule's `resourceTypes` in `rules.json` and reload the extension.

## Development

```sh
npm install
npm test
```

Tests use `node --test` with jsdom. `test/fixtures/sample.html` is a manual
fixture: every element carries `data-expect="hide"` or `data-expect="keep"`.
