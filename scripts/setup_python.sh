#!/usr/bin/env bash
# Creates an isolated Python env for music/SFX synthesis, audio mixing and (optionally) transcription.
set -e
VENV="${PROMOVIDEO_VENV:-$HOME/.promovideo/venv}"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q numpy
# Word-level transcription is used to verify every narration line was spoken completely.
if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
  "$VENV/bin/pip" install -q mlx-whisper || echo "mlx-whisper install failed – voice verification will be skipped"
else
  "$VENV/bin/pip" install -q faster-whisper || echo "faster-whisper install failed – voice verification will be skipped"
fi
echo "Python env ready: $VENV"
