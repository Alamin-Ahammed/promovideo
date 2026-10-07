---
name: capture
description: How promovideo prepares a demo environment and captures clean, consistent screenshots of admin (logged-in) and public pages for a presentation video. Used by make-video; invoke directly when the user only needs screenshots captured.
---

# Capturing screens for a presentation video

## Before touching data

- Ask before changing the user's app data. Back up first (e.g. `mysqldump` into `backups/<db>-before-video-<date>.sql`), and tell the user where.
- Prefer creating content through the app's own UI or API. CLI scripts that re-save CMS content can run sanitizers
  (e.g. WordPress kses without a logged-in user) and silently break markup; if you must, write raw values and re-check the screen.
- Seed **believable** data: a neutral organisation name, ~25–60 people with diverse names and `@example.com` emails, amounts
  and dates spread over 2–3 months, a mix of statuses (mostly completed, a few pending), some repeat customers, some first-time.
  Make IDs ascend with dates if lists sort by ID. Spread "today" timestamps over hours, not minutes.
- Remove or hide: QA/test names ("asdf", "Untitled", "QA …"), competitor plugins, update nags and badges, setup warnings,
  real personal data, broken or deprecated blocks. For admin-chrome noise, use a temporary helper (e.g. a WordPress mu-plugin
  named `zz-demo-recording-clean.php`) and tell the user to delete it afterwards.

## Admin / logged-in screens (Claude in Chrome)

- Work in a new tab. Set a fixed window size once and keep it for every shot (consistency matters more than size).
- Before each capture: navigate, wait for data, `scrollTo(0,0)` (SPAs keep scroll), move the mouse to the far bottom-right
  corner (`hover`) so no cursor shows, then `screenshot` with `save_to_disk: true` at **scale 1**. Copy the saved file into the
  project's `public/shots/<descriptive-name>.jpg`.
- Hash-routed SPAs don't reload on navigation – reload the page after server-side changes.
- Fill modals for "create" shots, capture, then cancel – don't create junk records.
- Never click things that open print dialogs or alerts (they freeze the browser session); capture those views headlessly.
- If the browser shows a "Leave site?" dialog or stops responding, tell the user to dismiss it.

## Public / logged-out pages (headless, 2×)

Write `build/captures.json` and run from the video project:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/capture_public.mjs" build/captures.json
```

- Use `scrollTo` (pixels or selector) for viewport shots and `clip` (selector + `pad`) for cards/forms.
- For multi-step flows chain shots with `sameAsPrevious: true` and actions (`set`, `select`, `check`, `open`, `click`, `submit`).
  Use a test/manual payment method, never real payment credentials.
- Crop tall results (receipts, thank-you pages) to the meaningful content with PIL; keep them for `pan` or `steps` scenes.

## Review every capture

Open each image and check: no cursor, no personal data, no nags, realistic numbers, nothing half-loaded, text readable.
Re-capture rather than explain flaws away.
