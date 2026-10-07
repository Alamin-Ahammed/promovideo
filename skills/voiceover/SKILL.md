---
name: voiceover
description: Write the narration script for a promovideo presentation, generate consistent per-line voice clips with Gemini TTS, verify every word, and prepare clips for the video. Also handles a single user-supplied recording. Used by make-video.
---

# Narration

## 1. Write the script (one line per scene)

- One sentence (sometimes two) per scene, in scene order, keyed by scene `id`. Chapters get 2–4 words ("First, campaigns.").
- Budget ≈ 2.4 words per second of the scene's planned length. Shorter is better; scenes stretch if needed.
- Say what the viewer is looking at and why it matters. Name only NEW features. No filler ("as you can see").
- Write brand names the way they should be **spoken** in a `say` field if spelling differs, e.g. `"say": "W-P Smart Pay"`.
- Save as `build/script.json`:

```json
{"voice": "Charon",
 "style": "Read in a warm, confident, friendly product-presenter voice at a moderate pace, with a natural pause at full stops",
 "lines": [{"id": "intro", "text": "Introducing Donations and Campaigns: fundraising, built right into WPSmartPay."}]}
```

Show the script as a table (time · scene · line) and get approval before generating.

## 2. Generate (Gemini TTS)

```bash
"$HOME/.promovideo/venv/bin/python" "${CLAUDE_PLUGIN_ROOT}/scripts/tts_gemini.py" build/script.json vo-raw/
```

- Requires `GEMINI_API_KEY` in the environment (see /promovideo:setup). Never ask the user to paste a key in chat.
- Same `voice` + `style` for every line keeps the narrator consistent.
- Model can be overridden with `GEMINI_TTS_MODEL` if Google renames it.

### Choosing the voice (automatic by default)

Unless the user specified one, choose from the video's context and say why on the storyboard:

| Context | Voice | Style hint |
|---|---|---|
| B2B / SaaS / developer tools / finance – managers & customers | **Charon** (male, clear, informative) | confident, warm, moderate pace |
| Same, if the brand or audience leans female-led, or user asked for female | **Kore** (female, firm, clear) | confident, warm, moderate pace |
| Consumer apps, e-commerce, lifestyle, launches with hype | **Puck** (male, upbeat) / **Aoede** (female, breezy) | energetic, friendly, slightly faster |
| Nonprofits, health, education, community | **Orus** (male, steady) / **Leda** (female, soft) | warm, sincere, unhurried |
| Technical deep dives, internal engineering demos | **Fenrir** (male) / **Zephyr** (female) | clear, neutral, precise |

Overrides: "male"/"female" → swap to the paired voice in the same row; a named voice → use it as-is.
If Google rejects a voice name, list the current prebuilt voices in the error/API docs and pick the closest match.

## 3. Verify every line (mandatory)

```bash
"$HOME/.promovideo/venv/bin/python" "${CLAUDE_PLUGIN_ROOT}/scripts/verify_vo.py" build/script.json vo-raw/
```

TTS sometimes drops or garbles words. Regenerate failures only:

```bash
"$HOME/.promovideo/venv/bin/python" "${CLAUDE_PLUGIN_ROOT}/scripts/tts_gemini.py" build/script.json vo-raw/ --only <ids> --force
```

Repeat up to 3 times; if a line keeps failing, simplify its wording and tell the user.

## 4. Prepare for the video

```bash
"$HOME/.promovideo/venv/bin/python" "${CLAUDE_PLUGIN_ROOT}/scripts/prepare_vo.py" build/script.json vo-raw/ .
```

This writes `public/vo/*.wav` and `src/vo.json`; scenes stretch to fit each line.

## User-supplied single recording

If the user records or generates the whole script as one file:

```bash
"$HOME/.promovideo/venv/bin/python" "${CLAUDE_PLUGIN_ROOT}/scripts/split_vo.py" narration.wav build/script.json vo-raw/
```

It cuts **only inside pauses** (asserted), so no syllable is clipped. Then run verify and prepare. If verify shows words missing
from the recording itself, list those lines with "recorded vs script" and ask the user to regenerate just those lines as
separate files named `<scene-id>.wav` – don't try to hide gaps by splicing.

## Mixing

`render.sh` mixes narration (full level), music (ducked to ~−22 dB under speech, ~−15 dB in gaps) and subtle SFX, then
normalises to −16 LUFS. You cannot listen: report the measured loudness and transcript check, and ask the user to play it once.
