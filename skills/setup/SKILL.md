---
name: setup
description: One-time setup for promovideo – checks and installs everything needed to make narrated product presentation videos (Node, ffmpeg, Python env, Chrome capture, Gemini voice key). Use when the user runs /promovideo:setup or the make-video skill reports missing tools.
---

# promovideo setup

Goal: leave the user's machine ready for `/promovideo:make-video`, asking only what is needed.

## 1. Check the environment

Run:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/check_env.sh"
```

Report the result to the user as a short checklist.

## 2. Fix what is missing

Ask before installing anything system-wide. Suggested installs:

| Missing | macOS | Ubuntu/Debian | Windows |
|---|---|---|---|
| Node.js ≥ 18 | `brew install node` | `sudo apt install nodejs npm` | nodejs.org installer |
| ffmpeg | `brew install ffmpeg` | `sudo apt install ffmpeg` | `winget install ffmpeg` |
| Chrome | google.com/chrome | `sudo apt install chromium` | google.com/chrome |

Then create the isolated Python environment (numpy for music/mixing, Whisper for voice verification):

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/setup_python.sh"
```

## 3. Screen capture

- **Logged-in/admin screens:** the Claude in Chrome extension lets Claude open and screenshot pages using the user's own browser session. Ask the user to install/enable it if it is not connected. Without it, the user can supply screenshots instead.
- **Public pages:** captured headlessly by `scripts/capture_public.mjs` – nothing to configure.

## 4. Voiceover (Gemini text-to-speech)

The voice is generated with the Gemini API so every line uses the same voice and style.

1. The user creates a key at https://aistudio.google.com/apikey (free tier available).
2. The user adds it to their shell profile **themselves** – never ask them to paste the key into the chat:
   ```
   export GEMINI_API_KEY="…"      # in ~/.zshrc or ~/.bashrc, then open a new terminal
   ```
3. Tell the user, plainly:
   - The free tier has rate limits, and Google may use free-tier inputs to improve its products. A paid key avoids that.
   - Without a key, they can still record or generate the narration elsewhere (e.g. Google AI Studio's speech generator) as one file; promovideo will split and sync it.

## 5. Notes to pass on

- Rendering needs **at least 5 GB free disk**.
- Videos are built with Remotion. Remotion is free for individuals and companies with up to 3 employees; larger companies need a Remotion company license (remotion.dev/license).

Finish with: "Setup done – run `/promovideo:make-video <PR link | repo | URL | screenshots | docs | recording>`."
