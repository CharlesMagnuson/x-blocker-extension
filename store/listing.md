# Chrome Web Store listing: X Blocker 2.0.0

Paste these into the developer dashboard. Character limits are noted where
the dashboard enforces them.

## Title (from manifest)

X Blocker

## Summary (132 characters max, from manifest description)

Hides every Twitter/X link, share button, image, embed and logo on every page, and blocks requests to x.com, twitter.com and t.co.

## Category

Productivity > Workflow & Planning (or Social & Communication, whichever the dashboard offers)

## Detailed description

The purpose of this extension is to remove X/Twitter from your web browsing experience.

Once installed, this extension prevents navigating to X/Twitter URLs directly. On every other page, anything that points at X/Twitter is hidden: links, share and follow buttons, sign-in buttons, images hosted on X, embedded posts and timelines, and the X logo or Twitter bird wherever they appear, including as icons or the 𝕏 character. Requests to x.com, twitter.com, t.co and twimg.com are blocked outright, so embed scripts and trackers never load.

Version 2.0 is a complete rewrite. It hides things before the page paints, so nothing flashes and then disappears, and it keeps watching as pages change, including inside frames. It never catches look-alikes such as netflix.com, dropbox.com or ordinary "X" close buttons.

There are no settings and no data collection. Install it and X is gone.

Covering all possibilities in a world of infinite possibilities is difficult, so this extension might not catch every X/Twitter button you run across. I'll do my best to improve the coverage as more are discovered.

Say 🙅🏻 to X.

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
