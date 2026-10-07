---
name: make-video
description: Create a polished, narrated presentation/demo video (1080p MP4) about a product, feature or release from any source – PR links, repos, live websites, docs, screenshots, text or screen recordings. Use when the user runs /promovideo:make-video or asks for a promo, launch, release, demo or feature presentation video.
argument-hint: <PR link | repo | URL | screenshots folder | docs | recording | text>
---

# promovideo: make a presentation video

You are producing a short, professional video for managers and customers. The quality bar:
clean real-looking screens, one idea per scene, animated highlights that point at exactly what is
being said, a consistent narrator, music that never fights the voice, no cut-off words, no stale or
irrelevant UI. A viewer who knows nothing should understand what's new and why it matters.

Source input: `$ARGUMENTS`

## Phase 1 – Understand (ask only what you can't find out)

1. Identify the source type(s) and read them yourself first (PR descriptions, diffs, READMEs, site pages, docs).
2. Ask **one** compact question round (AskUserQuestion, ≤ 4 questions). Typical, only if unknown:
   - Audience and purpose (customers / manager / both; launch, release notes, onboarding).
   - Scope: **only what's new** in this change, or the whole product? (Default for PRs: new only.)
   - Length (default 2–3 minutes).
   Do **not** ask about the voice: pick it automatically (see the `voiceover` skill) and state the choice on the storyboard.
   Respect it if the user already named a voice, gender or "I'll record it".
   - Brand assets (logo path, colours) – look in the repo first (`public/img`, `assets`, `logo*`).
   - Where the app runs and whether you may set up demo data there.
   Never ask what the source already answers.

## Phase 2 – Explore in parallel

Launch subagents in one message:
- `source-explorer` per source (PR, Pro/companion PR, repo, site) → returns *new vs existing* features with evidence (file/diff/screen).
- If the app is running, explore it yourself with Claude in Chrome (read-only first) to see real screens.

Classify every candidate item as **NEW** (added by the change) or **EXISTING**. Only NEW items get highlights;
EXISTING screens may appear only as context and must never be labelled as new. When in doubt, check the diff.

## Phase 3 – Plan (get approval)

Use the `storyboard-planner` agent (pass the explorer findings + user answers). Present the storyboard as a
table: time · scene · what's shown · on-screen message · highlights, plus one line: **Narrator:** <voice> – <why>
("reply e.g. 'female voice' or 'voice: Kore' to change"). Include a "Fix before recording" list
(test data to clean, competitor plugins/notices visible, real personal data, broken blocks, update nags).
Wait for the user's go-ahead or edits.

## Phase 4 – Prepare the stage and capture

Follow the `capture` skill. Key rules: back up any database before changing data; realistic fake data
(`@example.com`, neutral org name, `example.org` in the browser bar); hide admin nags/badges with a temporary,
clearly named helper you tell the user to delete; consistent window size; cursor out of frame; crisp 2× captures
for public pages via `scripts/capture_public.mjs`.

## Phase 5 – Build the video

1. Create the project (once): `bash "${CLAUDE_PLUGIN_ROOT}/scripts/new_project.sh" ./promo-video`
2. Put screenshots in `public/shots/`, logo in `public/brand/`, then write `src/video.ts` following
   `reference/scenes.md` (scene types, highlight boxes, zoom guidance).
3. Type-check (`npx tsc --noEmit`) and render 6–10 stills across the timeline
   (`npx remotion still PromoVideo build/fNNN.png --frame=NNN`). Look at every still. Fix overlaps, unreadable
   text, wrong boxes, crops that hide labels. Text in screenshots must be readable at 1080p.

## Phase 6 – Narration

Follow the `voiceover` skill: write one line per scene (≈ 2.4 words/second of scene time), get approval, generate per-line
clips with Gemini, **verify every clip word-by-word** and regenerate failures, then `prepare_vo.py`. If the user
supplies one long recording instead, split it with `split_vo.py` (cuts only in pauses) and verify.
Scenes stretch automatically to fit each line.

## Phase 7 – Render and QA

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/render.sh" ./promo-video <name>
```

Then run the `video-qa` agent on the output (contact sheet, stills at highlight moments, loudness ≈ −16 LUFS,
narration completeness). Fix and re-render until it passes. Never claim you listened to audio – say what was
measured (loudness, transcript match) and ask the user to play it once.

## Phase 8 – Deliver

Reply with: video path + duration, structure (chapters), what was changed on their system (data, helper files,
backups – and what to delete), bugs or rough edges noticed in the product while recording, and any narration
lines that could not be verified. If the user wants to share it, offer to export stills or a GIF.

## Hard-won rules

- One idea per scene; 5–8 s per screen; whole video 2–3 min unless asked.
- Highlights: ≤ 3 per scene, each with a short label; zoom 1.15–1.4 for wide tables (don't crop row names), up to 1.7 for small buttons.
- Mark paid-tier features with the brand badge (`badge: true`), and get that right from the source code.
- Don't show dashboards with setup warnings, empty states, “Pending” everywhere, QA names, or real emails.
- Changing CMS content through CLI scripts can run sanitizers that break markup – write such content via the app UI or direct DB writes, then verify the screen.
- Hash-route SPAs don't reload on navigation; reload after server-side changes.
- Don't trigger print dialogs/alerts in the user's browser; capture print views headlessly instead.
- Narration is mixed outside Remotion (`mix.py`) – never put dozens of `<Audio>` clips in the final render.
- Check free disk space before rendering; render with `--concurrency=1` on low-memory machines.
