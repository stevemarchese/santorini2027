# Santorini 2027 Teaser Page — Design

## Purpose

A temporary "coming soon" placeholder for santorini2027.com, to put something live on the domain now while the full one-page RSVP/invite site (a separate, larger project, paused mid-brainstorm at `/Users/stevework/claude-code/santorini2027`) is designed and built later. This teaser is intentionally disposable — it will be replaced wholesale when the real site ships, not extended.

## Scope

One static HTML page. Nothing else — no routing, no data, no form, no build step.

- Full-bleed background `<video>`: `Santorini_2027.mp4` (1920x1080, h264, ~4s, ~15MB), sourced from `/Volumes/Elements/Steve Storage 2-2026/steve files/Santorini 2027/Santorini_2027.mp4`, copied into the project as a static asset.
- Video plays `autoplay muted loop playsinline`, `object-fit: cover`, covering the full viewport behind everything else.
- Centered text overlay: "More information coming soon", over a semi-transparent dark scrim so it reads clearly against any frame of the video.
- Responsive: works full-viewport on both desktop and mobile.
- No nav, no links, no favicon requirements beyond a basic default, no analytics.

This page is unrelated to and does not touch the paused RSVP site design in `santorini2027/` — different video asset, different (much smaller) scope, different project directory.

## Stack

Plain HTML/CSS, no JavaScript framework, no build step. Matches the pattern already used for other quick prototype/placeholder sites (webby-store-redesign, webby-entry-redesign).

## Hosting & Deploy

- Vercel, personal scope `steve-marcheses-projects` (same scope as stevemarchese.com, Knicks Club — not `recog-media`, this is a personal project).
- Vercel project name: `santorini2027`.
- Deploy via `vercel --prod --yes` from the project root (static output, no build command needed).

## Domain / DNS

- Domain: `santorini2027.com`, registered via Squarespace Domains.
- After first deploy, Vercel will provide the DNS records needed (typically an A record for the apex domain and a CNAME for `www`).
- Steve will add those records himself in the Squarespace domain DNS panel — not automated via browser tooling.

## Testing

Manual visual check: load the deployed URL in a browser, confirm the video autoplays/loops/covers the viewport on both a desktop-sized and mobile-sized window, and the overlay text is legible throughout the loop.
