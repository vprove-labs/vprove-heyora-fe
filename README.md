# Heyora · Launching Soon

Static "launching soon" site for **Heyora**, Ayurvastra-inspired women's dryfit innerwear and activewear
(inners, tees, hoodies, panties). Built with Vite and Three.js. Designed & developed by VPROVE SOLUTIONS PRIVATE LIMITED.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview  # serve the production build
```

- `index.html`: page copy and sections
- `src/scene.js`: the 3D scene (handloom fabric shader, golden lotus chakra, pollen particles)
- `src/main.js`: scroll reveals, card tilt, waitlist form
- `src/style.css`: styles and brand palette

The 3D scene loads in its own chunk after the page text, pauses when the tab is hidden, renders a
still frame for visitors who prefer reduced motion, and falls back to a CSS gradient without WebGL.

## Waitlist sign-ups

The form posts `{ email, source }` as JSON to `VITE_WAITLIST_ENDPOINT` when that environment
variable is set (for example a Formspree form URL or a Google Apps Script web app). Add it in
Vercel under Project → Settings → Environment Variables and redeploy. Without it, the form only
validates and thanks the visitor; no email is stored.

## Deploy on Vercel

1. In Vercel, **Add New → Project** and import `vprove-labs/vprove-heyora-fe`.
2. Framework preset **Vite** is detected (`vercel.json` pins build command `npm run build` and output `dist`).
3. Deploy. Every pull request gets its own preview URL.

## Point the GoDaddy domain at Vercel

1. In Vercel: Project → **Settings → Domains**, add `heyora.co` and `www.heyora.co`.
   Choose to redirect `www` to the apex (or the other way round).
2. In GoDaddy: **My Products → Domain → DNS → Manage DNS** for `heyora.co`.
3. Edit or add these records (delete any existing GoDaddy "Parked" `A` record for `@` and any
   conflicting `CNAME` for `www`; leave MX/TXT email records alone):

   | Type  | Name | Value                  | TTL    |
   |-------|------|------------------------|--------|
   | A     | @    | `76.76.21.21`          | 1 hour |
   | CNAME | www  | `cname.vercel-dns.com` | 1 hour |

   If Vercel's Domains page shows different values for your project, use the ones it shows.
4. Wait for Vercel's Domains page to show both domains as **Valid Configuration**. Vercel issues the
   HTTPS certificate automatically. DNS changes usually apply within minutes but can take up to 48 hours.
