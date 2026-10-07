# promovideo

A Claude Code plugin that turns **a PR, repo, live website, docs, screenshots or a screen recording** into a polished,
narrated **1080p presentation video**: the kind you send to your manager or customers when a feature ships.

Claude researches the source, asks only what it can't work out itself, plans a storyboard, prepares clean demo data,
captures the screens, writes the narration, generates a consistent voiceover, animates everything with Remotion and
renders the MP4.

## What you get

- Intro, "what's new" overview, chapters and a recap
- Real screenshots in a browser frame, with camera zooms and numbered highlights that match the narration
- Multi-step flows (checkouts, wizards) shown one step at a time
- One consistent narrator (Gemini text-to-speech), checked word by word, so no words are dropped or clipped
- Original background music and subtle sound effects, kept under the voice and mixed to −16 LUFS

---

## How to use

### 1. Install the plugin

In a terminal:

```bash
claude plugin marketplace add Alamin-Ahammed/promovideo
claude plugin install promovideo@promovideo
```

Restart Claude Code (or open a new session) so the commands load.

### 2. Run setup once

Open Claude Code in any folder and run:

```
/promovideo:setup
```

Claude checks your machine and walks you through anything missing:

- **Node.js 18+ and ffmpeg**: Claude asks before installing them.
- **A Python environment** for music, mixing and voice checks (created in `~/.promovideo/venv`).
- **The Claude in Chrome extension**, optional. It lets Claude capture logged-in or admin screens from your own browser.
  Without it, you can give Claude screenshots instead.
- **A Gemini API key** for the voiceover. Create one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and add
  it to your shell profile **yourself** (don't paste it into the chat):

  ```bash
  echo 'export GEMINI_API_KEY="your-key"' >> ~/.zshrc   # or ~/.bashrc, then open a new terminal
  ```

  No key? You can record or generate the narration as one audio file and Claude will split and sync it.

### 3. Make a video

Go to the folder where you want the video project (usually your product's repo) and run:

```
/promovideo:make-video <source>
```

`<source>` can be one or more of:

| Source | Example |
|---|---|
| Pull request(s) | `/promovideo:make-video https://github.com/acme/app/pull/288 https://github.com/acme/app-pro/pull/130` |
| A running app | `/promovideo:make-video http://localhost:8080/wp-admin – show the new reports area` |
| A live website | `/promovideo:make-video https://acme.com/features/reports` |
| A repo or folder | `/promovideo:make-video ./ – presentation of the whole product for new customers` |
| Screenshots | `/promovideo:make-video ./screens/*.png` |
| Docs or text | `/promovideo:make-video docs/release-notes.md` |
| A screen recording | `/promovideo:make-video ~/Desktop/demo.mov` |

Adding a sentence about the goal helps, e.g. *"for customers, only the new donation features, about 2 minutes"*.

### 4. What happens next

1. **A few questions:** Claude asks one short round about anything it couldn't work out (audience, scope, length,
   whether it may add demo data). It doesn't ask what the source already answers.
2. **Research:** agents read every source in parallel and separate *new* features from *existing* ones.
3. **Storyboard for approval:** a scene-by-scene plan with on-screen text, highlights, the narrator voice it picked,
   and a "fix before recording" list. Reply with changes or "go".
4. **Capture:** Claude backs up any data it will change, seeds realistic demo data, hides admin clutter and captures
   clean screenshots.
5. **Narration script for approval:** one line per scene. Then Claude generates the voice, checks every word and
   regenerates any line that came out wrong.
6. **Render and quality check:** Claude reviews still frames, highlight positions, text legibility, loudness and narration,
   and fixes anything that fails.
7. **Delivery:** the MP4 path plus a short report covering what changed on your system (backups, demo data, temporary
   helper files to delete) and any product issues noticed while recording.

The video project lives in `./promo-video/` and the video in `./promo-video/out/`. To change something, just ask, e.g.
*"make scene 3's title shorter and re-render"* or *"use a female voice and re-render"*.

### Choosing the voice

By default Claude picks the narrator from the video's context (for example, a clear male voice for B2B or SaaS, a warm
voice for nonprofits, an upbeat one for consumer launches) and shows its choice on the storyboard. To override, say
*"female voice"*, *"male voice"*, or name a Gemini voice such as *"voice: Kore"*.

### Tips for the best result

- Point Claude at the **PR or diff** when you only want new features shown. It uses the diff to tell new from existing.
- Let Claude use a **staging or local copy** of your app, because it seeds demo data there (always after a backup).
- Keep **5 GB of disk free**. Rendering needs it.
- Watch the final video once with sound. Claude measures the audio but can't listen to it.

---

## Requirements

| Need | Why |
|---|---|
| Claude Code | Does the research, writing, capturing, building and rendering |
| Node.js ≥ 18, ffmpeg | Remotion rendering and audio processing |
| Python 3 | Music and sound-effect synthesis, mixing, voice verification |
| Chrome + Claude in Chrome extension | Capturing logged-in screens (optional) |
| `GEMINI_API_KEY` | Voiceover via Gemini TTS (optional; you can supply your own recording) |
| ≥ 5 GB free disk | Rendering |

**Gemini free tier:** it is rate-limited, and Google may use free-tier inputs to improve its products. Use a paid key for
confidential material.

## What's inside

```
skills/   setup · make-video · capture · voiceover
agents/   source-explorer · storyboard-planner · video-qa
template/ Remotion project (scenes are plain data in src/video.ts)
scripts/  env check, project init, public-page capture, Gemini TTS, voice verify/split/prepare,
          music/SFX synth, audio mix, render
```

## Licensing

promovideo is MIT licensed. Videos are rendered with [Remotion](https://remotion.dev), which is free for individuals and
companies with up to 3 employees; larger companies need a [Remotion company license](https://remotion.dev/license).
Music and sound effects are generated procedurally by `scripts/synth.py`, with no third-party samples.
