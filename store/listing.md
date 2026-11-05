# Chrome Web Store listing: X Blocker 2.0.0

Paste these into the developer dashboard. Character limits are noted where
the dashboard enforces them.

## Title (from manifest)

X Blocker

## Summary (132 characters max, from manifest description)

Hides every Twitter/X link, share button, image, embed and logo on every webpage, and blocks requests to x.com, twitter.com, t.co and twimg.com.

## Category

Productivity > Workflow & Planning (or Social & Communication, whichever the dashboard offers)

## Detailed description

X Blocker removes every visible trace of Twitter/X from every page you visit.

What it hides:
• Links to x.com, twitter.com and t.co, including redirector links that point there
• "Share on X" and "Follow us on X" buttons
• Images hosted on twimg.com
• Embedded tweets, timelines and the widgets that load them
• The 𝕏 logo, the Twitter bird and icon-font glyphs for both
• Wrappers left empty once the X element inside them is gone, so no blank boxes remain

What it blocks:
• Every network request to x.com, twitter.com, t.co and twimg.com, so embed scripts and trackers never download

How it works:
• Blocking rules run inside Chrome's declarativeNetRequest engine, so nothing is fetched from those domains
• A stylesheet hides the obvious cases at first paint, before the page can flash them
• A lightweight content script sweeps each page once, then watches for new content, including inside frames and open shadow roots

What it does not do:
• It never reads, stores or sends your browsing data anywhere. There is no backend, no analytics and no account
• It has no settings and no popup. Install it and X disappears

Version 2.0 is a ground-up rewrite that catches far more than the original and no longer flashes content before hiding it. Matching is exact-or-subdomain, so sites such as box.com, dropbox.com and netflix.com are never caught, and ordinary close buttons labelled "X" are left alone.

Open source: https://github.com/CharlesMagnuson/x-blocker-extension

## Single purpose description

Hide all Twitter/X content (links, buttons, images, embeds and logos) on every webpage and block network requests to Twitter/X domains.

## Permission justifications

### declarativeNetRequest

Used to block network requests to x.com, twitter.com, t.co and twimg.com with a static ruleset (rules.json) so that embedded tweets, widgets, tracking pixels and images from those domains never load. Blocking is done entirely by Chrome's rule engine; the extension does not observe or log any request.

### Host permission: <all_urls>

The extension's single purpose is to hide Twitter/X content on every website the user visits, so the content script and stylesheet must run on every page and every frame. There is no way to know in advance which sites embed Twitter/X content. The content script only inspects the DOM for Twitter/X links, images, icons and embeds and hides them; it does not read page text for any other purpose and transmits nothing.

### Remote code

No. All code ships inside the package. No scripts are fetched or evaluated at runtime.

## Privacy practices tab

Data usage: select **none** of the data types. The extension does not collect, store or transmit any user data.

Certify all three statements:
• I do not sell or transfer user data to third parties, outside of the approved use cases
• I do not use or transfer user data for purposes that are unrelated to my item's single purpose
• I do not use or transfer user data to determine creditworthiness or for lending purposes

Privacy policy URL: see store/privacy-policy.md. Host it at a public URL
(the privacy-policy.md file in this repo on GitHub works) and paste the URL here. A
policy URL is optional when no data is collected, but it avoids reviewer
questions.

## Store assets

• Icon 128×128: icons/icon128.png
• Screenshot 1280×800: store/screenshot-1280x800.png
• Small promo tile 440×280: store/promo-tile-440x280.png

## Release notes for the "What's new" field

2.0.0: complete rewrite. Hides links, share buttons, images, embeds, inline SVG logos, icon-font glyphs and the 𝕏 character on every page and inside every frame, with no flash of content before hiding. Blocks all requests to x.com, twitter.com, t.co and twimg.com. Removed the storage permission; the extension keeps no data.
