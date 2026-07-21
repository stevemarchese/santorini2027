# Santorini 2027 Teaser Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single static "coming soon" page for santorini2027.com — full-bleed looping teaser video with a "More information coming soon" overlay — live on Vercel.

**Architecture:** One self-contained `index.html` (inline `<style>`, no external CSS/JS files, no build step) plus the video asset sitting next to it. Deployed to Vercel as a static site.

**Tech Stack:** Plain HTML/CSS. Vercel CLI for deploy. No framework, no package.json, no build step.

## Global Constraints

- No JavaScript framework, no build step — plain static HTML/CSS only (spec: Stack).
- Video: `autoplay muted loop playsinline`, `object-fit: cover`, full viewport (spec: Scope).
- Overlay text is exactly: "More information coming soon" (spec: Scope).
- Vercel scope: `steve-marcheses-projects`; Vercel project name: `santorini2027` (spec: Hosting & Deploy).
- Deploy command: `vercel --prod --yes` (spec: Hosting & Deploy).
- This project must not modify anything under `/Users/stevework/claude-code/santorini2027` (the separate, paused RSVP site) (spec: Purpose).

---

### Task 1: Add the video asset and build the page

**Files:**
- Create: `/Users/stevework/claude-code/santorini2027-teaser/santorini_2027.mp4` (copied from source)
- Create: `/Users/stevework/claude-code/santorini2027-teaser/index.html`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a complete, deployable static site at the project root — `index.html` referencing `santorini_2027.mp4` by relative path `./santorini_2027.mp4`.

- [ ] **Step 1: Copy the video asset into the project**

```bash
cp "/Volumes/Elements/Steve Storage 2-2026/steve files/Santorini 2027/Santorini_2027.mp4" \
   "/Users/stevework/claude-code/santorini2027-teaser/santorini_2027.mp4"
```

- [ ] **Step 2: Verify the copy succeeded and matches the source size**

Run: `ls -la "/Volumes/Elements/Steve Storage 2-2026/steve files/Santorini 2027/Santorini_2027.mp4" /Users/stevework/claude-code/santorini2027-teaser/santorini_2027.mp4`
Expected: both listed files show the same size, `15331725` bytes.

- [ ] **Step 3: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Santorini 2027</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background: #000;
      overflow: hidden;
    }

    .hero {
      position: relative;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }

    .hero video {
      position: absolute;
      top: 50%;
      left: 50%;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      transform: translate(-50%, -50%);
      object-fit: cover;
    }

    .scrim {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 1.5rem;
    }

    .overlay h1 {
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-weight: 500;
      font-size: clamp(1.5rem, 5vw, 3rem);
      letter-spacing: 0.02em;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="hero">
    <video autoplay muted loop playsinline>
      <source src="./santorini_2027.mp4" type="video/mp4" />
    </video>
    <div class="scrim"></div>
    <div class="overlay">
      <h1>More information coming soon</h1>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
cd /Users/stevework/claude-code/santorini2027-teaser
git add index.html santorini_2027.mp4
git commit -m "Add Santorini 2027 teaser page: video hero + coming-soon overlay"
```

---

### Task 2: Verify locally in a browser

**Files:**
- None created or modified — this task only verifies Task 1's output.

**Interfaces:**
- Consumes: `index.html` and `santorini_2027.mp4` from Task 1.
- Produces: confirmation the page is correct, gating Task 3 (deploy).

- [ ] **Step 1: Serve the directory locally**

```bash
cd /Users/stevework/claude-code/santorini2027-teaser
python3 -m http.server 8850
```

- [ ] **Step 2: Open in a browser and check the page**

Open `http://localhost:8850/` in a browser (or via the claude-in-chrome tool). Confirm:
- The video autoplays, loops, and fills the entire viewport with no letterboxing, at both a desktop-sized window and a narrow/mobile-sized window.
- The text "More information coming soon" is centered and clearly legible against every frame of the video loop.
- No scrollbars appear (page is exactly one viewport, no overflow).

Expected: all three checks pass. If the video doesn't fill the frame at some aspect ratios, adjust `min-width`/`min-height` in the `.hero video` rule from Task 1 Step 3 and re-check.

- [ ] **Step 3: Stop the local server**

Run: `Ctrl+C` in the terminal running `python3 -m http.server 8850`, or `pkill -f "http.server 8850"`.

---

### Task 3: Deploy to Vercel

**Files:**
- None created — deploy only. (Vercel CLI may create a local `.vercel/` directory; that's expected and should be added to `.gitignore`.)

**Interfaces:**
- Consumes: the verified static site from Tasks 1–2.
- Produces: a live Vercel production URL and the DNS records needed to point `santorini2027.com` at it.

- [ ] **Step 1: Add `.gitignore` for the Vercel CLI's local state**

```bash
cd /Users/stevework/claude-code/santorini2027-teaser
printf ".vercel\n" > .gitignore
git add .gitignore
git commit -m "Ignore .vercel local state"
```

- [ ] **Step 2: Deploy to the `steve-marcheses-projects` scope as project `santorini2027`**

```bash
cd /Users/stevework/claude-code/santorini2027-teaser
vercel --scope steve-marcheses-projects --prod --yes
```

If prompted to link/create a project, choose to create a new project named `santorini2027` under the `steve-marcheses-projects` scope.

Expected: command completes and prints a production URL like `https://santorini2027.vercel.app` (or similar) — this confirms the deploy worked.

- [ ] **Step 3: Open the production URL and re-run the Task 2 checks against it**

Confirm the deployed page shows the same behavior verified locally (video fills viewport, loops, overlay text legible).

- [ ] **Step 4: Get the DNS records for `santorini2027.com`**

Run: `vercel domains inspect santorini2027.com --scope steve-marcheses-projects` if the domain is already added to the project, otherwise add it first:

```bash
vercel domains add santorini2027.com --scope steve-marcheses-projects
```

Expected output includes the exact DNS records to configure (typically an `A` record for the apex domain pointing at `76.76.21.21` and a `CNAME` for `www` pointing at `cname.vercel-dns.com` — confirm the actual values from the command output, as Vercel occasionally changes these).

- [ ] **Step 5: Report the DNS records to Steve**

Present the exact record type/name/value from Step 4's output so he can add them in the Squarespace domain DNS panel (per spec: Domain/DNS, this step is manual on his end, not automated).
