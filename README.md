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

Primary page content lives in `index.html`. Update the Open Graph preview text in `public/og-card.svg` if the headline or positioning statement changes.
