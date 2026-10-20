# quindestudio.com

Static site for Quinde Studio and Word Laddered. No build step, no dependencies, no third-party requests.

This folder is separate from the game's Xcode project. `Logo/` holds the source logo; the site uses processed copies in `assets/`.

## Preview

    python3 -m http.server 8765

Then open http://localhost:8765/. Links are root-relative (`/assets/...`), so preview over HTTP, not `file://`.

## Layout

| Path | What |
|---|---|
| `index.html` | Studio home with the Word Laddered hero, playable demo, rules, features, contact |
| `games/<name>/`, `apps/<name>/` | One page per project: Word Laddered, Magic Mountain, Automata Dungeon, GameInventor, Dusk, RepoSync |
| `press/ support/ privacy/ terms/` | Press kit, support (App Store Support URL), privacy policy (App Store Privacy Policy URL), terms |
| `404.html` | Not-found page |
| `assets/site.css` | All styles. Two colours (`--blue`, `--white`); type, spacing and layout follow the golden ratio |
| `assets/heromap.js` | Magic Mountain's living map (ported from the game's own website) |
| `assets/video` | The Magic Mountain how-to-play video (17 MB) and its poster |
| `assets/project.js` | Project pages: screenshot lightbox, in-page navigation and five small previews (Dusk warmth, RepoSync limits, GameInventor card, Magic Mountain frames, Automata Dungeon sandbox) |
| `assets/engine.js`, `assets/demo.js` | Demo board: simplified game rules (engine) and the DOM driver |
| `assets/` icons, `og-image.png`, `favicon.svg`, `favicon.ico` | Brand and social images |
| `_headers` | Security headers and caching for Netlify / Cloudflare Pages |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain support |
| `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.well-known/security.txt` | Crawlers, PWA metadata, security contact |

The HTML pages were generated from one template; edit them directly now.
When you change `site.css` or the scripts, bump the `?v=` query in the HTML so browsers refetch.

## Before it goes live

- [ ] Set up mailboxes: `hello@`, `support@`, `privacy@`, `security@quindestudio.com` (or change them everywhere).
- [ ] Choose a host and point DNS at it. Cloudflare Pages or Netlify apply `_headers` (CSP, HSTS, etc.). GitHub Pages ignores it; the pages carry a CSP meta tag as a fallback.
- [ ] Confirm HTTPS works on `quindestudio.com` and `www` redirects to it.
- [ ] Re-read `privacy/` against the shipping build. It says: no ads, no analytics, no third-party SDKs, nothing sent to the studio, Game Center and iCloud handled by Apple.
- [ ] Have `terms/` and `privacy/` reviewed by a lawyer. They are plain-language drafts with no governing-law clause.
- [ ] Update `lastmod` in `sitemap.xml` and the "Last updated" dates when content changes.
- [ ] After launch: add the App Store badge and link, a `apple-itunes-app` Smart App Banner meta tag (needs the app ID), real screenshots and the trailer on `/press/`, and update the `MobileApplication` JSON-LD with the store URL.

## Checks

Colours are only `#1030ff` and `#ffffff`; text contrast is 7.3:1. Keyboard, screen-reader and reduced-motion paths are covered; there are no cookies, no analytics, and no inline scripts or styles (the CSP forbids them).
