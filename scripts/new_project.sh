#!/usr/bin/env bash
# Usage: new_project.sh <target-dir>
# Copies the Remotion template, installs dependencies and generates the sound effects.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?target directory required}"
[ -e "$DEST/package.json" ] && { echo "Project already exists at $DEST"; exit 0; }
mkdir -p "$DEST"
cp -R "$ROOT/template/." "$DEST/"
mkdir -p "$DEST/build" "$DEST/out" "$DEST/vo-raw"
cd "$DEST"
npm install --silent --no-audit --no-fund
VENV="${PROMOVIDEO_VENV:-$HOME/.promovideo/venv}"
"$VENV/bin/python" "$ROOT/scripts/synth.py" sfx public/audio
echo "Project ready: $DEST  (preview: cd \"$DEST\" && npx remotion studio)"
