#!/usr/bin/env bash
# Checks everything promovideo needs. Prints one line per check; exits 1 if a hard requirement is missing.
ok(){ printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn(){ printf "  \033[33m!\033[0m %s\n" "$1"; }
bad(){ printf "  \033[31m✗\033[0m %s\n" "$1"; FAIL=1; }
FAIL=0
echo "promovideo environment check"
if command -v node >/dev/null; then v=$(node -v | sed 's/v//;s/\..*//'); [ "$v" -ge 18 ] && ok "Node $(node -v)" || bad "Node >= 18 required (found $(node -v))"; else bad "Node.js not found (https://nodejs.org)"; fi
command -v npm >/dev/null && ok "npm $(npm -v)" || bad "npm not found"
command -v ffmpeg >/dev/null && ok "ffmpeg" || bad "ffmpeg not found (macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg)"
if command -v python3 >/dev/null; then ok "python3 $(python3 -V | cut -d' ' -f2)"; else bad "python3 not found"; fi
VENV="${PROMOVIDEO_VENV:-$HOME/.promovideo/venv}"
if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import numpy" 2>/dev/null; then ok "Python venv with numpy ($VENV)"; else warn "Python venv missing – run: bash \"\$CLAUDE_PLUGIN_ROOT/scripts/setup_python.sh\""; fi
CHROME=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "$(command -v google-chrome 2>/dev/null)" "$(command -v chromium 2>/dev/null)"; do [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break; done
[ -n "$CHROME" ] && ok "Chrome found (public-page captures)" || warn "Chrome/Chromium not found – public-page captures need it"
if [ -n "$GEMINI_API_KEY" ]; then ok "GEMINI_API_KEY is set (voiceover via Gemini TTS)"; else warn "GEMINI_API_KEY not set – voiceover will need a manual recording (see /promovideo:setup)"; fi
FREE_GB=$(df -Pk . | awk 'NR==2{printf "%d", $4/1024/1024}')
[ "$FREE_GB" -ge 5 ] && ok "Free disk: ${FREE_GB} GB" || bad "Only ${FREE_GB} GB free – rendering needs at least 5 GB"
exit $FAIL
