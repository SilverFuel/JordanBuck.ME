# JordanBuck.ME

Single-page personal promotional website for Jordan Buck at `https://jordanbuck.me`, built with Vite, plain HTML/CSS/JavaScript, and anime.js v4.

## Requirements

- Node.js 20 or newer
- npm

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Going Live On Render

Create a new Render Static Site from the connected GitHub repo.

- Build command: `npm run build`
- Publish directory: `dist`
- Auto-deploy: enable for the main branch
- Blueprint: `render.yaml` is included at the repo root

Add both custom domains in the Render dashboard:

- `jordanbuck.me`
- `www.jordanbuck.me`

Choose one canonical host and configure Render to redirect the other host to it. The site metadata currently uses `https://jordanbuck.me` as the canonical URL.

In Namecheap, add the DNS records Render displays for domain verification. For the apex domain, Render will show an A record target, or an ALIAS/ANAME target when supported. For `www`, Render will show a CNAME target under `*.onrender.com`. Copy the exact values from the Render dashboard because the target values are account and region specific. Do not hardcode an IP or guessed target.

Render automatically provisions and renews a free managed TLS certificate after DNS verification. The separately purchased Namecheap SSL certificate is not needed, and there are no manual SSL installation steps for this Render Static Site.

## Content Updates

Primary page content lives in `index.html`. Update the Open Graph source art in `public/og-card.svg`, then regenerate `public/og-card.png` at 1200x630 before publishing metadata changes.

The MissionBoard case study embeds the live, read-only sample-data demo at `https://missionboard-portfolio-demo.silverfuel.chatgpt.site/`. Visitors can filter the fictional workload and open project details directly in the page. A visible sample-data label, keyboard skip link, and standalone link surround the frame. Its three actual screenshots remain in an optional guided walkthrough, stored as `public/projects/missionboard-demo-*.png`. The walkthrough supports keyboard tabs, discovery prompts, and a full-resolution image dialog with zoom. Without portfolio JavaScript, the frame, screenshots, prompts, and original image links remain available.

The demo remains on its independent origin, with no connection to MissionBoard production. The iframe grants only `allow-scripts allow-same-origin`: its existing JavaScript modules need their own origin for loading, while the browser still denies access to the portfolio document. Do not replace its source with a same-origin copy using those permissions. It has no form, popup, download, or top-navigation permission; sensitive device permissions are explicitly denied, and requests omit the referring page. The demo's unchanged CSP blocks network connections (`connect-src 'none'`), and its workload is bundled static fictional data. There is no cross-frame messaging, write API, account, billing, notification, or integration setup. Hosting may set its own security cookies; the application uses no cookies or browser storage.

The hosted demo currently permits framing. Its separate local development server deliberately denies framing and must not be used as the iframe source. If the host later changes its framing headers or becomes unavailable, the standalone link and screenshot walkthrough remain accessible. Do not weaken authentication, CSP, or production headers to accommodate the embed.

Explorer behavior lives in `src/missionboard-explorer.js` and `src/styles/missionboard.css`; the embed is declarative HTML. Validate changes with `npm run lint:html`, `npm run build`, and `npm test`. Install Chromium once with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed executable. Browser tests intercept only the six approved demo asset URLs with a hash-verified copy of the published sample-data source; all other external requests and writes are blocked. This keeps regression tests deterministic and separate from production.

Publish only this portfolio repository through its existing GitHub main → Render deployment. `PORTFOLIO_BASE_URL=https://jordanbuck.me npm test` checks the published portfolio without starting a local server, but still uses the demo fixtures. After deployment, also check the actual hosted frame in a fresh browser on desktop and mobile: filter, clear, open a project, navigate by keyboard, and confirm only static demo assets load. Hosted-frame acceptance is separate from fixture-based regression tests. No MissionBoard production deployment is involved.
