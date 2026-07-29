# Santorini 2027 Site — Design

## Purpose

Replace the current static "coming soon" teaser at santorini2027.com with the real site: a top-tier digital invite/RSVP experience for Steve & his wife's 20th-anniversary trip to Santorini (they married July 4, 2007), built around their own real footage of the island. The site gathers, from each invitee: are they coming, how many people, are they staying at the Adamastos Hotel (and how many nights), which travel-date window works, whether they're traveling before/after Santorini, and interest in the group dinner and sunset cruise.

This supersedes the paused 2026-07-14 RSVP design (formerly at the now-deleted `santorini2027/` project directory). That design's hero concept (AI-illustrated caldera video with clickable hotspots) and its source asset are gone; this design starts from the real footage already live in the current teaser and a different interaction model (sequential modules, not hotspots-on-scroll).

## Scope

A single-page app that fully replaces `index.html` in this repo. No CMS — content is small and fixed enough to live in code. No personalization (one open link for everyone, no per-invitee URLs).

## Structure & Interaction Model

- Hero video (`santorini_2027.mp4`, already in this repo) plays once on load and **does not loop** — it holds on its final frame as a permanent backdrop for the entire session.
- **No page scroll at any point.** The viewport is fixed; content advances by modules sliding/dropping in and swapping out over the still video, not by scrolling to new sections.
- Access: open link, no password, no name pre-fill. Exclusivity comes from tone/design, not a gate.

## Module Flow

```
[Opening] Name · Are you coming? (Y/N) · Party size — all in one module
   │
   ├─ No  → [Closing] "Sorry to miss you" message + optional note field → end
   │
   └─ Yes → [Hotel] "Staying at the Adamastos Hotel?" (Y/N)
             → if yes: "How many nights?"
             │
             [Date windows] Multi-select, all that apply:
               • 6/30 – 7/6
               • 7/7 – 7/13
               • 7/14 – 7/18
             Each selected window gets an inline "prefer this one" toggle
             (auto-set if only one window is selected)
             │
             [Travel timing] Single-select: Before / After / Both / Neither
             + optional free-text note
             │
             [Dinner + Cruise] One module, two independent toggles:
               • Interested in the group dinner?
               • Interested in the sunset cruise?
             │
             [Closing] Thank-you message + optional note field → end
```

Every module is a distinct full-viewport beat (glass panel over the still video); there is no partial/inline validation gate beyond requiring name + the Y/N attending answer before advancing past the opening module.

## Visual Design System

Established and approved via visual-companion mockup on 2026-07-29 (`.superpowers/brainstorm/80597-1785351340/content/converged-direction-v2.html`). Palette extracted directly from an actual frame of `santorini_2027.mp4` via `Image.quantize` — not a generic travel-site palette:

| Role | Color |
|---|---|
| Background / panel base | `#082534` (deep navy, from the ocean) |
| Panel accent border / primary CTA | `#8A5233` (terracotta, from the cliffs) |
| Secondary accent / outlined CTA | `#265F6E` (teal, from the shallow water) |
| Headline text | `#DED5BD` (cream, from the coastline) |
| Field labels | `#9FB3AF` (lightened sage-teal — chosen for legibility over the darker `#265F6E`) |

- Typography: Helvetica/Arial, bold, uppercase, tight letter-spacing for headlines and CTAs — confident and editorial rather than decorative.
- Panel treatment: `rgba(8,37,52,0.82)` glass panel with backdrop blur, 3px terracotta left border, floating over the still video (not full-bleed white cards).
- Primary action ("I'm in" / advance): solid terracotta fill, cream text.
- Secondary/declining action: teal outline, muted teal text.
- Motion: modules slide/drop in and swap out between beats. Exact easing/timing/transform values are an implementation-plan detail, not fixed here — should read as confident and quick, not bouncy or playful.

## Data Model (Supabase)

Single `responses` table, one row per submission (including "not attending" responses):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | |
| `created_at` | timestamptz | default now() |
| `name` | text | required |
| `attending` | boolean | required |
| `party_size` | int | null if not attending |
| `hotel_staying` | boolean | null if not attending |
| `hotel_nights` | int | null unless `hotel_staying` |
| `window_1_selected` | boolean | 6/30–7/6 |
| `window_2_selected` | boolean | 7/7–7/13 |
| `window_3_selected` | boolean | 7/14–7/18 |
| `window_priority` | text | `'window_1' \| 'window_2' \| 'window_3'`, null if not attending |
| `travel_timing` | text | `'before' \| 'after' \| 'both' \| 'neither'`, null if not attending |
| `travel_note` | text | nullable, free text |
| `dinner_interested` | boolean | null if not attending |
| `cruise_interested` | boolean | null if not attending |
| `note` | text | nullable, closing guestbook note (asked regardless of attending) |

## Notifications & Admin

- On every submission (attending or not), send a notification email to Steve via Resend with the response details.
- A password-gated `/admin` page (same pattern as Knicks Club / Catchup admin) lists all responses in a sortable/filterable table — name, attending, party size, hotel + nights, date-window selections + priority, travel timing, dinner, cruise, notes.

## Stack

- Next.js 16 + Tailwind 4 (matches Tirzepedia/Catchup/stevemarchese.com conventions)
- Supabase for the `responses` table
- Resend for the notification email
- No CMS

## Hosting & Deploy

- Same Vercel project as the current teaser: `santorini2027` under personal scope `steve-marcheses-projects` (not `recog-media`).
- Same domain: `santorini2027.com` / `www.santorini2027.com` (DNS already correctly pointed at Vercel as of 2026-07-29).
- Deploy via `vercel --prod --yes` from the project root — requires the CLI to be logged into the `stevemarchese` personal account, not the work `recog-media` account.

## Testing

- Manual click-through of the full flow both branches (attending → all modules → closing; not attending → skip straight to closing) on desktop and mobile viewport sizes.
- Confirm hero video plays once and holds its final frame — no loop, no restart on re-focus/tab-switch.
- Submit a real test response, confirm the Resend email arrives and the `/admin` page reflects it correctly (including nullable fields for the not-attending path).
- Confirm `/admin` is inaccessible without the password.
